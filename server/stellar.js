import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder
} from '@stellar/stellar-sdk';
import { config } from './config.js';
import { AppError, horizonToAppError, invalidInput } from './errors.js';
import { configureHorizonTimeouts, horizonReadWithRetry, isAmbiguousSubmissionError } from './horizon-utils.js';
import { decimalToStroopsUnchecked, fmtStroops, isAmountString, minBigInt, toStroops } from './money.js';

configureHorizonTimeouts();

export const server = new Horizon.Server(config.horizonUrl);
export const HUELLA = new Asset('HUELLA', config.issuerPub);
export const USDC = new Asset(
  'USDC',
  config.usdcMode === 'circle' ? config.usdcCircleIssuer : config.usdcIssuerMockPub
);

const PENDING_TTL_MS = 5 * 60 * 1000;
const pendingTxs = new Map();

function issuerKeypair() {
  if (!config.issuerSecret) throw new Error('Falta ISSUER_SECRET en .env');
  return Keypair.fromSecret(config.issuerSecret);
}

function treasuryKeypair() {
  if (!config.treasurySecret) throw new Error('Falta TREASURY_SECRET en .env');
  return Keypair.fromSecret(config.treasurySecret);
}

function prunePending() {
  const now = Date.now();
  for (const [hash, entry] of pendingTxs) {
    if (entry.expiresAt <= now) pendingTxs.delete(hash);
  }
}

function rememberTx(tx, kind, meta = {}) {
  prunePending();
  const hash = tx.hash().toString('hex');
  pendingTxs.set(hash, { kind, meta, expiresAt: Date.now() + PENDING_TTL_MS });
  return hash;
}

export function verifyBuiltTx(signedXdr, expectedKind = null) {
  if (typeof signedXdr !== 'string' || signedXdr.length < 32) {
    throw invalidInput('El XDR firmado no es válido');
  }
  let tx;
  try {
    tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  } catch {
    throw invalidInput('El XDR firmado no se pudo leer');
  }
  const hash = tx.hash().toString('hex');
  prunePending();
  const entry = pendingTxs.get(hash);
  if (!entry || entry.expiresAt <= Date.now() || (expectedKind && entry.kind !== expectedKind)) {
    throw new AppError('HASH_MISMATCH', 'La transacción no coincide con una transacción construida por este servidor', 400);
  }
  return { tx, hash, entry };
}

function forgetTx(hash) {
  pendingTxs.delete(hash);
}

export async function loadAccountOrNull(publicKey) {
  try {
    return await horizonReadWithRetry(() => server.accounts().accountId(publicKey).call());
  } catch (err) {
    if (err?.response?.status === 404 || err?.status === 404 || err?.name === 'NotFoundError') return null;
    throw err;
  }
}

function loadAccount(publicKey) {
  return horizonReadWithRetry(() => server.loadAccount(publicKey));
}

export function assetBalance(account, asset) {
  if (!account) return null;
  return account.balances.find((balance) => (
    (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
    balance.asset_code === asset.code &&
    balance.asset_issuer === asset.issuer
  )) || null;
}

export function assertHuellaAccess(account) {
  const trustline = assetBalance(account, HUELLA);
  if (!trustline) throw new AppError('NOT_ONBOARDED', 'Primero tenés que crear tu cuenta de la ruta', 400);
  if (trustline.is_authorized === false) {
    throw new AppError('ACCOUNT_REVOKED', 'Esta cuenta fue suspendida por el Centro de Veteranos', 403);
  }
  return trustline;
}

function nativeBalance(account) {
  return account?.balances.find((balance) => balance.asset_type === 'native')?.balance || '0.0000000';
}

export async function getAccountBalances(publicKey) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) throw invalidInput('La clave pública no es válida');
  const account = await loadAccountOrNull(publicKey);
  if (!account) {
    return { exists: false, xlm: '0', huella: '0', usdc: '0', account: null };
  }
  return {
    exists: true,
    xlm: nativeBalance(account),
    huella: assetBalance(account, HUELLA)?.balance || '0',
    usdc: assetBalance(account, USDC)?.balance || '0',
    account
  };
}

function assertPublicKey(publicKey) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) throw invalidInput('La clave pública no es válida');
}

function hasTrustline(account, asset) {
  return Boolean(assetBalance(account, asset));
}

