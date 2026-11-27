import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  Asset,
  AuthRequiredFlag,
  AuthRevocableFlag,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder
} from '@stellar/stellar-sdk';

const ENV_PATH = '.env';
const DEFAULTS = {
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  USDC_MODE: 'mock',
  USDC_CIRCLE_ISSUER: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  HUELLAS_POR_VISITA: '10',
  COSTO_CANJE: '30',
  DESCUENTO_PCT: '10',
  DESCUENTO_MAX_USDC: '1',
  GEO_RADIUS_M: '200',
  DEMO_MODE: 'true',
  DEMO_FUND_USDC: '5',
  PUBLIC_BASE_URL: 'http://localhost:3000',
  PORT: '3000',
  DB_PATH: './data/app.sqlite'
};
const ORDER = [
  'HORIZON_URL', 'USDC_MODE', 'USDC_CIRCLE_ISSUER',
  'ISSUER_SECRET', 'ISSUER_PUB', 'CENTRO_SECRET', 'CENTRO_PUB',
  'TREASURY_SECRET', 'TREASURY_PUB', 'MERCHANT_1_SECRET', 'MERCHANT_1_PUB',
  'MERCHANT_2_SECRET', 'MERCHANT_2_PUB', 'USDC_ISSUER_MOCK_SECRET', 'USDC_ISSUER_MOCK_PUB',
  'QR_SECRET', 'HUELLAS_POR_VISITA', 'COSTO_CANJE', 'DESCUENTO_PCT', 'DESCUENTO_MAX_USDC',
  'GEO_RADIUS_M', 'DEMO_MODE', 'DEMO_FUND_USDC', 'PUBLIC_BASE_URL', 'PORT', 'DB_PATH'
];
const KEY_NAMES = ['ISSUER', 'CENTRO', 'TREASURY', 'MERCHANT_1', 'MERCHANT_2', 'USDC_ISSUER_MOCK'];
const EXPLORER_ACCOUNT = 'https://stellar.expert/explorer/testnet/account/';

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

function writeEnvFile(env) {
  const lines = ORDER.map((key) => `${key}=${env[key] ?? ''}`);
  fs.writeFileSync(ENV_PATH, `${lines.join('\n')}\n`);
}

function assertTestnet(url) {
  if (!url.includes('testnet')) {
    throw new Error('HORIZON_URL debe contener "testnet". Setup cancelado.');
  }
}

async function accountExists(server, pub) {
  try {
    return await server.accounts().accountId(pub).call();
  } catch (err) {
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') return null;
    throw err;
  }
}

