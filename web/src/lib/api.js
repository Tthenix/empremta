/**
 * Sole module that talks to the backend (or mock).
 * Shapes match doc/API_CONTRACT.md exactly.
 */
import * as mock from './mockApi.js'

const USE_MOCK = import.meta.env.VITE_API_MOCK === 'true'

async function wallet() {
  return import('./wallet.js')
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  let body = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { error: { code: 'HORIZON_ERROR', message: text } }
    }
  }
  if (!res.ok) {
    const apiErr = body?.error || {
      code: 'HORIZON_ERROR',
      message: 'Algo salió mal. Probá de nuevo en un momento.',
    }
    const e = new Error(apiErr.message)
    e.apiError = apiErr
    e.status = res.status
    throw e
  }
  return body
}

export function isMock() {
  return USE_MOCK
}

export async function getConfig() {
  if (USE_MOCK) return mock.getConfig()
  return request('/api/config')
}

export async function getStops() {
  if (USE_MOCK) return mock.getStops()
  return request('/api/stops')
}

export async function getStop(id) {
  if (USE_MOCK) return mock.getStop(id)
  return request(`/api/stops/${encodeURIComponent(id)}`)
}

export async function onboardBuild(publicKey) {
  if (USE_MOCK) return mock.onboardBuild({ publicKey })
  return request('/api/onboard/build', {
    method: 'POST',
    body: JSON.stringify({ publicKey }),
  })
}

export async function onboardSubmit(signedXdr) {
  if (USE_MOCK) return mock.onboardSubmit({ signedXdr })
  return request('/api/onboard/submit', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  })
}

/**
 * Full onboard flow: build → sign → submit. Handles alreadyOnboarded.
 * In mock mode, fake XDR cannot be signed by the SDK — we mark onboarded and submit the label.
 */
export async function ensureOnboarded() {
  const { getPublicKey, signXdr } = await wallet()
  const publicKey = getPublicKey()
  const built = await onboardBuild(publicKey)
  if (built.alreadyOnboarded) return { alreadyOnboarded: true }

  if (USE_MOCK) {
    mock.mockMarkOnboarded(publicKey)
    return onboardSubmit(built.xdr)
  }

  const signedXdr = signXdr(built.xdr)
  return onboardSubmit(signedXdr)
}

export async function registerVisit({ stopId, code, lat, lng }) {
  const { getPublicKey, signVisit } = await wallet()
  const publicKey = getPublicKey()
  const ts = Date.now()
  const signature = signVisit(stopId, ts)
  const body = { publicKey, stopId, code, lat, lng, ts, signature }
  if (USE_MOCK) return mock.visit(body)
  return request('/api/visit', { method: 'POST', body: JSON.stringify(body) })
}

export async function getAccount(pub) {
  const publicKey = pub || (await wallet()).getPublicKey()
  if (USE_MOCK) return mock.getAccountInfo(publicKey)
  return request(`/api/account/${encodeURIComponent(publicKey)}`)
}

export async function payBuild({ merchantId, amount, ref, useHuellas }) {
  const publicKey = (await wallet()).getPublicKey()
  const body = { publicKey, merchantId, amount, ref, useHuellas }
  if (USE_MOCK) return mock.payBuild(body)
  return request('/api/pay/build', { method: 'POST', body: JSON.stringify(body) })
}

export async function paySubmit(signedXdr) {
  if (USE_MOCK) return mock.paySubmit({ signedXdr })
  return request('/api/pay/submit', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  })
}

/** Build → show desglose → caller confirms → sign → submit */
export async function confirmPay({ merchantId, amount, ref, useHuellas, xdr }) {
  if (USE_MOCK) {
    return paySubmit(xdr)
  }
  const { signXdr } = await wallet()
  const signedXdr = signXdr(xdr)
  return paySubmit(signedXdr)
}

export async function redeemBuild({ merchantId, amountArs, ref }) {
  const publicKey = (await wallet()).getPublicKey()
  const body = { publicKey, merchantId, amountArs, ref }
  if (USE_MOCK) return mock.redeemBuild(body)
  return request('/api/redeem/build', { method: 'POST', body: JSON.stringify(body) })
}

export async function redeemSubmit(signedXdr) {
  if (USE_MOCK) return mock.redeemSubmit({ signedXdr })
  return request('/api/redeem/submit', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  })
}

export async function confirmRedeem({ xdr }) {
  if (USE_MOCK) return redeemSubmit(xdr)
  const { signXdr } = await wallet()
  return redeemSubmit(signXdr(xdr))
}

export async function getMerchants() {
  if (USE_MOCK) return mock.getMerchants()
  return request('/api/merchants')
}

export async function getMerchantPayments(id, since) {
  if (USE_MOCK) return mock.getMerchantPayments(id, since)
  const q = since != null ? `?since=${encodeURIComponent(since)}` : ''
  return request(`/api/merchants/${encodeURIComponent(id)}/payments${q}`)
}

export async function getMerchantRedemptions(id, since) {
  if (USE_MOCK) return mock.getMerchantRedemptions(id, since)
  const q = since != null ? `?since=${encodeURIComponent(since)}` : ''
  return request(`/api/merchants/${encodeURIComponent(id)}/redemptions${q}`)
}

export async function getTransparencia() {
  if (USE_MOCK) return mock.getTransparencia()
  return request('/api/transparencia')
}

export async function demoFund() {
  const publicKey = (await wallet()).getPublicKey()
  if (USE_MOCK) return mock.demoFund({ publicKey })
  return request('/api/demo/fund', {
    method: 'POST',
    body: JSON.stringify({ publicKey }),
  })
}

export async function getBackupSecret() {
  return (await wallet()).getSecretForBackup()
}

export async function restoreBackupSecret(secret) {
  const w = await wallet()
  try {
    return w.importSecret(secret)
  } catch {
    throw new Error('Esa clave no es válida. Revisá que empiece con S y tenga 56 caracteres.')
  }
}

export function humanError(e) {
  if (e?.apiError?.message) return e.apiError.message
  if (e?.message) return e.message
  return 'Algo salió mal. Probá de nuevo en un momento.'
}