export async function buildOnboarding(publicKey) {
  assertPublicKey(publicKey);
  const existing = await loadAccountOrNull(publicKey);
  if (existing) {
    if (hasTrustline(existing, HUELLA) && hasTrustline(existing, USDC)) {
      return { alreadyOnboarded: true };
    }
    throw invalidInput('Esa cuenta ya existe pero no tiene el onboarding completo');
  }

  const issuerAccount = await loadAccount(config.issuerPub);
  const tx = new TransactionBuilder(issuerAccount, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: publicKey }))
    .addOperation(Operation.createAccount({ destination: publicKey, startingBalance: '0' }))
    .addOperation(Operation.changeTrust({ asset: HUELLA, source: publicKey }))
    .addOperation(Operation.changeTrust({ asset: USDC, source: publicKey }))
    .addOperation(Operation.setTrustLineFlags({ trustor: publicKey, asset: HUELLA, flags: { authorized: true } }))
    .addOperation(Operation.endSponsoringFutureReserves({ source: publicKey }))
    .setTimeout(300)
    .build();
  rememberTx(tx, 'onboard', { publicKey });
  return { xdr: tx.toXDR() };
}

async function lookupIncludedTransaction(hash) {
  try {
    const record = await horizonReadWithRetry(
      () => server.transactions().transaction(hash).call(),
      { retries: 1 }
    );
    return record?.successful ? { hash: record.hash, ledger: record.ledger } : null;
  } catch {
    return null;
  }
}

async function submitTransactionWithRecovery(tx) {
  try {
    return await server.submitTransaction(tx);
  } catch (err) {
    if (isAmbiguousSubmissionError(err)) {
      const recovered = await lookupIncludedTransaction(tx.hash().toString('hex'));
      if (recovered) return recovered;
    }
    throw err;
  }
}

async function submitServerSigned(tx, hashToForget = null) {
  try {
    const result = await submitTransactionWithRecovery(tx);
    if (hashToForget) forgetTx(hashToForget);
    return result;
  } catch (err) {
    throw horizonToAppError(err);
  }
}

export async function submitOnboarding(signedXdr) {
  const { tx, hash, entry } = verifyBuiltTx(signedXdr, 'onboard');
  tx.sign(issuerKeypair());
  const result = await submitServerSigned(tx, hash);
  return { txHash: result.hash, publicKey: entry.meta.publicKey };
}

export async function mintVisit(publicKey, stopId) {
  assertPublicKey(publicKey);
  if (!/^[a-z0-9-]{1,16}$/.test(stopId)) throw invalidInput('La parada no es válida');
  const account = await loadAccountOrNull(publicKey);
  if (!account) throw new AppError('NOT_ONBOARDED', 'Primero tenés que crear tu cuenta de la ruta', 400);
  assertHuellaAccess(account);
  const issuerAccount = await loadAccount(config.issuerPub);
  const tx = new TransactionBuilder(issuerAccount, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: publicKey,
      asset: HUELLA,
      amount: String(config.huellasPorVisita)
    }))
    .addMemo(Memo.text(`visita:${stopId}`))
    .setTimeout(300)
    .build();
  tx.sign(issuerKeypair());
  const result = await submitServerSigned(tx);
  return { txHash: result.hash };
}

export async function demoFund(publicKey) {
  assertPublicKey(publicKey);
  const account = await loadAccountOrNull(publicKey);
  if (!account) throw new AppError('NOT_ONBOARDED', 'Primero tenés que crear tu cuenta de la ruta', 400);
  if (!isAmountString(config.demoFundUsdc)) throw new Error('DEMO_FUND_USDC inválido');
  const treasuryAccount = await loadAccount(config.treasuryPub);
  const tx = new TransactionBuilder(treasuryAccount, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: publicKey,
      asset: USDC,
      amount: config.demoFundUsdc
    }))
    .addMemo(Memo.text('demo-fund'))
    .setTimeout(300)
    .build();
  tx.sign(treasuryKeypair());
  const result = await submitServerSigned(tx);
  return { txHash: result.hash, amount: config.demoFundUsdc };
}

