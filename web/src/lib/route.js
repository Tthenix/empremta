// Distancias en línea recta (no por calle): alcanzan para ordenar lugares que están a kilómetros entre sí.
export function distanceM(a, b) {
  const R = 6371000
  const rad = (v) => (v * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function permutations(list) {
  if (list.length <= 1) return [list]
  return list.flatMap((item, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [item, ...rest]))
}

function pathLength(origin, order) {
  let total = 0
  let from = origin
  for (const stop of order) {
    total += distanceM(from, stop)
    from = stop
  }
  return total
}

/** Orden de visita que suma menos distancia saliendo de `origin` (sin volver). */
export function bestOrder(origin, stops) {
  const valid = stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
  // shortcut: prueba todos los órdenes (8! = 40 320 con 8 lugares); con más paradas, pasar a "el más cercano primero".
  if (valid.length > 8) throw new Error('Demasiados lugares para probar todos los órdenes')
  let best = valid
  let bestLen = Infinity
  for (const order of permutations(valid)) {
    const len = pathLength(origin, order)
    if (len < bestLen) {
      best = order
      bestLen = len
    }
  }
  return best
}

/**
 * Próximo lugar a sugerir desde `stop`, por cercanía.
 * Nunca propone un lugar con huella. Entre los que faltan, prefiere los que todavía no se abrieron
 * en esta visita (`seenIds`), para no rebotar entre los dos más cercanos a quien solo lee.
 */
export function nextStopFrom(stop, stops, visitedIds, seenIds = new Set()) {
  const pending = stops.filter((s) => s.id !== stop.id && !visitedIds.has(s.id))
  const unseen = pending.filter((s) => !seenIds.has(s.id))
  return bestOrder(stop, unseen.length ? unseen : pending)[0]
}

export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`
}

/** Enlace de Google Maps con todo el recorrido en ese orden. */
export function mapsRouteUrl(origin, order) {
  const pt = (p) => `${p.lat},${p.lng}`
  const params = new URLSearchParams({ api: '1', destination: pt(order[order.length - 1]) })
  if (origin) params.set('origin', pt(origin))
  if (order.length > 1) params.set('waypoints', order.slice(0, -1).map(pt).join('|'))
  return `https://www.google.com/maps/dir/?${params}`
}
