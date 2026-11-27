export class AppError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function invalidInput(message = 'Los datos enviados no son válidos') {
  return new AppError('INVALID_INPUT', message, 400);
}

export function horizonToAppError(err) {
  const resultCodes = err?.response?.data?.extras?.result_codes;
  const txCode = resultCodes?.transaction;
  const opCodes = resultCodes?.operations || [];
  const all = [txCode, ...opCodes].filter(Boolean);

  if (all.some((code) => code === 'op_underfunded' || code === 'tx_insufficient_balance')) {
    return new AppError('INSUFFICIENT_BALANCE', 'No tenés saldo suficiente', 400, resultCodes);
  }
  if (all.some((code) => code === 'tx_timeout' || code === 'tx_too_late')) {
    return new AppError('HORIZON_ERROR', 'La transacción venció, probá de nuevo', 502, resultCodes);
  }
  if (all.some((code) => code === 'op_not_authorized')) {
    return new AppError('ACCOUNT_REVOKED', 'Esta cuenta fue suspendida por el Centro de Veteranos', 403, resultCodes);
  }
  if (all.some((code) => code === 'op_no_trust')) {
    return new AppError('HORIZON_ERROR', 'La cuenta no tiene la trustline necesaria para este activo', 502, resultCodes);
  }
  if (all.some((code) => code === 'op_no_destination')) {
    return new AppError('NOT_ONBOARDED', 'La cuenta de destino todavía no existe', 400, resultCodes);
  }
  if (all.some((code) => code === 'tx_bad_seq')) {
    return new AppError('HORIZON_ERROR', 'La transacción quedó desactualizada, generá otra y probá de nuevo', 502, resultCodes);
  }
  return new AppError(
    'HORIZON_ERROR',
    err?.response?.data?.detail || 'La red Stellar rechazó la operación',
    502,
    resultCodes || err?.response?.data || err.message
  );
}
