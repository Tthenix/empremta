export function formatAmount(value, decimals = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatUsdc(value) {
  const raw = String(value ?? '').trim()
  if (!/^-?\d+(\.\d{1,7})?$/.test(raw)) return formatAmount(value, 2)

  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [intPart, fracPart = ''] = unsigned.split('.')
  const groupedInt = Number(intPart).toLocaleString('es-AR')
  let frac = fracPart.replace(/0+$/, '')
  if (frac.length < 2) frac = frac.padEnd(2, '0')

  return `${negative ? '−' : ''}${groupedInt},${frac}`
}

export function formatDate(ms) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isPlaceholder(text) {
  return typeof text === 'string' && text.trimStart().startsWith('[')
}

export function randomRef(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}
