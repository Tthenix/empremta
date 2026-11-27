import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { StrKey } from '@stellar/stellar-sdk';
import { config } from './config.js';
import { getMerchant, getStop, merchantListItem, merchants, stopDetail, stopListItem, stops } from './content.js';
import { getDemoFund, getVisitor, listMerchantPayments, listMerchantRedemptions, listPayments, listRedemptions, recordVisitor } from './db.js';
import { AppError, invalidInput } from './errors.js';
import { decimalToStroopsUnchecked, fmtStroops } from './money.js';
import { buildMerchantPayment, fundDemoOnce, submitMerchantPayment } from './payments.js';
import { buildMerchantRedemption, submitMerchantRedemption } from './redemptions.js';
import { assetBalance, buildHuellaTransfer, buildOnboarding, buildPollarHuellaAccess, getAccountBalances, HUELLA, submitHuellaTransfer, submitOnboarding, submitPollarHuellaAccess, USDC } from './stellar.js';
import { buildStellarToml } from './stellarToml.js';
import { getCentroOnChain, getHuellaRevocations } from './transparency.js';
import { registerVisit, visitsFor } from './visits.js';

export const app = express();
app.set('trust proxy', true);

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Demasiados intentos, esperá un minuto y probá de nuevo' }
    });
  }
});
app.use('/api', (req, res, next) => {
  if (isLocalhostIp(req.ip)) return next();
  if (req.method === 'POST') return postLimiter(req, res, next);
  return next();
});

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}


const onboardingWalletsByIpDay = new Map();

function isLocalhostIp(ip) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip || '');
}