async function waitForAccount(server, pub, attempts = 12) {
  for (let i = 0; i < attempts; i += 1) {
    const account = await accountExists(server, pub);
    if (account) return account;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

async function fundWithFriendbot(server, pub) {
  const existing = await accountExists(server, pub);
  if (existing) return false;
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pub)}`);
  if (!res.ok) throw new Error(`Friendbot falló para ${pub}: HTTP ${res.status}`);
  const account = await waitForAccount(server, pub);
  if (!account) throw new Error(`Friendbot respondió pero Horizon no muestra la cuenta ${pub}`);
  return true;
}

async function submitTx(server, sourceSecret, operations) {
  const keypair = Keypair.fromSecret(sourceSecret);
  const account = await server.loadAccount(keypair.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  });
  for (const operation of operations) builder.addOperation(operation);
  const tx = builder.setTimeout(300).build();
  tx.sign(keypair);
  return server.submitTransaction(tx);
}

function assetBalance(account, asset) {
  if (!account) return null;
  return account.balances.find((balance) => (
    (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
    balance.asset_code === asset.code &&
    balance.asset_issuer === asset.issuer
  ));
}

function decimalToStroops(value) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 10_000_000n + BigInt((fraction + '0000000').slice(0, 7));
}

function stroopsToDecimal(stroops) {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / 10_000_000n;
  const fraction = String(abs % 10_000_000n).padStart(7, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

function printHorizonError(err) {
  const codes = err?.response?.data?.extras?.result_codes;
  return codes ? JSON.stringify(codes) : (err?.response?.data?.detail || err.message);
}

async function main() {
  const env = { ...DEFAULTS, ...readEnvFile() };
  assertTestnet(env.HORIZON_URL);
  if (!env.QR_SECRET) env.QR_SECRET = crypto.randomBytes(32).toString('hex');

  for (const name of KEY_NAMES) {
    const secretKey = `${name}_SECRET`;
    const pubKey = `${name}_PUB`;
    let keypair;
    if (env[secretKey]) {
      try {
        keypair = Keypair.fromSecret(env[secretKey]);
      } catch {
        throw new Error(`${secretKey} existe en .env pero no es una clave secreta válida`);
      }
    } else {
      keypair = Keypair.random();
      env[secretKey] = keypair.secret();
    }
    env[pubKey] = keypair.publicKey();
  }

  writeEnvFile(env);

  const server = new Horizon.Server(env.HORIZON_URL);
  const funded = [];
  for (const name of KEY_NAMES) {
    const pub = env[`${name}_PUB`];
    if (await fundWithFriendbot(server, pub)) funded.push(name);
  }
  console.log(funded.length ? `Cuentas nuevas fondeadas con Friendbot: ${funded.join(', ')}` : 'Todas las cuentas ya existían; no hizo falta Friendbot.');

  const issuerKeypair = Keypair.fromSecret(env.ISSUER_SECRET);
  const issuer = await server.loadAccount(issuerKeypair.publicKey());
  const flags = issuer.flags || {};
  if (!flags.auth_required || !flags.auth_revocable) {
    const result = await submitTx(server, env.ISSUER_SECRET, [
      Operation.setOptions({ setFlags: AuthRequiredFlag | AuthRevocableFlag })
    ]);
    console.log(`Flags de ISSUER configurados. tx=${result.hash}`);
  } else {
    console.log('Flags de ISSUER ya configurados.');
  }

  const usdcIssuer = env.USDC_MODE === 'circle' ? env.USDC_CIRCLE_ISSUER : env.USDC_ISSUER_MOCK_PUB;
  const usdc = new Asset('USDC', usdcIssuer);
  for (const name of ['CENTRO', 'TREASURY', 'MERCHANT_1', 'MERCHANT_2']) {
    const pub = env[`${name}_PUB`];
    const account = await server.loadAccount(pub);
    if (!assetBalance(account, usdc)) {
      const result = await submitTx(server, env[`${name}_SECRET`], [
        Operation.changeTrust({ asset: usdc, source: pub })
      ]);
      console.log(`Trustline USDC abierta para ${name}. tx=${result.hash}`);
    } else {
      console.log(`Trustline USDC de ${name} ya existe.`);
    }
  }

  if (env.USDC_MODE === 'mock') {
    const target = decimalToStroops('10000');
    const treasuryAccount = await server.loadAccount(env.TREASURY_PUB);
    const current = decimalToStroops(assetBalance(treasuryAccount, usdc)?.balance || '0');
    if (current < target) {
      const amount = stroopsToDecimal(target - current);
      const result = await submitTx(server, env.USDC_ISSUER_MOCK_SECRET, [
        Operation.payment({ destination: env.TREASURY_PUB, asset: usdc, amount })
      ]);
      console.log(`USDC mock emitido a TREASURY (${amount}). tx=${result.hash}`);
    } else {
      console.log('TREASURY ya tiene al menos 10.000 USDC mock.');
    }
  } else {
    console.log('USDC_MODE=circle. Un humano tiene que fondear TREASURY en https://faucet.circle.com');
    console.log(`TREASURY: ${env.TREASURY_PUB}`);
  }

  const issuerAfter = await server.loadAccount(env.ISSUER_PUB);
  console.log('\nCuentas de testnet:');
  for (const name of KEY_NAMES) {
    const pub = env[`${name}_PUB`];
    console.log(`${name}: ${pub}`);
    console.log(`  ${EXPLORER_ACCOUNT}${pub}`);
  }
  console.log('\nFlags de ISSUER:', JSON.stringify(issuerAfter.flags));
  if (!issuerAfter.flags?.auth_required || !issuerAfter.flags?.auth_revocable) {
    throw new Error('ISSUER no quedó con auth_required y auth_revocable activos');
  }
  console.log('\nSetup idempotente completo. .env actualizado (no commitear).');
}

main().catch((err) => {
  console.error('Setup falló:', printHorizonError(err));
  process.exit(1);
});
