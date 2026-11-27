import crypto from 'node:crypto';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { config } from './config.js';
import { getStop } from './content.js';
import { hasVisit, listVisits, recordVisit } from './db.js';
import { AppError, invalidInput } from './errors.js';
import { getAccountBalances, mintVisit } from './stellar.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const visitLocks = new Set();
const warnedUnverified = new Set();

export function stopCode(stopId) {
  return crypto.createHmac('sha256', config.qrSecret).update(stopId).digest('hex').slice(0, 16);
}

export function haversineM(lat1, lng1, lat2, lng2) {
  const radius = 6371000;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validateSignature({ publicKey, stopId, ts, signature }) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) throw invalidInput('La clave pública no es válida');
  if (typeof signature !== 'string' || signature.length < 16) {
    throw new AppError('INVALID_SIGNATURE', 'La firma de la visita no es válida', 400);
  }
  const message = Buffer.from(`visita:${stopId}:${ts}`, 'utf8');
  let valid = false;
  try {
    valid = Keypair.fromPublicKey(publicKey).verify(message, Buffer.from(signature, 'base64'));
  } catch {
    valid = false;
  }
  if (!valid) throw new AppError('INVALID_SIGNATURE', 'La firma de la visita no es válida', 400);
}

function validateTimestamp(ts) {
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > FIVE_MINUTES_MS) {
    throw new AppError('EXPIRED', 'La visita venció, escaneá el QR y probá de nuevo', 400);
  }
}

function validateCode(stopId, code) {
  if (typeof code !== 'string' || code.toLowerCase() !== stopCode(stopId)) {
    throw new AppError('INVALID_CODE', 'El código del QR no es válido para esta parada', 400);
  }
}

function validateGeo(stop, lat, lng) {
  if (config.demoMode) return;
  if (!stop.coordsVerificadas) {
    if (!warnedUnverified.has(stop.id)) {
      console.warn(`Parada ${stop.id}: coordenadas sin verificar; se omite validación de distancia`);
      warnedUnverified.add(stop.id);
    }
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError('TOO_FAR', 'Necesitamos tu ubicación para registrar esta visita', 400);
  }
  const distance = haversineM(lat, lng, stop.lat, stop.lng);
  if (distance > config.geoRadiusM) {
    throw new AppError('TOO_FAR', 'Parece que no estás cerca de este lugar de memoria', 400);
  }
}

export async function registerVisit(input) {
  const { publicKey, stopId, code, lat, lng, ts, signature } = input || {};
  const stop = getStop(stopId);
  if (!stop) throw invalidInput('La parada no existe');

  validateSignature({ publicKey, stopId, ts, signature });
  validateTimestamp(ts);
  validateCode(stopId, code);
  validateGeo(stop, lat, lng);

  const lockKey = `${publicKey}:${stopId}`;
  if (visitLocks.has(lockKey) || hasVisit(publicKey, stopId)) {
    throw new AppError('ALREADY_VISITED', 'Esta visita ya quedó registrada', 409);
  }

  visitLocks.add(lockKey);
  try {
    if (hasVisit(publicKey, stopId)) {
      throw new AppError('ALREADY_VISITED', 'Esta visita ya quedó registrada', 409);
    }
    const minted = await mintVisit(publicKey, stopId);
    try {
      recordVisit({ pubkey: publicKey, stopId, txHash: minted.txHash });
    } catch (err) {
      if (String(err?.code || '').includes('SQLITE_CONSTRAINT')) {
        throw new AppError('ALREADY_VISITED', 'Esta visita ya quedó registrada', 409);
      }
      throw err;
    }
    const balances = await getAccountBalances(publicKey);
    return { txHash: minted.txHash, huellas: balances.huella };
  } finally {
    visitLocks.delete(lockKey);
  }
}

export function visitsFor(pubkey) {
  return listVisits(pubkey);
}
