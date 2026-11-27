import fs from 'node:fs';
import './config.js';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

export const stops = readJson('../content/stops.json');
export const merchants = readJson('../content/merchants.json').map((merchant) => ({
  ...merchant,
  pub: process.env[merchant.pubkeyEnv] || ''
}));

export function getStop(id) {
  return stops.find((stop) => stop.id === id) || null;
}

export function getMerchant(id) {
  return merchants.find((merchant) => merchant.id === id) || null;
}

export function stopListItem(stop) {
  return {
    id: stop.id,
    nombre: stop.nombre,
    lugar: stop.lugar,
    lat: stop.lat,
    lng: stop.lng,
    coordsVerificadas: stop.coordsVerificadas,
    foto: stop.foto,
    fotoAlt: stop.fotoAlt || null,
    fotoCredito: stop.fotoCredito || null,
    fotoFuente: stop.fotoFuente || null,
    audio: stop.audio
  };
}

export function stopDetail(stop) {
  return {
    ...stopListItem(stop),
    historiaCorta: stop.historiaCorta || null,
    historiaLarga: stop.historiaLarga || null,
    fuentesLugar: stop.fuentesLugar || [],
    testimonioDe: stop.testimonioDe || null,
    historia: stop.historia,
    fuente: stop.fuente,
    fuenteUrl: stop.fuenteUrl || null
  };
}

export function merchantListItem(merchant) {
  return {
    id: merchant.id,
    nombre: merchant.nombre,
    direccion: merchant.direccion,
    pctCentro: merchant.pctCentro,
    lat: merchant.lat,
    lng: merchant.lng,
    pub: merchant.pub
  };
}
