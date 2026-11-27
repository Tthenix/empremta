import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { config } from '../server/config.js';
import { getMerchant, stops } from '../server/content.js';
import { recordVisitor } from '../server/db.js';
import { decimalToStroopsUnchecked } from '../server/money.js';
import { buildMerchantPayment, fundDemoOnce, submitMerchantPayment } from '../server/payments.js';
import { buildMerchantRedemption, submitMerchantRedemption } from '../server/redemptions.js';
import {
  assetBalance,
  buildOnboarding,
  getAccountBalances,
  HUELLA,
  server,
  submitOnboarding,
  USDC
} from '../server/stellar.js';
import { registerVisit, stopCode } from '../server/visits.js';

const EXPLORER_TX = 'https://stellar.expert/explorer/testnet/tx/';
const EXPLORER_ACCOUNT = 'https://stellar.expert/explorer/testnet/account/';
const useHttp = process.argv.includes('--http');
const apiPort = Number(process.env.E2E_API_PORT || 3100);
const apiBase = process.env.E2E_API_URL || `http://localhost:${apiPort}`;
let serverProcess = null;

function signXdr(xdr, keypair) {
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
  tx.sign(keypair);
  return tx.toXDR();
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

function printTx(label, hash) {
  console.log(`${label}: ${hash}`);
  console.log(`  ${EXPLORER_TX}${hash}`);
}

async function parseResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || `HTTP ${res.status}`);
    err.code = json?.error?.code;
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function postJson(path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse(res);
}

async function getJson(path) {
  const res = await fetch(`${apiBase}${path}`);
  return parseResponse(res);
}

async function waitForHttpServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      await getJson('/api/config');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error('el server HTTP no levantó a tiempo');
}

async function startHttpServerIfNeeded() {
  if (!useHttp) return;
  serverProcess = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, PORT: String(apiPort) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  serverProcess.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));
  await waitForHttpServer();
  console.log(`Server HTTP listo en ${apiBase}`);
}

async function stopHttpServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

function runRevocar(publicKey, { restore = false } = {}) {
  const args = ['run', 'revocar', '--', publicKey];
  if (restore) args.push('--restore');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return new Promise((resolve, reject) => {
    const child = spawn(npmCmd, args, {
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
      process.stdout.write(chunk.toString().split('\n').map((line) => line ? `  [revocar] ${line}\n` : '').join(''));
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
      process.stderr.write(chunk.toString().split('\n').map((line) => line ? `  [revocar] ${line}\n` : '').join(''));
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`npm run revocar salió con código ${code}: ${output}`));
        return;
      }
      const txHash = output.match(/(?:tx:\s*|\/tx\/)([a-f0-9]{64})/i)?.[1] || null;
      resolve({ output, txHash });
    });
  });
}

async function apiOnboardBuild(publicKey) {
  if (useHttp) return postJson('/api/onboard/build', { publicKey });
  return buildOnboarding(publicKey);
}

async function apiOnboardSubmit(signedXdr) {
  if (useHttp) return postJson('/api/onboard/submit', { signedXdr });
  const result = await submitOnboarding(signedXdr);
  if (result.publicKey) recordVisitor(result.publicKey, result.txHash);
  return { txHash: result.txHash };
}

async function apiVisit(payload) {
  if (useHttp) return postJson('/api/visit', payload);
  return registerVisit(payload);
}

async function apiDemoFund(publicKey) {
  if (useHttp) return postJson('/api/demo/fund', { publicKey });
  return fundDemoOnce(publicKey);
}

async function apiPayBuild(payload) {
  if (useHttp) return postJson('/api/pay/build', payload);
  return buildMerchantPayment(payload);
}

async function apiPaySubmit(signedXdr) {
  if (useHttp) return postJson('/api/pay/submit', { signedXdr });
  return submitMerchantPayment(signedXdr);
}

async function apiRedeemBuild(payload) {
  if (useHttp) return postJson('/api/redeem/build', payload);
  return buildMerchantRedemption(payload);
}

