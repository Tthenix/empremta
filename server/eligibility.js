import { config } from './config.js';
import { listVisits } from './db.js';
import { AppError } from './errors.js';

export function requiredVisitCount() {
  return Math.max(1, Math.ceil(config.costoCanje / config.huellasPorVisita));
}

export function assertCanjeVisits(publicKey) {
  const distinctStops = new Set(listVisits(publicKey).map((visit) => visit.stopId)).size;
  if (distinctStops < requiredVisitCount()) {
    throw new AppError('NOT_ENOUGH_VISITS', 'Te faltan lugares por visitar para canjear', 400);
  }
}
