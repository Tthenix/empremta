import { config } from './config.js';
import { getMerchant } from './content.js';
import { getDemoFund, recordDemoFund, recordPayment } from './db.js';
import { AppError, invalidInput } from './errors.js';
import { buildPayment, demoFund, submitPayment } from './stellar.js';

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

export async function buildMerchantPayment(input) {
  const merchant = getMerchant(input?.merchantId);
  if (!merchant || !merchant.pub) throw invalidInput('El comercio no existe');
  return buildPayment({
    publicKey: input.publicKey,
    merchant,
    amount: input.amount,
    ref: input.ref,
    useHuellas: input.useHuellas
  });
}

export async function submitMerchantPayment(signedXdr) {
  const result = await submitPayment(signedXdr);
  recordPayment({
    txHash: result.txHash,
    ref: result.meta.ref,
    pubkey: result.meta.publicKey,
    merchantId: result.meta.merchantId,
    desglose: result.desglose
  });
  return { txHash: result.txHash, desglose: result.desglose };
}
