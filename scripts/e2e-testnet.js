import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { config } from '../server/config.js';
import {
  assetBalance,
  buildOnboarding,
  getAccountBalances,
  HUELLA,
  submitOnboarding,
  USDC
} from '../server/stellar.js';

const EXPLORER_TX = 'https://stellar.expert/explorer/testnet/tx/';
const EXPLORER_ACCOUNT = 'https://stellar.expert/explorer/testnet/account/';

function signXdr(xdr, keypair) {
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
  tx.sign(keypair);
  return tx.toXDR();
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function main() {
  const visitor = Keypair.random();
  console.log(`Visitante de prueba: ${visitor.publicKey()}`);
  console.log(`Cuenta: ${EXPLORER_ACCOUNT}${visitor.publicKey()}`);

  const built = await buildOnboarding(visitor.publicKey());
  assert(!built.alreadyOnboarded, 'una cuenta nueva no debería venir onboarded');
  const signedXdr = signXdr(built.xdr, visitor);
  const submitted = await submitOnboarding(signedXdr);
  console.log(`Onboarding tx: ${submitted.txHash}`);
  console.log(`  ${EXPLORER_TX}${submitted.txHash}`);

  const balances = await getAccountBalances(visitor.publicKey());
  assert(balances.exists, 'la cuenta del visitante no existe después del onboarding');
  const account = balances.account;
  const huella = assetBalance(account, HUELLA);
  const usdc = assetBalance(account, USDC);
  assert(balances.xlm === '0.0000000', `XLM esperado 0.0000000, recibido ${balances.xlm}`);
  assert(huella, 'falta trustline HUELLA');
  assert(usdc, 'falta trustline USDC');
  assert(huella.is_authorized === true, 'la trustline HUELLA no quedó autorizada');
  const sponsors = [account.sponsor, huella.sponsor, usdc.sponsor].filter(Boolean);
  assert(
    account.sponsor === config.issuerPub || huella.sponsor === config.issuerPub || usdc.sponsor === config.issuerPub,
    `ninguna entrada muestra sponsor ISSUER (vistos: ${sponsors.join(',') || 'ninguno'})`
  );
  console.log(`Verificado: XLM=${balances.xlm}, HUELLA autorizada=${huella.is_authorized}, sponsor=${config.issuerPub}`);
  console.log('M1 OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
