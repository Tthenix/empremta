import { config } from './config.js';
import { decimalToStroopsUnchecked, fmtStroops } from './money.js';
import { assetBalance, server, USDC } from './stellar.js';

const CACHE_MS = 20_000;
const MAX_PAGES = 50;
let centroCache = null;

function isConfiguredUsdcPayment(record) {
  return record.type === 'payment' &&
    record.to === config.centroPub &&
    (record.asset_type === 'credit_alphanum4' || record.asset_type === 'credit_alphanum12') &&
    record.asset_code === USDC.code &&
    record.asset_issuer === USDC.issuer;
}

async function incomingCentroPayments() {
  const payments = [];
  let page = await server.payments()
    .forAccount(config.centroPub)
    .order('desc')
    .limit(200)
    .call();

  for (let pages = 1; ; pages += 1) {
    payments.push(...page.records.filter(isConfiguredUsdcPayment));
    if (page.records.length === 0) break;
    if (pages >= MAX_PAGES) {
      throw new Error(`La cuenta del centro supera ${MAX_PAGES * 200} operaciones de pago en Horizon`);
    }
    page = await page.next();
  }
  return payments;
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
      server.accounts().accountId(config.centroPub).call(),
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