async function apiRedeemSubmit(signedXdr) {
  if (useHttp) return postJson('/api/redeem/submit', { signedXdr });
  return submitMerchantRedemption(signedXdr);
}

async function onboardVisitor(visitor) {
  const built = await apiOnboardBuild(visitor.publicKey());
  assert(!built.alreadyOnboarded, 'una cuenta nueva no debería venir onboarded');
  assert(typeof built.xdr === 'string' && built.xdr.length > 100, 'onboard/build no devolvió un XDR');
  const signedXdr = signXdr(built.xdr, visitor);
  const submitted = await apiOnboardSubmit(signedXdr);
  printTx('Onboarding tx', submitted.txHash);
  return submitted.txHash;
}

async function verifyOnboarding(visitor) {
  const balances = await getAccountBalances(visitor.publicKey());
  assert(balances.exists, 'la cuenta del visitante no existe después del onboarding');
  const account = balances.account;
  const huella = assetBalance(account, HUELLA);
  const usdc = assetBalance(account, USDC);
  assert(balances.xlm === '0.0000000', `XLM esperado 0.0000000, recibido ${balances.xlm}`);
  assert(huella, 'falta trustline HUELLA');
  assert(usdc, 'falta trustline USDC');
  assert(huella.is_authorized === true, 'la trustline HUELLA no quedó autorizada');
  assert(
    account.sponsor === config.issuerPub || huella.sponsor === config.issuerPub || usdc.sponsor === config.issuerPub,
    'ninguna entrada muestra sponsor ISSUER'
  );
  console.log(`Onboarding verificado: XLM=${balances.xlm}, HUELLA autorizada=${huella.is_authorized}`);
}

function visitPayload(visitor, stop) {
  const ts = Date.now();
  const rawSignature = visitor.sign(Buffer.from(`visita:${stop.id}:${ts}`, 'utf8'));
  const signature = process.env.E2E_COMMA_SIG === '1'
    ? rawSignature.toString('base64')
    : Buffer.from(rawSignature).toString('base64');
  return {
    publicKey: visitor.publicKey(),
    stopId: stop.id,
    code: stopCode(stop.id),
    lat: stop.lat,
    lng: stop.lng,
    ts,
    signature
  };
}

async function registerThreeVisits(visitor) {
  const hashes = [];
  for (const stop of stops) {
    const result = await apiVisit(visitPayload(visitor, stop));
    hashes.push({ stopId: stop.id, txHash: result.txHash, huellas: result.huellas });
    printTx(`Visita ${stop.id} tx`, result.txHash);
    console.log(`  saldo HUELLA informado: ${result.huellas}`);
  }
  const balances = await getAccountBalances(visitor.publicKey());
  assert(balances.huella === '30.0000000', `saldo HUELLA esperado 30.0000000, recibido ${balances.huella}`);

  let duplicateRejected = false;
  try {
    await apiVisit(visitPayload(visitor, stops[0]));
  } catch (err) {
    duplicateRejected = err?.code === 'ALREADY_VISITED';
  }
  assert(duplicateRejected, 'una visita repetida no fue rechazada con ALREADY_VISITED');
  console.log('Visita repetida rechazada correctamente (ALREADY_VISITED)');
  return hashes;
}

function stroopsOf(balance) {
  return decimalToStroopsUnchecked(balance || '0');
}

