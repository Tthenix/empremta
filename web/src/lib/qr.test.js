// node --test src/lib/qr.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { qrToPath } from './qr.js'

test('acepta QR de parada y de cobro', () => {
  assert.equal(qrToPath('https://empremta.up.railway.app/v/pc?c=607fa0c7fbacfcbe'), '/v/pc?c=607fa0c7fbacfcbe')
  assert.equal(qrToPath(' http://localhost:3000/pagar?m=m1&monto=2.50&ref=AB12CD34 '), '/pagar?m=m1&monto=2.50&ref=AB12CD34')
})

test('rechaza todo lo demás', () => {
  assert.equal(qrToPath('https://otro.com/login'), null)
  assert.equal(qrToPath('javascript:alert(1)'), null)
  assert.equal(qrToPath('https://x.com/v/pc/../../admin'), null)
  assert.equal(qrToPath('SBXXXXSECRET'), null)
  assert.equal(qrToPath(''), null)
})
