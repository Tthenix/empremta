import { config } from './config.js';
import { horizonReadWithRetry } from './horizon-utils.js';
import { decimalToStroopsUnchecked, fmtStroops } from './money.js';
import { assetBalance, HUELLA, server, USDC } from './stellar.js';

const CACHE_MS = 20_000;
const MAX_PAGES = 50;
let centroCache = null;
let revocationsCache = null;

function isConfiguredUsdcPayment(record) {
  return record.type === 'payment' &&
    record.to === config.centroPub &&
    (record.asset_type === 'credit_alphanum4' || record.asset_type === 'credit_alphanum12') &&
    record.asset_code === USDC.code &&
    record.asset_issuer === USDC.issuer;
}

async function collectHorizonRecords(firstPage, keep, label) {
  const records = [];
  let page = firstPage;
  for (let pages = 1; ; pages += 1) {
    records.push(...page.records.filter(keep));
    if (page.records.length === 0) break;
    if (pages >= MAX_PAGES) {
      throw new Error(`${label} supera ${MAX_PAGES * 200} operaciones en Horizon`);
    }
    page = await horizonReadWithRetry(() => page.next());
  }
  return records;
}

async function incomingCentroPayments() {
  const firstPage = await horizonReadWithRetry(() => server.payments()
    .forAccount(config.centroPub)
    .order('desc')
    .limit(200)
    .call());
  return collectHorizonRecords(firstPage, isConfiguredUsdcPayment, 'La cuenta del centro');
}

function paymentListItem(record) {
  return {
    txHash: record.transaction_hash,
    amount: record.amount,
    from: record.from,
    createdAt: Date.parse(record.created_at)
  };
}

function dbFallback(reason) {
  return { source: 'db-fallback', reason };
}

export async function getCentroOnChain() {
  const now = Date.now();
  if (centroCache && now - centroCache.fetchedAt < CACHE_MS) {
    return centroCache.value;
  }

  try {
    const [account, payments] = await Promise.all([
      horizonReadWithRetry(() => server.accounts().accountId(config.centroPub).call()),
      incomingCentroPayments()
    ]);
    const total = payments.reduce(
      (sum, payment) => sum + decimalToStroopsUnchecked(payment.amount),
      0n
    );
    const value = {
      source: 'horizon',
      balanceUsdc: assetBalance(account, USDC)?.balance || '0',
      totalRecibido: fmtStroops(total),
      pagos: payments.length,
      lista: payments.map(paymentListItem),
      fetchedAt: now
    };
    centroCache = { fetchedAt: now, value };
    return value;
  } catch (err) {
    console.warn('Transparencia on-chain: usando fallback de base de datos:', err?.message || err);
    const value = dbFallback('No se pudo leer la red Stellar en este momento');
    centroCache = { fetchedAt: now, value };
    return value;
  }
}

function isHuellaFlagOperation(record) {
  return record.type === 'set_trust_line_flags' &&
    record.source_account === config.issuerPub &&
    record.asset_code === HUELLA.code &&
    record.asset_issuer === HUELLA.issuer &&
    Boolean(record.trustor);
}

function hasAuthorizedFlag(values) {
  return Array.isArray(values) && values.some((value) => value === 1 || value === 'authorized');
}

function isRevocationOperation(record) {
  return hasAuthorizedFlag(record.clear_flags) || hasAuthorizedFlag(record.clear_flags_s);
}

async function huellaFlagOperations() {
  const firstPage = await horizonReadWithRetry(() => server.operations()
    .forAccount(config.issuerPub)
    .order('desc')
    .limit(200)
    .call());
  return collectHorizonRecords(firstPage, isHuellaFlagOperation, 'Las operaciones del emisor');
}

function latestFlagOperationByTrustor(operations) {
  const latest = new Map();
  for (const operation of operations) {
    if (!latest.has(operation.trustor)) latest.set(operation.trustor, operation);
  }
  return [...latest.values()];
}

export async function getHuellaRevocations() {
  const now = Date.now();
  if (revocationsCache && now - revocationsCache.fetchedAt < CACHE_MS) {
    return revocationsCache.value;
  }

  try {
    const operations = await huellaFlagOperations();
    const value = latestFlagOperationByTrustor(operations)
      .filter(isRevocationOperation)
      .map((operation) => ({
        pubkey: operation.trustor,
        txHash: operation.transaction_hash,
        createdAt: Date.parse(operation.created_at)
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    revocationsCache = { fetchedAt: now, value };
    return value;
  } catch (err) {
    console.warn('Revocaciones on-chain: no se pudieron leer desde Horizon:', err?.message || err);
    const value = [];
    revocationsCache = { fetchedAt: now, value };
    return value;
  }
}