async function verifyDemoFundAndPayment(visitor) {
  const funded = await apiDemoFund(visitor.publicKey());
  printTx('Demo fund tx', funded.txHash);
  const afterFund = await getAccountBalances(visitor.publicKey());
  assert(stroopsOf(afterFund.usdc) === stroopsOf(config.demoFundUsdc), `USDC esperado ${config.demoFundUsdc}, recibido ${afterFund.usdc}`);

  const merchant = getMerchant('m1');
  const beforeVisitor = await getAccountBalances(visitor.publicKey());
  const beforeMerchant = await getAccountBalances(merchant.pub);
  const beforeCentro = await getAccountBalances(config.centroPub);
  const ref = crypto.randomBytes(4).toString('hex').toUpperCase();
  const built = await apiPayBuild({
    publicKey: visitor.publicKey(),
    merchantId: 'm1',
    amount: '2.50',
    ref,
    useHuellas: true
  });
  assert(built.desglose.amount === '2.5000000', `amount inesperado ${built.desglose.amount}`);
  assert(built.desglose.discount === '0.2500000', `discount inesperado ${built.desglose.discount}`);
  assert(built.desglose.total === '2.2500000', `total inesperado ${built.desglose.total}`);
  assert(built.desglose.toMerchant === '2.1375000', `toMerchant inesperado ${built.desglose.toMerchant}`);
  assert(built.desglose.toCentro === '0.1125000', `toCentro inesperado ${built.desglose.toCentro}`);
  assert(built.desglose.huellasBurned === 30, `huellasBurned inesperado ${built.desglose.huellasBurned}`);
  console.log('Desglose verificado antes de firmar:', JSON.stringify(built.desglose));

  const signedPayment = signXdr(built.xdr, visitor);
  const payment = await apiPaySubmit(signedPayment);
  printTx('Pago fee-bump tx', payment.txHash);

  const afterVisitor = await getAccountBalances(visitor.publicKey());
  const afterMerchant = await getAccountBalances(merchant.pub);
  const afterCentro = await getAccountBalances(config.centroPub);
  const merchantDiff = stroopsOf(afterMerchant.usdc) - stroopsOf(beforeMerchant.usdc);
  const centroDiff = stroopsOf(afterCentro.usdc) - stroopsOf(beforeCentro.usdc);
  assert(merchantDiff === stroopsOf(built.desglose.toMerchant), `merchant diff ${merchantDiff} != ${built.desglose.toMerchant}`);
  assert(centroDiff === stroopsOf(built.desglose.toCentro), `centro diff ${centroDiff} != ${built.desglose.toCentro}`);
  assert(stroopsOf(afterVisitor.huella) === 0n, `HUELLA esperado 0, recibido ${afterVisitor.huella}`);
  assert(afterVisitor.xlm === '0.0000000', `XLM esperado 0.0000000 después del fee-bump, recibido ${afterVisitor.xlm}`);
  assert(stroopsOf(beforeVisitor.usdc) - stroopsOf(afterVisitor.usdc) === stroopsOf(built.desglose.total), 'el visitante no pagó exactamente el total con descuento');
  console.log(`Pago verificado: merchant +${built.desglose.toMerchant}, centro +${built.desglose.toCentro}, HUELLA=${afterVisitor.huella}, XLM=${afterVisitor.xlm}`);
  return { payment, ref };
}

