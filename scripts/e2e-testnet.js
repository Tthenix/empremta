import crypto from 'node:crypto';
import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { config } from '../server/config.js';
import { getMerchant, stops } from '../server/content.js';
import { recordVisitor } from '../server/db.js';
import { decimalToStroopsUnchecked } from '../server/money.js';
import { buildMerchantPayment, fundDemoOnce, submitMerchantPayment } from '../server/payments.js';
import {
  assetBalance,
  buildOnboarding,
  getAccountBalances,
  HUELLA,
  submitOnboarding,
  USDC
} from '../server/stellar.js';
import { registerVisit, stopCode } from '../server/visits.js';

const EXPLORER_TX = 'https://stellar.expert/explorer/testnet/tx/';
const EXPLORER_ACCOUNT = 'https://stellar.expert/explorer/testnet/account/';

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

async function onboardVisitor(visitor) {
  const built = await buildOnboarding(visitor.publicKey());
  assert(!built.alreadyOnboarded, 'una cuenta nueva no debería venir onboarded');
  const signedXdr = signXdr(built.xdr, visitor);
  const submitted = await submitOnboarding(signedXdr);
  recordVisitor(visitor.publicKey(), submitted.txHash);
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
  const signature = Buffer.from(visitor.sign(Buffer.from(`visita:${stop.id}:${ts}`, 'utf8'))).toString('base64');
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
    const result = await registerVisit(visitPayload(visitor, stop));
    hashes.push({ stopId: stop.id, txHash: result.txHash, huellas: result.huellas });
    printTx(`Visita ${stop.id} tx`, result.txHash);
    console.log(`  saldo HUELLA informado: ${result.huellas}`);
  }
  const balances = await getAccountBalances(visitor.publicKey());
  assert(balances.huella === '30.0000000', `saldo HUELLA esperado 30.0000000, recibido ${balances.huella}`);

  let duplicateRejected = false;
  try {
    await registerVisit(visitPayload(visitor, stops[0]));
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
  const funded = await fundDemoOnce(visitor.publicKey());
  printTx('Demo fund tx', funded.txHash);
  const afterFund = await getAccountBalances(visitor.publicKey());
  assert(stroopsOf(afterFund.usdc) === stroopsOf(config.demoFundUsdc), `USDC esperado ${config.demoFundUsdc}, recibido ${afterFund.usdc}`);

  const merchant = getMerchant('m1');
  const beforeVisitor = await getAccountBalances(visitor.publicKey());
  const beforeMerchant = await getAccountBalances(merchant.pub);
  const beforeCentro = await getAccountBalances(config.centroPub);
  const ref = crypto.randomBytes(4).toString('hex').toUpperCase();
  const built = await buildMerchantPayment({
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
  const payment = await submitMerchantPayment(signedPayment);
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
}

async function main() {
  const visitor = Keypair.random();
  console.log(`Visitante de prueba: ${visitor.publicKey()}`);
  console.log(`Cuenta: ${EXPLORER_ACCOUNT}${visitor.publicKey()}`);

  await onboardVisitor(visitor);
  await verifyOnboarding(visitor);
  await registerThreeVisits(visitor);
  await verifyDemoFundAndPayment(visitor);
  console.log('M1+M2+M3 OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
