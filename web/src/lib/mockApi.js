/**
 * Stateful in-memory mock of doc/API_CONTRACT.md.
 * Enables the full visitor + merchant + transparency flow without a backend.
 */

const ISSUER = 'GMOCKISSUERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXA'
const CENTRO = 'GMOCKCENTROXXXXXXXXXXXXXXXXXXXXXXXXXXXXXB'
const USDC_ISSUER = 'GMOCKUSDCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXC'

const STOPS = [
  {
    id: 'pc',
    nombre: 'Memorial Malvinas Argentinas',
    lugar: 'Parque Central, Ciudad de Mendoza',
    lat: -32.877,
    lng: -68.846,
    coordsVerificadas: false,
    foto: null,
    audio: null,
    historia:
      '[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]',
    fuente: '[Nombre del veterano o agrupación que aporta el relato]',
  },
  {
    id: 'plu',
    nombre: 'Plaza Héroes de Malvinas',
    lugar: 'IV Brigada Aérea, El Plumerillo',
    lat: -32.832,
    lng: -68.793,
    coordsVerificadas: false,
    foto: null,
    audio: null,
    historia:
      '[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]',
    fuente: '[PENDIENTE]',
  },
  {
    id: 'coq',
    nombre: 'Monumento a los Caídos en Malvinas',
    lugar: 'Rotonda carril Gómez y Urquiza, Coquimbito, Maipú',
    lat: -32.97,
    lng: -68.75,
    coordsVerificadas: false,
    foto: null,
    audio: null,
    historia:
      '[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]',
    fuente: '[PENDIENTE]',
  },
]

const MERCHANTS = [
  {
    id: 'm1',
    nombre: '[COMERCIO PENDIENTE]',
    direccion: '[PENDIENTE]',
    pctCentro: 5,
    lat: null,
    lng: null,
    pub: 'GMOCKMERCHANT1XXXXXXXXXXXXXXXXXXXXXXXXXD',
  },
  {
    id: 'm2',
    nombre: '[COMERCIO 2 PENDIENTE]',
    direccion: '[PENDIENTE]',
    pctCentro: 5,
    lat: null,
    lng: null,
    pub: 'GMOCKMERCHANT2XXXXXXXXXXXXXXXXXXXXXXXXXE',
  },
]

const HUELLAS_POR_VISITA = 10
const COSTO_CANJE = 30
const DESCUENTO_PCT = 10
const DESCUENTO_MAX = 1

/** @type {Map<string, { onboarded: boolean, huella: number, usdc: number, visits: Array, demoFunded: boolean }>} */
const accounts = new Map()

/** @type {Array<object>} */
const payments = []

let txCounter = 0

function delay(ms = 120) {
  return new Promise((r) => setTimeout(r, ms))
}

function err(code, message, status = 400) {
  const e = new Error(message)
  e.apiError = { code, message }
  e.status = status
  throw e
}

function fakeHash() {
  txCounter += 1
  return `mocktx${txCounter.toString(16).padStart(8, '0')}${'a'.repeat(48)}`
}

function fakeXdr(label) {
  // Opaque placeholder; wallet.signXdr is skipped when alreadyOnboarded / mock path uses submit helpers
  return `MOCKXDR:${label}:${Date.now()}`
}

function getAccount(pub) {
  if (!accounts.has(pub)) {
    accounts.set(pub, {
      onboarded: false,
      huella: 0,
      usdc: 0,
      visits: [],
      demoFunded: false,
    })
  }
  return accounts.get(pub)
}

function fmt(n) {
  return Number(n).toFixed(7)
}

function stripStop(s) {
  const { historia, fuente, ...rest } = s
  return rest
}

export async function getConfig() {
  await delay()
  return {
    network: 'testnet',
    usdcMode: 'mock',
    usdcLabel: 'USDC (prueba)',
    usdcAsset: { code: 'USDC', issuer: USDC_ISSUER },
    huellaAsset: { code: 'HUELLA', issuer: ISSUER },
    demoMode: true,
    huellasPorVisita: HUELLAS_POR_VISITA,
    costoCanje: COSTO_CANJE,
    descuentoPct: DESCUENTO_PCT,
    descuentoMaxUsdc: String(DESCUENTO_MAX),
    explorerTxUrl: 'https://stellar.expert/explorer/testnet/tx/',
    explorerAccountUrl: 'https://stellar.expert/explorer/testnet/account/',
    centroLabel: 'Centro de Veteranos (cuenta de demostración)',
    centroPub: CENTRO,
  }
}