async function verifyCanjeFlow() {
  const visitor = Keypair.random();
  console.log(`Visitante para canje: ${visitor.publicKey()}`);
  console.log(`Cuenta: ${EXPLORER_ACCOUNT}${visitor.publicKey()}`);
  await onboardVisitor(visitor);
  for (const stop of stops) {
    await apiVisit(visitPayload(visitor, stop));
  }
  const before = await getAccountBalances(visitor.publicKey());
  assert(stroopsOf(before.huella) === stroopsOf('30'), `canje: HUELLA inicial esperado 30, recibido ${before.huella}`);
  assert(stroopsOf(before.usdc) === 0n, `canje: el visitante no debería necesitar USDC, tiene ${before.usdc}`);

  const merchant = getMerchant('m1');
  const beforeMerchant = await getAccountBalances(merchant.pub);
  const beforeCentro = await getAccountBalances(config.centroPub);
  const ref = crypto.randomBytes(4).toString('hex').toUpperCase();
  const built = await apiRedeemBuild({
    publicKey: visitor.publicKey(),
    merchantId: 'm1',
    amountArs: '10000',
    ref
  });
  assert(built.desglose.amountArs === '10000.00', `amountArs inesperado ${built.desglose.amountArs}`);
  assert(built.desglose.discountArs === '1000.00', `discountArs inesperado ${built.desglose.discountArs}`);
  assert(built.desglose.totalArs === '9000.00', `totalArs inesperado ${built.desglose.totalArs}`);
  assert(built.desglose.aporteUsdc === '0.3214285', `aporteUsdc inesperado ${built.desglose.aporteUsdc}`);
  assert(built.desglose.huellasBurned === 30, `huellasBurned canje inesperado ${built.desglose.huellasBurned}`);

  const signed = signXdr(built.xdr, visitor);
  const redemption = await apiRedeemSubmit(signed);
  printTx('Canje fee-bump tx', redemption.txHash);

  const afterVisitor = await getAccountBalances(visitor.publicKey());
  const afterMerchant = await getAccountBalances(merchant.pub);
  const afterCentro = await getAccountBalances(config.centroPub);
  const aporte = stroopsOf(built.desglose.aporteUsdc);
  assert(stroopsOf(afterCentro.usdc) - stroopsOf(beforeCentro.usdc) === aporte, 'el centro no recibió exactamente el aporte calculado');
  assert(stroopsOf(beforeMerchant.usdc) - stroopsOf(afterMerchant.usdc) === aporte, 'el comercio no pagó exactamente el aporte calculado');
  assert(stroopsOf(afterVisitor.huella) === 0n, `HUELLA esperado 0 tras canje, recibido ${afterVisitor.huella}`);
  assert(afterVisitor.xlm === '0.0000000', `XLM esperado 0 tras canje, recibido ${afterVisitor.xlm}`);
  assert(stroopsOf(afterVisitor.usdc) === 0n, `el visitante no debería necesitar USDC tras el canje, tiene ${afterVisitor.usdc}`);

  let duplicateError = null;
  try {
    await apiRedeemBuild({ publicKey: visitor.publicKey(), merchantId: 'm1', amountArs: '10000', ref });
  } catch (err) {
    duplicateError = err;
  }
  assert(duplicateError?.code === 'ALREADY_PAID', `ref duplicada de canje rechazada con código inesperado: ${duplicateError?.code || 'sin error'}`);

  let insufficientError = null;
  try {
    await apiRedeemBuild({
      publicKey: visitor.publicKey(),
      merchantId: 'm1',
      amountArs: '10000',
      ref: crypto.randomBytes(4).toString('hex').toUpperCase()
    });
  } catch (err) {
    insufficientError = err;
  }
  assert(insufficientError?.code === 'INSUFFICIENT_BALANCE', `canje sin 30 Huellas rechazado con código inesperado: ${insufficientError?.code || 'sin error'}`);
  console.log(`Canje verificado: centro +${built.desglose.aporteUsdc}, comercio -${built.desglose.aporteUsdc}, visitante sin USDC ni XLM`);
  return { redemption, ref, desglose: built.desglose };
}

async function verifyTransferredHuellasWithoutVisits() {
  const donor = Keypair.random();
  const recipient = Keypair.random();
  await onboardVisitor(donor);
  for (const stop of stops) {
    await apiVisit(visitPayload(donor, stop));
  }
  await onboardVisitor(recipient);

  const donorAccount = await server.loadAccount(donor.publicKey());
  const inner = new TransactionBuilder(donorAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: recipient.publicKey(),
      asset: HUELLA,
      amount: '30'
    }))
    .setTimeout(180)
    .build();
  inner.sign(donor);
  const issuer = Keypair.fromSecret(config.issuerSecret);
  const feeBump = TransactionBuilder.buildFeeBumpTransaction(issuer, '1000', inner, Networks.TESTNET);
  feeBump.sign(issuer);
  const transfer = await server.submitTransaction(feeBump);
  printTx('Transferencia HUELLA sin visitas del receptor', transfer.hash);

  const recipientBalances = await getAccountBalances(recipient.publicKey());
  assert(stroopsOf(recipientBalances.huella) === stroopsOf('30'), 'el receptor no recibió 30 HUELLA transferidas');

  for (const attempt of [
    () => apiRedeemBuild({
      publicKey: recipient.publicKey(),
      merchantId: 'm1',
      amountArs: '10000',
      ref: crypto.randomBytes(4).toString('hex').toUpperCase()
    }),
    () => apiPayBuild({
      publicKey: recipient.publicKey(),
      merchantId: 'm1',
      amount: '2.5',
      ref: crypto.randomBytes(4).toString('hex').toUpperCase(),
      useHuellas: true
    })
  ]) {
    let transferError = null;
    try {
      await attempt();
    } catch (err) {
      transferError = err;
    }
    assert(transferError?.code === 'NOT_ENOUGH_VISITS', `HUELLA transferida sin visitas rechazada con código inesperado: ${transferError?.code || 'sin error'}`);
  }
  console.log('Huerfanas transferidas sin visitas rechazadas en canje y pago (NOT_ENOUGH_VISITS)');
}

