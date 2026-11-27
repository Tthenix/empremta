import { Keypair, Networks, Operation, StrKey, TransactionBuilder } from '@stellar/stellar-sdk';
import { config } from '../server/config.js';
import { horizonToAppError } from '../server/errors.js';
import { horizonReadWithRetry } from '../server/horizon-utils.js';
import { assetBalance, HUELLA, loadAccountOrNull, server } from '../server/stellar.js';

const EXPLORER_TX = 'https://stellar.expert/explorer/testnet/tx/';

function usage() {
  console.error('Uso: npm run revocar -- <G...pubkey> [--restore]');
  process.exit(1);
}

function parseArgs(argv) {
  const restore = argv.includes('--restore');
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const unknownFlags = argv.filter((arg) => arg.startsWith('--') && arg !== '--restore');
  if (positional.length !== 1 || unknownFlags.length > 0) usage();
  return { pubkey: positional[0], restore };
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
  const { pubkey, restore } = parseArgs(process.argv.slice(2));
  if (!StrKey.isValidEd25519PublicKey(pubkey)) {
    throw new Error('La clave pública no tiene formato válido (G...)');
  }
  if (!config.horizonUrl.includes('testnet')) {
    throw new Error('Este script solo puede operar contra Stellar testnet');
  }

  const account = await loadAccountOrNull(pubkey);
  if (!account) throw new Error('Esa cuenta no existe en testnet');
  const trustline = assetBalance(account, HUELLA);
  if (!trustline) throw new Error('Esa cuenta no tiene trustline de HUELLA');

  const authorized = trustline.is_authorized === true;
  if (!restore && !authorized) {
    console.log('La cuenta ya estaba suspendida para HUELLA; no se envió otra transacción.');
    return;
  }
  if (restore && authorized) {
    console.log('La cuenta ya estaba autorizada para HUELLA; no se envió otra transacción.');
    return;
  }

  const issuerAccount = await horizonReadWithRetry(() => server.loadAccount(config.issuerPub));
  const tx = new TransactionBuilder(issuerAccount, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.setTrustLineFlags({
      trustor: pubkey,
      asset: HUELLA,
      flags: { authorized: restore }
    }))
    .setTimeout(300)
    .build();
  tx.sign(issuerKeypair());

  try {
    const result = await server.submitTransaction(tx);
    console.log(restore ? 'Cuenta restaurada para recibir y usar Huellas.' : 'Cuenta suspendida para recibir y usar Huellas.');
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
