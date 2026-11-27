import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk'
import { Buffer } from 'buffer'

const STORAGE_KEY = 'rmm_secret'

let memorySecret = null
let storageWarned = false

function warnStorageOnce() {
  if (storageWarned) return
  storageWarned = true
  console.warn(
    'No se pudo usar localStorage (modo privado?). La clave queda solo en memoria de esta sesión.',
  )
}

export function getOrCreateKeypair() {
  let secret = null
  try {
    secret = localStorage.getItem(STORAGE_KEY)
  } catch {
    warnStorageOnce()
    secret = memorySecret
  }

  if (!secret) {
    const kp = Keypair.random()
    secret = kp.secret()
    try {
      localStorage.setItem(STORAGE_KEY, secret)
    } catch {
      warnStorageOnce()
      memorySecret = secret
    }
    return kp
  }

  memorySecret = secret
  return Keypair.fromSecret(secret)
}

export function getPublicKey() {
  return getOrCreateKeypair().publicKey()
}

export function getSecretForBackup() {
  try {
    return localStorage.getItem(STORAGE_KEY) || memorySecret
  } catch {
    return memorySecret
  }
}

/** Reemplaza la clave de este navegador por una respaldada. Tira error si no es una clave válida. */
export function importSecret(input) {
  const secret = String(input || '').replace(/\s+/g, '').toUpperCase()
  const kp = Keypair.fromSecret(secret)
  try {
    localStorage.setItem(STORAGE_KEY, secret)
  } catch {
    warnStorageOnce()
  }
  memorySecret = secret
  return kp.publicKey()
}

/** Sign visit message: visita:${stopId}:${ts} → base64 */
export function signVisit(stopId, ts) {
  const kp = getOrCreateKeypair()
  const msg = Buffer.from(`visita:${stopId}:${ts}`, 'utf8')
  return Buffer.from(kp.sign(msg)).toString('base64')
}

export function signXdr(xdr) {
  const kp = getOrCreateKeypair()
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET)
  tx.sign(kp)
  return tx.toXDR()
}

export { Networks }