async function verifyHttpContract(visitor, paymentInfo, canjeInfo) {
  if (!useHttp) return;
  const cfg = await getJson('/api/config');
  assert(cfg.network === 'testnet' && cfg.demoMode === true, 'config HTTP inesperada');
  assert(cfg.usdcAsset?.code === 'USDC' && cfg.huellaAsset?.code === 'HUELLA', 'assets faltantes en config');
  const tomlResponse = await fetch(`${apiBase}/.well-known/stellar.toml`);
  assert(tomlResponse.ok, 'stellar.toml no responde 200');
  assert(tomlResponse.headers.get('access-control-allow-origin') === '*', 'stellar.toml no expone CORS *');
  const stellarToml = await tomlResponse.text();
  assert(stellarToml.includes('code = "HUELLA"'), 'stellar.toml no declara HUELLA');
  assert(stellarToml.includes(`issuer = "${cfg.huellaAsset.issuer}"`), 'stellar.toml no declara el issuer HUELLA correcto');
  assert(stellarToml.includes('status = "test"'), 'stellar.toml no marca HUELLA como asset de test');
  const stopList = await getJson('/api/stops');
  assert(Array.isArray(stopList) && stopList.length === 3, 'GET /api/stops no devolvió 3 paradas');
  assert(!('historia' in stopList[0]) && !('code' in stopList[0]), 'GET /api/stops expone historia o code');
  const stopDetail = await getJson('/api/stops/pc');
  assert(typeof stopDetail.historia === 'string' && stopDetail.historia.length > 0, 'detalle de parada sin historia');
  const merchants = await getJson('/api/merchants');
  assert(Array.isArray(merchants) && merchants[0]?.pub, 'GET /api/merchants sin pub');
  const account = await getJson(`/api/account/${visitor.publicKey()}`);
  assert(account.exists === true && account.onboarded === true, 'account no quedó onboarded');
  assert(account.visits.length === 3, `account devolvió ${account.visits.length} visitas`);
  assert(account.demoFunded === true, 'account no marca demoFunded');
  const merchantPayments = await getJson('/api/merchants/m1/payments');
  assert(merchantPayments.some((payment) => payment.txHash === paymentInfo.payment.txHash && payment.ref === paymentInfo.ref), 'el pago no aparece en la caja del comercio');
  const merchantRedemptions = await getJson('/api/merchants/m1/redemptions');
  assert(merchantRedemptions.some((redemption) => redemption.txHash === canjeInfo.redemption.txHash && redemption.ref === canjeInfo.ref), 'el canje no aparece en la caja del comercio');
  const transparency = await getJson('/api/transparencia');
  assert(transparency.lista.some((payment) => payment.txHash === paymentInfo.payment.txHash), 'el pago no aparece en transparencia');
  assert(transparency.lista.some((redemption) => redemption.txHash === canjeInfo.redemption.txHash && redemption.tipo === 'canje'), 'el canje no aparece en transparencia');
  assert(stroopsOf(transparency.totalCentro) >= stroopsOf('0.1125'), 'totalCentro de transparencia demasiado bajo');
  assert(transparency.onChain?.source === 'horizon', `transparencia on-chain no vino de Horizon: ${transparency.onChain?.source}`);
  assert(
    transparency.onChain.lista.some((payment) => payment.txHash === paymentInfo.payment.txHash),
    'el último pago e2e no aparece en onChain.lista'
  );
  assert(stroopsOf(transparency.onChain.totalRecibido) >= stroopsOf(transparency.totalCentro), 'totalRecibido on-chain menor que el total de la base');
  console.log('Contrato HTTP verificado en config, stops, account, merchants, payments y transparencia on-chain');
}

