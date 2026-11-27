import fs from 'node:fs';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { config } from '../server/config.js';
import { stops } from '../server/content.js';
import { stopCode } from '../server/visits.js';

const outDir = path.resolve('dist/qr');
const simpleIsotypePath = path.resolve('doc/brand/png/empremta-isotipo-simple-color.png');

function baseUrl() {
  const url = config.publicBaseUrl.replace(/\/$/, '');
  const isLocal = /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(url);
  if (isLocal && !process.argv.includes('--allow-local')) {
    console.error(
      `PUBLIC_BASE_URL apunta a ${url}: un celular no puede abrir esos QR.\n` +
        'Usá la URL pública (ej. PUBLIC_BASE_URL=https://empremta-production.up.railway.app npm run qr)\n' +
        'o pasá --allow-local si de verdad querés QR locales (npm run qr -- --allow-local).'
    );
    process.exit(1);
  }
  return url;
}

function stopUrl(stop) {
  return `${baseUrl()}/v/${stop.id}?c=${stopCode(stop.id)}`;
}

async function generatePng(stop) {
  const url = stopUrl(stop);
  const file = path.join(outDir, `parada-${stop.id}.png`);
  await QRCode.toFile(file, url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 640,
    color: { dark: '#17252f', light: '#ffffff' }
  });
  return { file, url };
}

async function generatePdf(items) {
  const file = path.join(outDir, 'qr-paradas-ruta-memoria.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  doc.fontSize(20).text('Ruta de la Memoria · Malvinas · Mendoza', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#3f4f5f').text('Escaneá cada código con la cámara del celular para abrir la parada.', { align: 'center' });
  doc.fillColor('#17252f');

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = pageWidth / 3;
  const qrSize = 145;
  const top = 120;

  items.forEach((item, index) => {
    const x = doc.page.margins.left + columnWidth * index + (columnWidth - qrSize) / 2;
    doc.image(item.file, x, top, { width: qrSize, height: qrSize });
    const textX = doc.page.margins.left + columnWidth * index + 6;
    const textWidth = columnWidth - 12;
    doc.fontSize(12).text(item.stop.nombre, textX, top + qrSize + 12, {
      width: textWidth,
      align: 'center'
    });
    doc.fontSize(9).fillColor('#4c5b68').text(item.stop.lugar, textX, top + qrSize + 58, {
      width: textWidth,
      align: 'center'
    });
    doc.fontSize(6.5).fillColor('#5f6e7a').text(item.url, textX, top + qrSize + 103, {
      width: textWidth,
      align: 'center'
    });
    doc.fillColor('#17252f');
  });

  doc.fontSize(10).fillColor('#4c5b68').text(
    'Contenido en preparación: los relatos finales los aportan los veteranos y su agrupación.',
    48,
    760,
    { width: pageWidth, align: 'center' }
  );
  doc.end();
  await finished(stream);
  return file;
}

async function generatePostersPdf(items) {
  if (!fs.existsSync(simpleIsotypePath)) {
    throw new Error(`Falta el isotipo simple de marca: ${simpleIsotypePath}`);
  }
  const file = path.join(outDir, 'carteles-ruta-memoria.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 56, autoFirstPage: false });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  items.forEach((item, index) => {
    doc.addPage({ size: 'A4', margin: 56 });
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const centerX = doc.page.margins.left + pageWidth / 2;

    doc.image(simpleIsotypePath, centerX - 38, 42, { width: 76 });
    doc.fillColor('#16202A')
      .fontSize(28)
      .text(item.stop.nombre, doc.page.margins.left, 138, {
        width: pageWidth,
        align: 'center',
        lineGap: 3
      });
    doc.fillColor('#4A5866')
      .fontSize(14)
      .text(item.stop.lugar, doc.page.margins.left, 196, {
        width: pageWidth,
        align: 'center',
        lineGap: 2
      });

    const qrSize = 300;
    const qrY = 246;
    doc.image(item.file, centerX - qrSize / 2, qrY, { width: qrSize, height: qrSize });

    doc.fillColor('#16202A')
      .fontSize(17)
      .text(
        'Escaneá para conocer la historia de este lugar y registrar tu visita',
        doc.page.margins.left + 24,
        qrY + qrSize + 28,
        { width: pageWidth - 48, align: 'center', lineGap: 4 }
      );

    doc.fillColor('#1F4E79')
      .fontSize(10)
      .text(
        'Empremta · Huellas de Malvinas en Mendoza',
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom - 16,
        { width: pageWidth, align: 'center', lineBreak: false }
      );

    if (index < items.length - 1) doc.fillColor('#16202A');
  });

  doc.end();
  await finished(stream);
  return file;
}

async function main() {
  if (!config.qrSecret) throw new Error('Falta QR_SECRET en .env. Corré primero npm run setup.');
  fs.mkdirSync(outDir, { recursive: true });
  const items = [];
  for (const stop of stops) {
    const generated = await generatePng(stop);
    items.push({ stop, ...generated });
    console.log(`${stop.id}: ${generated.file}`);
    console.log(`  ${generated.url}`);
  }
  const pdf = await generatePdf(items);
  console.log(`PDF imprimible: ${pdf}`);
  const posters = await generatePostersPdf(items);
  console.log(`Carteles de parada: ${posters}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
