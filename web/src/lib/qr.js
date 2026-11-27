// Solo se navega a rutas propias de Empremta: parada (/v/:id) o cobro (/pagar).
// Se ignora el dominio del QR para que los carteles impresos sirvan también en local.
const ALLOWED_PATH = /^\/(v\/[a-z0-9-]+|pagar)$/i

export function qrToPath(text) {
  let url
  try {
    url = new URL(String(text).trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!ALLOWED_PATH.test(url.pathname)) return null
  return url.pathname + url.search
}
