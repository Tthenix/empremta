import { getMerchant } from './content.js';
import { hasRedemptionRef, recordRedemption } from './db.js';
import { assertCanjeVisits } from './eligibility.js';
import { AppError, invalidInput } from './errors.js';
import { assertVisitorHuellaAccess, buildRedemption, submitRedemption, verifyBuiltTx } from './stellar.js';

function peekRedemptionMeta(signedXdr) {
  try {
    return verifyBuiltTx(signedXdr, 'redeem').entry.meta;
  } catch {
    return null;
  }
}

const redemptionRefLocks = new Set();

function alreadyPaid() {
  return new AppError('ALREADY_PAID', 'Este canje ya fue hecho. Pedile al comercio un canje nuevo.', 409);
}

export async function buildMerchantRedemption(input) {
  const merchant = getMerchant(input?.merchantId);
  if (!merchant || !merchant.pub) throw invalidInput('El comercio no existe');
  if (typeof input?.ref === 'string' && hasRedemptionRef(merchant.id, input.ref)) throw alreadyPaid();
  await assertVisitorHuellaAccess(input.publicKey);
  assertCanjeVisits(input.publicKey);
  return buildRedemption({
    publicKey: input.publicKey,
    merchant,
    amountArs: input.amountArs,
    ref: input.ref
  });
}

export async function submitMerchantRedemption(signedXdr) {
  const meta = peekRedemptionMeta(signedXdr);
  const merchant = meta ? getMerchant(meta.merchantId) : null;
  const lockKey = meta ? `${meta.merchantId}:${meta.ref}` : null;
  if (!merchant) throw invalidInput('El comercio no existe');
  if (lockKey) {
    if (hasRedemptionRef(meta.merchantId, meta.ref) || redemptionRefLocks.has(lockKey)) throw alreadyPaid();
    redemptionRefLocks.add(lockKey);
  }
  try {
    const result = await submitRedemption(signedXdr, merchant);
    try {
      recordRedemption({
        txHash: result.txHash,
        ref: result.meta.ref,
        pubkey: result.meta.publicKey,
        merchantId: result.meta.merchantId,
        desglose: result.desglose
      });
    } catch (err) {
      if (String(err?.code || '').includes('SQLITE_CONSTRAINT')) throw alreadyPaid();
      throw err;
    }
    return { txHash: result.txHash, desglose: result.desglose };
  } finally {
    if (lockKey) redemptionRefLocks.delete(lockKey);
  }
}
