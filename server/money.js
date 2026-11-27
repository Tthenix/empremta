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

export function decimalToScaled(value, scaleDigits, label = 'monto') {
  if (typeof value !== 'string' || !new RegExp(`^\\d+(\\.\\d{1,${scaleDigits}})?$`).test(value)) {
    throw new Error(`${label} inválido`);
  }
  const scale = 10n ** BigInt(scaleDigits);
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * scale + BigInt((fraction + '0'.repeat(scaleDigits)).slice(0, scaleDigits));
}

export function fmtScaled(value, scaleDigits) {
  const scale = 10n ** BigInt(scaleDigits);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / scale;
  const fraction = String(abs % scale).padStart(scaleDigits, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
