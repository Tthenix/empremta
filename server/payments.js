import { config } from './config.js';
import { getMerchant } from './content.js';
import { getDemoFund, hasPaymentRef, recordDemoFund, recordPayment } from './db.js';
import { AppError, invalidInput } from './errors.js';
import { buildPayment, demoFund, submitPayment, verifyBuiltTx } from './stellar.js';

function peekPaymentMeta(signedXdr) {
  try {
    return verifyBuiltTx(signedXdr, 'payment').entry.meta;
  } catch {
    return null;
  }
}

const demoFundLocks = new Set();

export async function fundDemoOnce(publicKey) {
  if (!config.demoMode) {
    throw new AppError('DEMO_DISABLED', 'El modo demo está desactivado', 403);
  }
  if (getDemoFund(publicKey)) {
    throw new AppError('ALREADY_FUNDED', 'Esta cuenta ya recibió saldo de prueba', 409);
  }
  if (demoFundLocks.has(publicKey)) {
    throw new AppError('ALREADY_FUNDED', 'Esta cuenta ya está recibiendo saldo de prueba', 409);
  }
  demoFundLocks.add(publicKey);
  try {
    if (getDemoFund(publicKey)) {
      throw new AppError('ALREADY_FUNDED', 'Esta cuenta ya recibió saldo de prueba', 409);
    }
    const result = await demoFund(publicKey);
    recordDemoFund(publicKey, result.txHash);
    return result;
  } finally {
    demoFundLocks.delete(publicKey);
  }
}

const paymentRefLocks = new Set();

function alreadyPaid() {
  return new AppError('ALREADY_PAID', 'Este cobro ya fue pagado. Pedile al comercio un cobro nuevo.', 409);
}

export async function buildMerchantPayment(input) {
  const merchant = getMerchant(input?.merchantId);
  if (!merchant || !merchant.pub) throw invalidInput('El comercio no existe');
  if (typeof input.ref === 'string' && hasPaymentRef(merchant.id, input.ref)) throw alreadyPaid();
  return buildPayment({
    publicKey: input.publicKey,
    merchant,
    amount: input.amount,
    ref: input.ref,
    useHuellas: input.useHuellas
  });
}

export async function submitMerchantPayment(signedXdr) {
  const meta = peekPaymentMeta(signedXdr);
  const lockKey = meta ? `${meta.merchantId}:${meta.ref}` : null;
  if (lockKey) {
    if (hasPaymentRef(meta.merchantId, meta.ref) || paymentRefLocks.has(lockKey)) throw alreadyPaid();
    paymentRefLocks.add(lockKey);
  }
  try {
    const result = await submitPayment(signedXdr);
    recordPayment({
      txHash: result.txHash,
      ref: result.meta.ref,
      pubkey: result.meta.publicKey,
      merchantId: result.meta.merchantId,
      desglose: result.desglose
    });
    return { txHash: result.txHash, desglose: result.desglose };
  } finally {
    if (lockKey) paymentRefLocks.delete(lockKey);
  }
}
