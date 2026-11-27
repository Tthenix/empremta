import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
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

async function verifyHttpContract(visitor, paymentInfo) {
  if (!useHttp) return;
  const cfg = await getJson('/api/config');
  assert(cfg.network === 'testnet' && cfg.demoMode === true, 'config HTTP inesperada');
  assert(cfg.usdcAsset?.code === 'USDC' && cfg.huellaAsset?.code === 'HUELLA', 'assets faltantes en config');
  const stopList = await getJson('/api/stops');
  assert(Array.isArray(stopList) && stopList.length === 3, 'GET /api/stops no devolvió 3 paradas');
  assert(!('historia' in stopList[0]) && !('code' in stopList[0]), 'GET /api/stops expone historia o code');
  const stopDetail = await getJson('/api/stops/pc');
  assert(typeof stopDetail.historia === 'string' && stopDetail.historia.startsWith('['), 'detalle de parada sin placeholder de historia');
  const merchants = await getJson('/api/merchants');
  assert(Array.isArray(merchants) && merchants[0]?.pub, 'GET /api/merchants sin pub');
  const account = await getJson(`/api/account/${visitor.publicKey()}`);
  assert(account.exists === true && account.onboarded === true, 'account no quedó onboarded');
  assert(account.visits.length === 3, `account devolvió ${account.visits.length} visitas`);
  assert(account.demoFunded === true, 'account no marca demoFunded');
  const merchantPayments = await getJson('/api/merchants/m1/payments');
  assert(merchantPayments.some((payment) => payment.txHash === paymentInfo.payment.txHash && payment.ref === paymentInfo.ref), 'el pago no aparece en la caja del comercio');
  const transparency = await getJson('/api/transparencia');
  assert(transparency.lista.some((payment) => payment.txHash === paymentInfo.payment.txHash), 'el pago no aparece en transparencia');
  assert(stroopsOf(transparency.totalCentro) >= stroopsOf('0.1125'), 'totalCentro de transparencia demasiado bajo');
  console.log('Contrato HTTP verificado en config, stops, account, merchants, payments y transparencia');
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
  await verifyHttpContract(visitor, paymentInfo);
  console.log(useHttp ? 'M1+M2+M3+M4 HTTP OK' : 'M1+M2+M3 OK');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(stopHttpServer);
