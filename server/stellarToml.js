import { Networks, StrKey } from '@stellar/stellar-sdk';
import { config } from './config.js';

function tomlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function publicOrigin() {
  try {
    return new URL(config.publicBaseUrl).origin;
  } catch {
    return config.publicBaseUrl.replace(/\/$/, '');
  }
}

function validAccounts() {
  return [...new Set([
    config.issuerPub,
    config.centroPub,
    config.treasuryPub,
    config.usdcMode === 'mock' ? config.usdcIssuerMockPub : ''
  ].filter((account) => StrKey.isValidEd25519PublicKey(account)))];
}

export function buildStellarToml() {
  const origin = publicOrigin();
  const accounts = validAccounts()
    .map((account) => `  ${tomlString(account)}`)
    .join(',\n');
  const logoUrl = `${origin}/icons/app-icon-1024.png`;

  return `# Empremta · Ruta de la Memoria · Stellar testnet
VERSION = "2.7.0"
NETWORK_PASSPHRASE = ${tomlString(Networks.TESTNET)}
ACCOUNTS = [
${accounts}
]

[DOCUMENTATION]
ORG_NAME = "Empremta - Ruta de la Memoria (cuenta de demostración)"
ORG_DBA = "Empremta"
ORG_URL = ${tomlString(origin)}
ORG_LOGO = ${tomlString(logoUrl)}
ORG_DESCRIPTION = "Proyecto de demostración de hackathon para una ruta de memoria en Mendoza. La cuenta del Centro de Veteranos es una cuenta de demostración y no afirma participación ni aval oficial de ninguna institución."

[[CURRENCIES]]
code = "HUELLA"
issuer = ${tomlString(config.issuerPub)}
status = "test"
display_decimals = 0
name = "Huella Ruta"
desc = "Unidad de participación de demostración emitida en Stellar testnet para registrar visitas de la Ruta de la Memoria. No tiene valor monetario."
conditions = "Asset clásico de testnet. El emisor de demostración exige autorización de trustlines y puede suspenderlas ante fraude. No es redimible ni representa fondos."
image = ${tomlString(logoUrl)}
is_unlimited = true
is_asset_anchored = false
`;
}
