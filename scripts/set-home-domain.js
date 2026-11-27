import { Horizon, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { config } from '../server/config.js';
import { horizonToAppError } from '../server/errors.js';
import { configureHorizonTimeouts, horizonReadWithRetry } from '../server/horizon-utils.js';

configureHorizonTimeouts();

const EXPLORER_TX = 'https://stellar.expert/explorer/testnet/tx/';
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function usage() {
  console.error('Uso: npm run home-domain -- [--domain] <dominio corto>');
  console.error('Sin argumentos usa HOME_DOMAIN o el hostname de PUBLIC_BASE_URL.');
  process.exit(1);
}

function domainFromPublicBaseUrl() {
  try {
    return new URL(config.publicBaseUrl).hostname;
  } catch {
    return '';
  }
}

function parseDomain(argv) {
  let domain = '';
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--domain') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) usage();
      domain = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--domain=')) {
      domain = arg.slice('--domain='.length);
    } else if (arg.startsWith('--')) {
      usage();
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 1 || (positional.length === 1 && domain)) usage();
  return (positional[0] || domain || config.homeDomain || domainFromPublicBaseUrl()).trim().toLowerCase();
}

function assertValidHomeDomain(domain) {
  if (!domain) {
    throw new Error('No hay dominio para configurar. Definí HOME_DOMAIN o pasá --domain.');
  }
  if (domain.includes('://') || domain.includes('/') || domain.includes(':')) {
    throw new Error('home_domain debe ser solo un hostname, sin protocolo, puerto ni path.');
  }
  if (Buffer.byteLength(domain, 'utf8') > 32) {
    throw new Error(`home_domain admite hasta 32 bytes y "${domain}" tiene ${Buffer.byteLength(domain, 'utf8')}. Usá un dominio corto propio que sirva /.well-known/stellar.toml.`);
  }
  if (!DOMAIN_RE.test(domain) || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    throw new Error('home_domain debe ser un hostname DNS público en ASCII (por ejemplo demo.example.com).');
  }
}

function issuerKeypair() {
  if (!config.issuerSecret) throw new Error('Falta ISSUER_SECRET en .env');
  const keypair = Keypair.fromSecret(config.issuerSecret);
  if (keypair.publicKey() !== config.issuerPub) {
    throw new Error('ISSUER_SECRET no corresponde con ISSUER_PUB; revisá .env antes de firmar');
  }
  return keypair;
}

async function main() {
  if (!config.horizonUrl.includes('testnet')) {
    throw new Error('Este script solo puede operar contra Stellar testnet');
  }
  const domain = parseDomain(process.argv.slice(2));
  assertValidHomeDomain(domain);

  const server = new Horizon.Server(config.horizonUrl);
  const keypair = issuerKeypair();
  const issuerAccount = await horizonReadWithRetry(() => server.loadAccount(keypair.publicKey()));
  if (issuerAccount.home_domain === domain) {
    console.log(`ISSUER ya tiene home_domain=${domain}; no se envió otra transacción.`);
    return;
  }

  const tx = new TransactionBuilder(issuerAccount, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.setOptions({ homeDomain: domain }))
    .setTimeout(300)
    .build();
  tx.sign(keypair);

  try {
    const result = await server.submitTransaction(tx);
    console.log(`home_domain de ISSUER configurado: ${domain}`);
    console.log(`tx: ${result.hash}`);
    console.log(`${EXPLORER_TX}${result.hash}`);
  } catch (err) {
    const appError = horizonToAppError(err);
    throw new Error(`${appError.message} (${appError.code})`);
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