async function verifyRevocationFlow() {
  const visitor = Keypair.random();
  console.log(`Visitante para revocación: ${visitor.publicKey()}`);
  console.log(`Cuenta: ${EXPLORER_ACCOUNT}${visitor.publicKey()}`);
  await onboardVisitor(visitor);

  const revoked = await runRevocar(visitor.publicKey());
  assert(revoked.txHash, 'el script de revocación no imprimió hash de transacción');
  printTx('Revocación HUELLA tx', revoked.txHash);

  if (useHttp) {
    const transparency = await getJson('/api/transparencia');
    assert(
      transparency.revocaciones?.some((item) => item.pubkey === visitor.publicKey() && item.txHash === revoked.txHash),
      'la cuenta revocada no aparece en la traza pública de transparencia'
    );
    console.log('Traza pública de revocación verificada en /api/transparencia');
  }

  let visitError = null;
  try {
    await apiVisit(visitPayload(visitor, stops[0]));
  } catch (err) {
    visitError = err;
  }
  assert(visitError?.code === 'ACCOUNT_REVOKED', `visita revocada rechazada con código inesperado: ${visitError?.code || 'sin error'}`);
  assert(
    visitError?.message === 'Esta cuenta fue suspendida por el Centro de Veteranos',
    'el error de cuenta suspendida no es el mensaje humano esperado'
  );

  let payError = null;
  try {
    await apiPayBuild({
      publicKey: visitor.publicKey(),
      merchantId: 'm1',
      amount: '1.00',
      ref: crypto.randomBytes(4).toString('hex').toUpperCase(),
      useHuellas: true
    });
  } catch (err) {
    payError = err;
  }
  assert(payError?.code === 'ACCOUNT_REVOKED', `pago con Huellas revocadas rechazado con código inesperado: ${payError?.code || 'sin error'}`);
  console.log('Visita y pago con Huellas rechazados correctamente para cuenta suspendida');

  const restored = await runRevocar(visitor.publicKey(), { restore: true });
  assert(restored.txHash, 'el script de restauración no imprimió hash de transacción');
  printTx('Restauración HUELLA tx', restored.txHash);

  const visit = await apiVisit(visitPayload(visitor, stops[0]));
  printTx('Visita tras restauración tx', visit.txHash);
  assert(stroopsOf(visit.huellas) === stroopsOf('10'), `saldo HUELLA esperado 10 tras restaurar, recibido ${visit.huellas}`);
  console.log('Cuenta restaurada y visita posterior verificada');
}

async function main() {
  await startHttpServerIfNeeded();
  const visitor = Keypair.random();
  console.log(`Modo: ${useHttp ? 'HTTP' : 'directo'}`);
  console.log(`Visitante de prueba: ${visitor.publicKey()}`);
  console.log(`Cuenta: ${EXPLORER_ACCOUNT}${visitor.publicKey()}`);

  await onboardVisitor(visitor);
  await verifyOnboarding(visitor);
  await registerThreeVisits(visitor);
  const paymentInfo = await verifyDemoFundAndPayment(visitor);
  const canjeInfo = await verifyCanjeFlow();
  await verifyTransferredHuellasWithoutVisits();
  await verifyRevocationFlow();
  await verifyHttpContract(visitor, paymentInfo, canjeInfo);
  console.log(useHttp ? 'M1+M2+M3+M4+F1+F2 HTTP OK' : 'M1+M2+M3+F2 OK');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(stopHttpServer);