export function splitPayment({ amount, merchantPctCentro, useHuellas, huellaBalance }) {
  if (!isAmountString(amount)) throw invalidInput('El monto no es válido');
  const amountStroops = toStroops(amount);
  if (amountStroops <= 0n || amountStroops >= toStroops('1000')) {
    throw invalidInput('El monto tiene que ser mayor a 0 y menor a 1000');
  }
  const huellaStroops = decimalToStroopsUnchecked(huellaBalance || '0');
  const canjeStroops = BigInt(config.costoCanje) * 10_000_000n;
  let discount = 0n;
  if (useHuellas && huellaStroops >= canjeStroops) {
    discount = minBigInt(
      amountStroops * BigInt(config.descuentoPct) / 100n,
      toStroops(config.descuentoMaxUsdc)
    );
  }
  const total = amountStroops - discount;
  const pct = BigInt(merchantPctCentro);
  const toCentro = total * pct / 100n;
  const toMerchant = total - toCentro;
  if (toCentro + toMerchant !== total) {
    throw new Error('split inválido: toCentro + toMerchant !== total');
  }
  return {
    amountStroops,
    discountStroops: discount,
    totalStroops: total,
    toMerchantStroops: toMerchant,
    toCentroStroops: toCentro,
    huellasBurned: discount > 0n ? config.costoCanje : 0
  };
}

export function makeDesglose({ split, merchant }) {
  return {
    amount: fmtStroops(split.amountStroops),
    discount: fmtStroops(split.discountStroops),
    total: fmtStroops(split.totalStroops),
    toMerchant: fmtStroops(split.toMerchantStroops),
    toCentro: fmtStroops(split.toCentroStroops),
    huellasBurned: split.huellasBurned,
    pctCentro: merchant.pctCentro,
    merchant: { id: merchant.id, nombre: merchant.nombre }
  };
}

export async function buildPayment({ publicKey, merchant, amount, ref, useHuellas }) {
  assertPublicKey(publicKey);
  if (!merchant?.pub) throw invalidInput('El comercio no es válido');
  if (!/^[A-Za-z0-9]{8}$/.test(ref || '')) throw invalidInput('La referencia tiene que tener 8 caracteres alfanuméricos');
  const balances = await getAccountBalances(publicKey);
  if (!balances.exists) throw new AppError('NOT_ONBOARDED', 'Primero tenés que crear tu cuenta de la ruta', 400);
  if (useHuellas) assertHuellaAccess(balances.account);

  const split = splitPayment({
    amount,
    merchantPctCentro: merchant.pctCentro,
    useHuellas: Boolean(useHuellas),
    huellaBalance: balances.huella
  });
  if (decimalToStroopsUnchecked(balances.usdc || '0') < split.totalStroops) {
    throw new AppError('INSUFFICIENT_BALANCE', 'No tenés saldo suficiente', 400);
  }
  const desglose = makeDesglose({ split, merchant });
  const visitorAccount = await loadAccount(publicKey);
  const builder = new TransactionBuilder(visitorAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: merchant.pub,
      asset: USDC,
      amount: fmtStroops(split.toMerchantStroops)
    }));
  if (split.toCentroStroops > 0n) {
    builder.addOperation(Operation.payment({
      destination: config.centroPub,
      asset: USDC,
      amount: fmtStroops(split.toCentroStroops)
    }));
  }
  if (split.huellasBurned > 0) {
    builder.addOperation(Operation.payment({
      destination: config.issuerPub,
      asset: HUELLA,
      amount: String(split.huellasBurned)
    }));
  }
  const tx = builder
    .addMemo(Memo.text(`pago:${ref}`))
    .setTimeout(300)
    .build();
  rememberTx(tx, 'payment', { publicKey, merchantId: merchant.id, ref, desglose });
  return { xdr: tx.toXDR(), desglose };
}

export async function submitPayment(signedXdr) {
  const { tx, hash, entry } = verifyBuiltTx(signedXdr, 'payment');
  try {
    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      issuerKeypair(),
      '1000',
      tx,
      Networks.TESTNET
    );
    feeBump.sign(issuerKeypair());
    const result = await submitTransactionWithRecovery(feeBump);
    forgetTx(hash);
    return { txHash: result.hash, desglose: entry.meta.desglose, meta: entry.meta };
  } catch (err) {
    throw horizonToAppError(err);
  }
}

export function horizonDetail(err) {
  return err?.response?.data?.extras?.result_codes || err?.response?.data || err?.message;
}
