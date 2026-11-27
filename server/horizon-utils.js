import { Config } from '@stellar/stellar-sdk';

const DEFAULT_READ_TIMEOUT_MS = 10_000;
let timeoutsConfigured = false;

export function configureHorizonTimeouts(timeoutMs = DEFAULT_READ_TIMEOUT_MS) {
  if (timeoutsConfigured) return;
  Config.setTimeout(timeoutMs);
  timeoutsConfigured = true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function responseStatus(err) {
  return err?.response?.status ?? err?.status ?? null;
}

export function isRetryableHorizonError(err) {
  if (err?.name === 'NotFoundError') return false;
  const status = responseStatus(err);
  if (!status) return true;
  return status === 429 || status >= 500;
}

export async function horizonReadWithRetry(fn, { retries = 2, baseDelayMs = 250 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isRetryableHorizonError(err)) throw err;
      await sleep(baseDelayMs * (2 ** attempt));
    }
  }
  throw lastError;
}

export function isAmbiguousSubmissionError(err) {
  const status = responseStatus(err);
  const txCode = err?.response?.data?.extras?.result_codes?.transaction;
  if (txCode === 'tx_bad_seq') return true;
  if (!status) return true;
  return status === 429 || status >= 500;
}
