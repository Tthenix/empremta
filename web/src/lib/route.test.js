// node --test src/lib/route.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bestOrder, distanceM, formatDistance, mapsRouteUrl } from './route.js'

const pc = { id: 'pc', lat: -32.877, lng: -68.846 }
const plu = { id: 'plu', lat: -32.832, lng: -68.793 }
const coq = { id: 'coq', lat: -32.97, lng: -68.75 }

test('distancia razonable entre Parque Central y El Plumerillo (~7 km)', () => {
  const d = distanceM(pc, plu)
  assert.ok(d > 6000 && d < 8000, String(d))
})

test('desde Maipú conviene empezar por Coquimbito', () => {
  const maipu = { lat: -32.98, lng: -68.78 }
  assert.deepEqual(bestOrder(maipu, [pc, plu, coq]).map((s) => s.id), ['coq', 'pc', 'plu'])
})

test('desde Las Heras conviene empezar por El Plumerillo', () => {
  const lasHeras = { lat: -32.825, lng: -68.8 }
  assert.deepEqual(bestOrder(lasHeras, [pc, plu, coq]).map((s) => s.id), ['plu', 'pc', 'coq'])
})

test('ignora lugares sin coordenadas y acepta listas cortas', () => {
  assert.deepEqual(bestOrder(pc, [{ id: 'x', lat: null, lng: null }, plu]).map((s) => s.id), ['plu'])
  assert.deepEqual(bestOrder(pc, []), [])
})

test('formato y enlace de Maps', () => {
  assert.equal(formatDistance(640), '640 m')
  assert.equal(formatDistance(4230), '4,2 km')
  const url = new URL(mapsRouteUrl({ lat: 1, lng: 2 }, [plu, coq]))
  assert.equal(url.searchParams.get('origin'), '1,2')
  assert.equal(url.searchParams.get('destination'), '-32.97,-68.75')
  assert.equal(url.searchParams.get('waypoints'), '-32.832,-68.793')
})
