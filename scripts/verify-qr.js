import fs from 'node:fs';
import path from 'node:path';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

const originalPublicBaseUrl = process.env.PUBLIC_BASE_URL;
const { stops } = await import('../server/content.js');
const { stopCode } = await import('../server/visits.js');

const outDir = path.resolve('dist/qr');
const productionBaseUrl = 'https://empremta-production.up.railway.app';

function baseUrl() {
  const flagIndex = process.argv.indexOf('--base-url');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) return process.argv[flagIndex + 1].replace(/\/$/, '');
  return (originalPublicBaseUrl || productionBaseUrl).replace(/\/$/, '');
}

function decodePng(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
}

function main() {
  const publicBaseUrl = baseUrl();
  let failed = false;

  for (const stop of stops) {
    const file = path.join(outDir, `parada-${stop.id}.png`);
    const expected = `${publicBaseUrl}/v/${stop.id}?c=${stopCode(stop.id)}`;
    if (!fs.existsSync(file)) {
      console.error(`FAIL ${path.basename(file)}: archivo inexistente`);
      failed = true;
      continue;
    }

    const decoded = decodePng(file);
    if (!decoded) {
      console.error(`FAIL ${path.basename(file)}: no se pudo decodificar`);
      failed = true;
      continue;
    }
    if (decoded.data !== expected) {
      console.error(`FAIL ${path.basename(file)}: decodificó ${decoded.data}; esperado ${expected}`);
      failed = true;
      continue;
    }
    console.log(`OK ${path.basename(file)} -> ${decoded.data}`);
  }

  if (failed) process.exit(1);
  console.log(`QR verificados: ${stops.length}/${stops.length} contra ${publicBaseUrl}`);
}

main();
