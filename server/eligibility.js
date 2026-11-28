import { config } from './config.js';
import { listVisits } from './db.js';
import { AppError } from './errors.js';

export function requiredVisitCount() {
  return Math.max(1, Math.ceil(config.costoCanje / config.huellasPorVisita));
}

// A demo that grants Huellas at onboarding (DEMO_START_HUELLAS) cannot also
// demand the full route, otherwise a live test at a merchant is impossible.
function visitRuleRelaxedForDemo() {
  return config.demoMode && config.demoStartHuellas > 0;
}

export function assertCanjeVisits(publicKey) {
  if (visitRuleRelaxedForDemo()) return;
  const distinctStops = new Set(listVisits(publicKey).map((visit) => visit.stopId)).size;
  const missing = requiredVisitCount() - distinctStops;
  if (missing > 0) {
    const lugares = missing === 1 ? '1 lugar' : `${missing} lugares`;
    throw new AppError('NOT_ENOUGH_VISITS', `Te faltan ${lugares} por visitar para canjear`, 400);
  }
}
