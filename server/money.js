const STROOPS_PER_UNIT = 10_000_000n;
const AMOUNT_RE = /^\d+(\.\d{1,7})?$/;

export function assertAmountString(amount) {
  if (typeof amount !== 'string' || !AMOUNT_RE.test(amount)) {
    throw new Error('amount inválido');
  }
}

export function toStroops(amount) {
  assertAmountString(amount);
  const negative = amount.startsWith('-');
  if (negative) throw new Error('amount no puede ser negativo');
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt((fraction + '0000000').slice(0, 7));
}

export function fmtStroops(stroops) {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_UNIT;
  const fraction = String(abs % STROOPS_PER_UNIT).padStart(7, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function decimalToStroopsUnchecked(decimal) {
  const [whole, fraction = ''] = String(decimal).split('.');
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt((fraction + '0000000').slice(0, 7));
}

export function minBigInt(a, b) {
  return a < b ? a : b;
}

export function isAmountString(amount) {
  return typeof amount === 'string' && AMOUNT_RE.test(amount);
}
