import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const horizonUrl = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
if (!horizonUrl.includes('testnet')) {
  throw new Error('HORIZON_URL debe contener "testnet". Este servidor se niega a arrancar contra otra red.');
}
const usdcMode = process.env.USDC_MODE || 'mock';
if (!['mock', 'circle'].includes(usdcMode)) {
  throw new Error('USDC_MODE debe ser "mock" o "circle".');
}

export const config = {
  horizonUrl,
  usdcMode,
  usdcCircleIssuer: process.env.USDC_CIRCLE_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  issuerSecret: process.env.ISSUER_SECRET || '',
  issuerPub: process.env.ISSUER_PUB || '',
  centroSecret: process.env.CENTRO_SECRET || '',
  centroPub: process.env.CENTRO_PUB || '',
  treasurySecret: process.env.TREASURY_SECRET || '',
  treasuryPub: process.env.TREASURY_PUB || '',
  usdcIssuerMockSecret: process.env.USDC_ISSUER_MOCK_SECRET || '',
  usdcIssuerMockPub: process.env.USDC_ISSUER_MOCK_PUB || '',
  qrSecret: process.env.QR_SECRET || '',
  huellasPorVisita: Number(process.env.HUELLAS_POR_VISITA || 10),
  costoCanje: Number(process.env.COSTO_CANJE || 30),
  descuentoPct: Number(process.env.DESCUENTO_PCT || 10),
  descuentoMaxUsdc: process.env.DESCUENTO_MAX_USDC || '1',
  arsPerUsdc: process.env.ARS_PER_USDC || '1400',
  aportePct: process.env.APORTE_PCT ? Number(process.env.APORTE_PCT) : null,
  descuentoMaxArs: process.env.DESCUENTO_MAX_ARS || '2000',
  geoRadiusM: Number(process.env.GEO_RADIUS_M || 200),
  demoMode: String(process.env.DEMO_MODE || 'true').toLowerCase() === 'true',
  demoFundUsdc: process.env.DEMO_FUND_USDC || '5',
  demoStartHuellas: Number(process.env.DEMO_START_HUELLAS || 0),
  demoStartUsdc: String(process.env.DEMO_START_USDC || 'false').toLowerCase() === 'true',
  maxNewWalletsPerIpPerDay: Number(process.env.MAX_NEW_WALLETS_PER_IP_PER_DAY || 5),
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS || 1),
  maxTicketArs: process.env.MAX_TICKET_ARS || '50000',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  homeDomain: process.env.HOME_DOMAIN || '',
  port: Number(process.env.PORT || 3000),
  dbPath: process.env.DB_PATH || './data/app.sqlite'
};