export async function getStops() {
  await delay()
  return STOPS.map(stripStop)
}

export async function getStop(id) {
  await delay()
  const s = STOPS.find((x) => x.id === id)
  if (!s) err('NOT_FOUND', 'No encontramos esa parada', 404)
  return { ...s }
}

export async function onboardBuild({ publicKey }) {
  await delay()
  const acc = getAccount(publicKey)
  if (acc.onboarded) return { alreadyOnboarded: true }
  return { xdr: fakeXdr(`onboard:${publicKey}`) }
}

export async function onboardSubmit({ signedXdr }) {
  await delay()
  if (!signedXdr) err('INVALID_INPUT', 'Falta la transacción firmada')
  // Extract pubkey from mock xdr label if present, else mark any recent
  const m = String(signedXdr).match(/onboard:(G[A-Z0-9]+)/)
  const pub = m?.[1]
  if (pub) {
    const acc = getAccount(pub)
    acc.onboarded = true
  } else {
    // Real signed XDR path after mock build: still need a pubkey — callers pass via side channel
    // Scan accounts created but not onboarded and onboard the latest (single-user mock)
    for (const [, acc] of accounts) {
      if (!acc.onboarded) {
        acc.onboarded = true
        break
      }
    }
  }
  return { txHash: fakeHash() }
}

export async function visit(body) {
  await delay()
  const { publicKey, stopId, code, ts, signature } = body
  if (!publicKey || !stopId || !code || !ts || !signature) {
    err('INVALID_INPUT', 'Faltan datos para registrar la visita')
  }
  if (String(code).length < 8) {
    err('INVALID_CODE', 'El código del QR no es válido')
  }
  const stop = STOPS.find((s) => s.id === stopId)
  if (!stop) err('NOT_FOUND', 'No encontramos esa parada', 404)

  const acc = getAccount(publicKey)
  if (!acc.onboarded) err('NOT_ONBOARDED', 'Primero tenés que activar tu recorrido')
  if (acc.visits.some((v) => v.stopId === stopId)) {
    err('ALREADY_VISITED', 'Ya registraste tu visita en este lugar')
  }

  const txHash = fakeHash()
  acc.visits.push({ stopId, txHash, createdAt: Number(ts) || Date.now() })
  acc.huella += HUELLAS_POR_VISITA
  return { txHash, huellas: fmt(acc.huella) }
}

export async function getAccountInfo(pub) {
  await delay()
  if (!accounts.has(pub)) {
    return {
      exists: false,
      onboarded: false,
      huella: '0',
      usdc: '0',
      xlm: '0',
      visits: [],
      demoFunded: false,
    }
  }
  const acc = accounts.get(pub)
  return {
    exists: true,
    onboarded: acc.onboarded,
    huella: fmt(acc.huella),
    usdc: fmt(acc.usdc),
    xlm: '0.0000000',
    visits: [...acc.visits].sort((a, b) => b.createdAt - a.createdAt),
    demoFunded: acc.demoFunded,
  }
}

function buildDesglose({ merchantId, amount, useHuellas, acc }) {
  const merchant = MERCHANTS.find((m) => m.id === merchantId)
  if (!merchant) err('NOT_FOUND', 'No encontramos ese comercio', 404)
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) {
    err('INVALID_INPUT', 'El monto no es válido')
  }

  let discount = 0
  let huellasBurned = 0
  if (useHuellas && acc.huella >= COSTO_CANJE) {
    discount = Math.min((amt * DESCUENTO_PCT) / 100, DESCUENTO_MAX)
    huellasBurned = COSTO_CANJE
  }

  const total = amt - discount
  const pct = merchant.pctCentro / 100
  const toCentro = total * pct
  const toMerchant = total - toCentro

  return {
    amount: fmt(amt),
    discount: fmt(discount),
    total: fmt(total),
    toMerchant: fmt(toMerchant),
    toCentro: fmt(toCentro),
    huellasBurned,
    pctCentro: merchant.pctCentro,
    merchant: { id: merchant.id, nombre: merchant.nombre },
  }
}

/** Pending pays keyed by a short id embedded in mock xdr */
const pendingPays = new Map()