function assertOnboardingIpAllowance(req, publicKey) {
  const ip = req.ip || 'unknown';
  if (isLocalhostIp(ip)) return;
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${ip}`;
  if (!onboardingWalletsByIpDay.has(key)) onboardingWalletsByIpDay.set(key, new Set());
  const wallets = onboardingWalletsByIpDay.get(key);
  if (!wallets.has(publicKey) && wallets.size >= config.maxNewWalletsPerIpPerDay) {
    throw new AppError('RATE_LIMITED', 'Se alcanzó el límite de cuentas nuevas por hoy. Probá mañana.', 429);
  }
  wallets.add(publicKey);
  if (onboardingWalletsByIpDay.size > 500) {
    for (const oldKey of onboardingWalletsByIpDay.keys()) {
      if (!oldKey.startsWith(`${day}:`)) onboardingWalletsByIpDay.delete(oldKey);
    }
  }
}

function requirePublicKey(value) {
  if (!StrKey.isValidEd25519PublicKey(value)) throw invalidInput('La clave pública no es válida');
}

app.get('/.well-known/stellar.toml', (req, res) => {
  res.set({
    'access-control-allow-origin': '*',
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=300'
  });
  res.send(buildStellarToml());
});

app.get('/api/config', (req, res) => {
  res.json({
    network: 'testnet',
    usdcMode: config.usdcMode,
    usdcLabel: config.usdcMode === 'mock' ? 'USDC (prueba)' : 'USDC',
    usdcAsset: { code: USDC.code, issuer: USDC.issuer },
    huellaAsset: { code: HUELLA.code, issuer: HUELLA.issuer },
    demoMode: config.demoMode,
    huellasPorVisita: config.huellasPorVisita,
    costoCanje: config.costoCanje,
    descuentoPct: config.descuentoPct,
    descuentoMaxUsdc: config.descuentoMaxUsdc,
    arsPerUsdc: config.arsPerUsdc,
    aportePct: config.aportePct,
    descuentoMaxArs: config.descuentoMaxArs,
    explorerTxUrl: 'https://stellar.expert/explorer/testnet/tx/',
    explorerAccountUrl: 'https://stellar.expert/explorer/testnet/account/',
    centroLabel: 'Centro de Veteranos (cuenta de demostración)',
    centroPub: config.centroPub
  });
});

app.get('/api/stops', (req, res) => {
  res.json(stops.map(stopListItem));
});

app.get('/api/stops/:id', (req, res) => {
  const stop = getStop(req.params.id);
  if (!stop) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'La parada no existe' } });
    return;
  }
  res.json(stopDetail(stop));
});

app.post('/api/onboard/build', asyncRoute(async (req, res) => {
  const { publicKey } = req.body || {};
  requirePublicKey(publicKey);
  assertOnboardingIpAllowance(req, publicKey);
  const result = await buildOnboarding(publicKey);
  res.json(result);
}));

app.post('/api/onboard/submit', asyncRoute(async (req, res) => {
  const { signedXdr } = req.body || {};
  const result = await submitOnboarding(signedXdr);
  if (result.publicKey) recordVisitor(result.publicKey, result.txHash);
  // Demo shortcut (DEMO_START_USDC=true): fund the new visitor right away so a
  // live test does not depend on a "load test balance" button. Off by default;
  // a funding failure never breaks onboarding.
  if (result.publicKey && config.demoMode && config.demoStartUsdc) {
    try {
      await fundDemoOnce(result.publicKey);
    } catch (err) {
      console.warn('[demo] auto-fund failed:', err?.code || err?.message);
    }
  }
  res.json({ txHash: result.txHash });
}));

app.post('/api/visit', asyncRoute(async (req, res) => {
  const result = await registerVisit(req.body);
  res.json(result);
}));

app.get('/api/account/:pub', asyncRoute(async (req, res) => {
  const pub = req.params.pub;
  requirePublicKey(pub);
  const balances = await getAccountBalances(pub);
  if (!balances.exists) {
    res.json({ exists: false, onboarded: false, huella: '0', usdc: '0', xlm: '0', visits: [], demoFunded: false });
    return;
  }
  const onboarded = Boolean(getVisitor(pub)) || Boolean(assetBalance(balances.account, HUELLA) && assetBalance(balances.account, USDC));
  res.json({
    exists: true,
    onboarded,
    huella: balances.huella,
    usdc: balances.usdc,
    xlm: balances.xlm,
    visits: visitsFor(pub),
    demoFunded: Boolean(getDemoFund(pub))
  });
}));

app.post('/api/pay/build', asyncRoute(async (req, res) => {
  const result = await buildMerchantPayment(req.body);
  res.json(result);
}));

app.post('/api/pay/submit', asyncRoute(async (req, res) => {
  const { signedXdr } = req.body || {};
  const result = await submitMerchantPayment(signedXdr);
  res.json(result);
}));

app.post('/api/redeem/build', asyncRoute(async (req, res) => {
  const result = await buildMerchantRedemption(req.body);
  res.json(result);
}));

app.post('/api/redeem/submit', asyncRoute(async (req, res) => {
  const { signedXdr } = req.body || {};
  const result = await submitMerchantRedemption(signedXdr);
  res.json(result);
}));

app.post('/api/pollar/huella-access/build', asyncRoute(async (req, res) => {
  const { publicKey } = req.body || {};
  requirePublicKey(publicKey);
  res.json(await buildPollarHuellaAccess(publicKey));
}));

app.post('/api/pollar/huella-access/submit', asyncRoute(async (req, res) => {
  const { signedXdr } = req.body || {};
  res.json(await submitPollarHuellaAccess(signedXdr));
}));

app.post('/api/pollar/huella-transfer/build', asyncRoute(async (req, res) => {
  const { publicKey, destination, amount } = req.body || {};
  requirePublicKey(publicKey);
  requirePublicKey(destination);
  res.json(await buildHuellaTransfer({ publicKey, destination, amount }));
}));

app.post('/api/pollar/huella-transfer/submit', asyncRoute(async (req, res) => {
  const { signedXdr } = req.body || {};
  res.json(await submitHuellaTransfer(signedXdr));
}));

app.get('/api/merchants', (req, res) => {
  res.json(merchants.map(merchantListItem));
});

app.get('/api/merchants/:id/payments', (req, res) => {
  const merchant = getMerchant(req.params.id);
  if (!merchant) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'El comercio no existe' } });
    return;
  }
  res.json(listMerchantPayments(req.params.id, req.query.since));
});

app.get('/api/merchants/:id/redemptions', (req, res) => {
  const merchant = getMerchant(req.params.id);
  if (!merchant) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'El comercio no existe' } });
    return;
  }
  res.json(listMerchantRedemptions(req.params.id, req.query.since));
});

app.get('/api/transparencia', asyncRoute(async (req, res) => {
  const paymentRows = listPayments().map((row) => ({
    ...row,
    tipo: 'pago',
    concepto: 'Aporte por pago en USDC'
  }));
  const redemptionRows = listRedemptions().map((row) => ({
    txHash: row.txHash,
    ref: row.ref,
    pubkey: row.pubkey,
    merchantId: row.merchantId,
    toCentro: row.aporteUsdc,
    huellasBurned: row.huellasBurned,
    createdAt: row.createdAt,
    tipo: 'canje',
    concepto: 'Aporte del comercio por canje'
  }));
  const rows = [...paymentRows, ...redemptionRows].sort((a, b) => b.createdAt - a.createdAt);
  const byMerchant = new Map();
  let total = 0n;
  for (const row of rows) {
    const centroStroops = decimalToStroopsUnchecked(row.toCentro || '0');
    total += centroStroops;
    const merchant = getMerchant(row.merchantId);
    const nombre = merchant?.nombre || row.merchantId;
    if (!byMerchant.has(row.merchantId)) {
      byMerchant.set(row.merchantId, { merchantId: row.merchantId, nombre, total: 0n, pagos: 0, canjes: 0 });
    }
    const group = byMerchant.get(row.merchantId);
    group.total += centroStroops;
    group.pagos += 1;
    if (row.tipo === 'canje') group.canjes += 1;
  }
  const [onChain, revocaciones] = await Promise.all([getCentroOnChain(), getHuellaRevocations()]);
  res.json({
    totalCentro: fmtStroops(total),
    pagos: rows.length,
    porComercio: [...byMerchant.values()].map((group) => ({
      merchantId: group.merchantId,
      nombre: group.nombre,
      totalCentro: fmtStroops(group.total),
      pagos: group.pagos,
      canjes: group.canjes
    })),
    lista: rows.map((row) => ({
      txHash: row.txHash,
      merchantId: row.merchantId,
      nombre: getMerchant(row.merchantId)?.nombre || row.merchantId,
      toCentro: row.toCentro,
      createdAt: row.createdAt,
      tipo: row.tipo,
      concepto: row.concepto
    })),
    centroPub: config.centroPub,
    onChain,
    revocaciones
  });
}));

app.post('/api/demo/fund', asyncRoute(async (req, res) => {
  const { publicKey } = req.body || {};
  requirePublicKey(publicKey);
  const result = await fundDemoOnce(publicKey);
  res.json(result);
}));

const webDist = path.resolve('web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'La ruta no existe' } });
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'El cuerpo de la solicitud no es válido' } });
    return;
  }
  if (err instanceof AppError) {
    if (err.details) console.error(`[${err.code}]`, err.details);
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'HORIZON_ERROR', message: 'Ocurrió un error inesperado' } });
});