export async function payBuild({ publicKey, merchantId, amount, ref, useHuellas }) {
  await delay()
  if (!ref || String(ref).length < 4) err('INVALID_INPUT', 'Falta la referencia de cobro')
  const acc = getAccount(publicKey)
  if (!acc.onboarded) err('NOT_ONBOARDED', 'Primero tenés que activar tu recorrido')

  const desglose = buildDesglose({
    merchantId,
    amount,
    useHuellas: Boolean(useHuellas),
    acc,
  })

  if (Number(desglose.total) > acc.usdc) {
    err('INSUFFICIENT_BALANCE', 'No tenés saldo suficiente')
  }

  const id = `pay:${publicKey}:${ref}:${Date.now()}`
  pendingPays.set(id, { publicKey, merchantId, amount, ref, useHuellas: Boolean(useHuellas), desglose })
  return { xdr: fakeXdr(id), desglose }
}

export async function paySubmit({ signedXdr }) {
  await delay()
  if (!signedXdr) err('INVALID_INPUT', 'Falta la transacción firmada')

  let entry = null
  let key = null
  for (const [k, v] of pendingPays) {
    if (String(signedXdr).includes(k) || String(signedXdr).includes(v.ref)) {
      entry = v
      key = k
      break
    }
  }
  // Fallback: last pending for single-user mock after real XDR sign attempt
  if (!entry && pendingPays.size) {
    const last = [...pendingPays.entries()].at(-1)
    key = last[0]
    entry = last[1]
  }
  if (!entry) err('INVALID_INPUT', 'No encontramos el pago pendiente')

  const acc = getAccount(entry.publicKey)
  const desglose = entry.desglose
  if (Number(desglose.total) > acc.usdc) {
    err('INSUFFICIENT_BALANCE', 'No tenés saldo suficiente')
  }

  acc.usdc -= Number(desglose.total)
  if (desglose.huellasBurned > 0) {
    acc.huella = Math.max(0, acc.huella - desglose.huellasBurned)
  }

  const txHash = fakeHash()
  payments.unshift({
    txHash,
    ref: entry.ref,
    pubkey: entry.publicKey,
    amount: desglose.amount,
    discount: desglose.discount,
    toMerchant: desglose.toMerchant,
    toCentro: desglose.toCentro,
    huellasBurned: desglose.huellasBurned,
    createdAt: Date.now(),
    merchantId: entry.merchantId,
    nombre: desglose.merchant.nombre,
  })
  pendingPays.delete(key)
  return { txHash, desglose }
}

export async function getMerchants() {
  await delay()
  return MERCHANTS.map((m) => ({ ...m }))
}

export async function getMerchantPayments(id, since) {
  await delay()
  let list = payments.filter((p) => p.merchantId === id)
  if (since) list = list.filter((p) => p.createdAt >= Number(since))
  return list.map(({ merchantId, nombre, ...rest }) => rest)
}

export async function getTransparencia() {
  await delay()
  const porMap = new Map()
  for (const p of payments) {
    const cur = porMap.get(p.merchantId) || {
      merchantId: p.merchantId,
      nombre: p.nombre,
      totalCentro: 0,
      pagos: 0,
    }
    cur.totalCentro += Number(p.toCentro)
    cur.pagos += 1
    porMap.set(p.merchantId, cur)
  }
  const totalCentro = payments.reduce((s, p) => s + Number(p.toCentro), 0)
  return {
    totalCentro: fmt(totalCentro),
    pagos: payments.length,
    porComercio: [...porMap.values()].map((c) => ({
      ...c,
      totalCentro: fmt(c.totalCentro),
    })),
    lista: payments.map((p) => ({
      txHash: p.txHash,
      merchantId: p.merchantId,
      nombre: p.nombre,
      toCentro: p.toCentro,
      createdAt: p.createdAt,
    })),
    centroPub: CENTRO,
    onChain: {
      source: 'horizon',
      balanceUsdc: fmt(totalCentro),
      totalRecibido: fmt(totalCentro),
      pagos: payments.length,
      lista: payments.map((p) => ({
        txHash: p.txHash,
        amount: p.toCentro,
        from: p.pubkey,
        createdAt: p.createdAt,
      })),
      fetchedAt: Date.now(),
    },
  }
}

export async function demoFund({ publicKey }) {
  await delay()
  const acc = getAccount(publicKey)
  if (!acc.onboarded) err('NOT_ONBOARDED', 'Primero tenés que activar tu recorrido')
  if (acc.demoFunded) err('ALREADY_FUNDED', 'Ya cargaste el saldo de prueba', 409)
  acc.usdc += 5
  acc.demoFunded = true
  return { txHash: fakeHash(), amount: '5' }
}

/** Mark account onboarded without real XDR (used by api.js mock onboard helper) */
export function mockMarkOnboarded(publicKey) {
  getAccount(publicKey).onboarded = true
}
