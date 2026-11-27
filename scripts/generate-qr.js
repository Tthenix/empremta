import fs from 'node:fs';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import { config } from '../server/config.js';
import { stops } from '../server/content.js';
import { stopCode } from '../server/visits.js';

// Los carteles locales van a otra carpeta y con aviso: dist/qr queda solo para lo que se imprime.
const isLocalBase = /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(config.publicBaseUrl || '');
const outDir = path.resolve(isLocalBase ? 'dist/qr-prueba' : 'dist/qr');
const testBanner = 'PRUEBA LOCAL · NO IMPRIMIR · estos QR solo abren en esta computadora';
const horizontalLogoPath = path.resolve('doc/empremta-marca/logo/png/empremta-horizontal-color.png');
const appIconPath = path.resolve('doc/empremta-marca/web/empremta-icono-app-1024.png');
const regularFontPath = path.resolve('doc/brand/fonts/Archivo-Regular.ttf');
const boldFontPath = path.resolve('doc/brand/fonts/Archivo-Bold.ttf');

const ink = '#16202A';
const secondary = '#4A5866';
const brandBlue = '#1F4E79';
const ruleColor = '#C6D3DE';

function baseUrl() {
  const url = config.publicBaseUrl.replace(/\/$/, '');
  if (isLocalBase && !process.argv.includes('--allow-local')) {
    console.error(
      `PUBLIC_BASE_URL apunta a ${url}: un celular no puede abrir esos QR.\n` +
        'Usá la URL pública (ej. PUBLIC_BASE_URL=https://empremta-production.up.railway.app npm run qr)\n' +
        'o pasá --allow-local si de verdad querés QR locales (npm run qr -- --allow-local).'
    );
    process.exit(1);
  }
  return url;
}

function stopUrl(stop, publicBaseUrl) {
  return `${publicBaseUrl}/v/${stop.id}?c=${stopCode(stop.id)}`;
}

function readableStopUrl(stop, publicBaseUrl) {
  return `${publicBaseUrl.replace(/^https?:\/\//, '')}/v/${stop.id}`;
}

function placeText(lugar) {
  return lugar.replace(/,\s+/g, ' · ');
}

function sampleBilinear(png, x, y) {
  const clampedX = Math.max(0, Math.min(png.width - 1, x));
  const clampedY = Math.max(0, Math.min(png.height - 1, y));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(png.width - 1, x0 + 1);
  const y1 = Math.min(png.height - 1, y0 + 1);
  const wx = clampedX - x0;
  const wy = clampedY - y0;
  const channels = [0, 0, 0, 0];

  for (const [sx, sy, weight] of [
    [x0, y0, (1 - wx) * (1 - wy)],
    [x1, y0, wx * (1 - wy)],
    [x0, y1, (1 - wx) * wy],
    [x1, y1, wx * wy]
  ]) {
    const index = (sy * png.width + sx) * 4;
    for (let channel = 0; channel < 4; channel += 1) {
      channels[channel] += png.data[index + channel] * weight;
    }
  }
  return channels;
}

function resizePng(source, size) {
  const output = new PNG({ width: size, height: size });
  const scaleX = source.width / size;
  const scaleY = source.height / size;
  const samples = Math.max(1, Math.ceil(Math.max(scaleX, scaleY) / 2));
  const sampleCount = samples * samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const accumulated = [0, 0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const sourceX = (x + (sx + 0.5) / samples) * scaleX - 0.5;
          const sourceY = (y + (sy + 0.5) / samples) * scaleY - 0.5;
          const sample = sampleBilinear(source, sourceX, sourceY);
          for (let channel = 0; channel < 4; channel += 1) {
            accumulated[channel] += sample[channel];
          }
        }
      }
      const index = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        output.data[index + channel] = Math.round(accumulated[channel] / sampleCount);
      }
    }
  }
  return output;
}

function blendPixel(target, targetIndex, source, sourceIndex) {
  const sourceAlpha = source.data[sourceIndex + 3] / 255;
  const targetAlpha = target.data[targetIndex + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outAlpha === 0) {
    target.data.fill(0, targetIndex, targetIndex + 4);
    return;
  }
  for (let channel = 0; channel < 3; channel += 1) {
    target.data[targetIndex + channel] = Math.round(
      (source.data[sourceIndex + channel] * sourceAlpha +
        target.data[targetIndex + channel] * targetAlpha * (1 - sourceAlpha)) /
        outAlpha
    );
  }
  target.data[targetIndex + 3] = Math.round(outAlpha * 255);
}

function compositeCenterIcon(qrBuffer) {
  const qr = PNG.sync.read(qrBuffer);
  const icon = PNG.sync.read(fs.readFileSync(appIconPath));
  const iconSize = Math.round(qr.width * 0.2);
  const padding = Math.round(qr.width * 0.02);
  const backingSize = iconSize + padding * 2;
  const backingStart = Math.round((qr.width - backingSize) / 2);
  const iconStart = Math.round((qr.width - iconSize) / 2);

  for (let y = backingStart; y < backingStart + backingSize; y += 1) {
    for (let x = backingStart; x < backingStart + backingSize; x += 1) {
      const index = (y * qr.width + x) * 4;
      qr.data[index] = 255;
      qr.data[index + 1] = 255;
      qr.data[index + 2] = 255;
      qr.data[index + 3] = 255;
    }
  }

  const resizedIcon = resizePng(icon, iconSize);
  for (let y = 0; y < iconSize; y += 1) {
    for (let x = 0; x < iconSize; x += 1) {
      const targetIndex = ((iconStart + y) * qr.width + iconStart + x) * 4;
      const sourceIndex = (y * iconSize + x) * 4;
      blendPixel(qr, targetIndex, resizedIcon, sourceIndex);
    }
  }

  return PNG.sync.write(qr);
}

async function generatePng(stop, publicBaseUrl) {
  const url = stopUrl(stop, publicBaseUrl);
  const file = path.join(outDir, `parada-${stop.id}.png`);
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1024,
    color: { dark: brandBlue, light: '#ffffff' }
  });
  fs.writeFileSync(file, compositeCenterIcon(qrBuffer));
  return { file, url };
}

function registerPosterFonts(doc) {
  if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
    doc.registerFont('Archivo', regularFontPath);
    doc.registerFont('Archivo-Bold', boldFontPath);
    return { regular: 'Archivo', bold: 'Archivo-Bold' };
  }
  return { regular: 'Helvetica', bold: 'Helvetica-Bold' };
}

function fitFontSize(doc, text, font, maxSize, minSize, width) {
  doc.font(font);
  for (let size = maxSize; size >= minSize; size -= 0.5) {
    doc.fontSize(size);
    if (doc.widthOfString(text) <= width) return size;
  }
  return minSize;
}

async function generatePdf(items) {
  const file = path.join(outDir, 'qr-paradas-ruta-memoria.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  if (isLocalBase) drawTestBanner(doc);
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

async function generatePostersPdf(items, publicBaseUrl) {
  if (!fs.existsSync(horizontalLogoPath)) {
    throw new Error(`Falta el logo horizontal de marca: ${horizontalLogoPath}`);
  }
  if (!fs.existsSync(appIconPath)) {
    throw new Error(`Falta el ícono de app de marca: ${appIconPath}`);
  }

  const file = path.join(outDir, 'carteles-ruta-memoria.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 48, autoFirstPage: false });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);
  const fonts = registerPosterFonts(doc);

  items.forEach((item) => {
    doc.addPage({ size: 'A4', margin: 48 });
    if (isLocalBase) drawTestBanner(doc);
    const contentX = 48;
    const contentWidth = doc.page.width - contentX * 2;
    const centerX = doc.page.width / 2;

    const logoWidth = 220;
    doc.image(horizontalLogoPath, centerX - logoWidth / 2, 36, { width: logoWidth });

    const titleSize = fitFontSize(doc, item.stop.nombre, fonts.bold, 32, 24, contentWidth);
    doc.font(fonts.bold)
      .fontSize(titleSize)
      .fillColor(ink)
      .text(item.stop.nombre, contentX, 130, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });

    doc.font(fonts.regular)
      .fontSize(14)
      .fillColor(secondary)
      .text(placeText(item.stop.lugar), contentX, 176, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });

    doc.font(fonts.bold)
      .fontSize(19)
      .fillColor(brandBlue)
      .text('Escaneá con la cámara de tu celular', contentX, 214, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });

    doc.font(fonts.regular)
      .fontSize(13)
      .fillColor(secondary)
      .text('Escuchá la historia de este lugar y registrá tu visita.', contentX, 246, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });

    const frameSize = 312;
    const frameX = centerX - frameSize / 2;
    const frameY = 286;
    const qrPadding = 30;
    const qrSize = frameSize - qrPadding * 2;
    doc.save()
      .roundedRect(frameX, frameY, frameSize, frameSize, 16)
      .fillAndStroke('#ffffff', brandBlue)
      .restore();
    doc.image(item.file, frameX + qrPadding, frameY + qrPadding, { width: qrSize, height: qrSize });

    doc.font(fonts.regular)
      .fontSize(12)
      .fillColor(ink)
      .text(`o entrá a ${readableStopUrl(item.stop, publicBaseUrl)}`, contentX, frameY + frameSize + 25, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });

    const footerRuleY = 744;
    doc.save()
      .moveTo(contentX, footerRuleY)
      .lineTo(contentX + contentWidth, footerRuleY)
      .lineWidth(0.7)
      .strokeColor(ruleColor)
      .stroke()
      .restore();

    doc.font(fonts.regular)
      .fontSize(8.5)
      .fillColor(secondary)
      .text('Empremta · Huellas de Malvinas en Mendoza', contentX, footerRuleY + 12, {
        width: contentWidth,
        align: 'center',
        lineBreak: false
      });
    doc.text('Centro de Veteranos (cuenta de demostración) · Registro verificable en la red Stellar', contentX, footerRuleY + 27, {
      width: contentWidth,
      align: 'center',
      lineBreak: false
    });
  });

  doc.end();
  await finished(stream);
  return file;
}

function drawTestBanner(doc) {
  doc.save().rect(0, 0, doc.page.width, 26).fill('#B3261E').restore();
  doc.save().font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF')
    .text(testBanner, 0, 8, { width: doc.page.width, align: 'center', lineBreak: false })
    .restore();
  doc.fillColor('#17252f');
}

async function main() {
  if (!config.qrSecret) throw new Error('Falta QR_SECRET en .env. Corré primero npm run setup.');
  fs.mkdirSync(outDir, { recursive: true });
  const publicBaseUrl = baseUrl();
  const items = [];
  for (const stop of stops) {
    const generated = await generatePng(stop, publicBaseUrl);
    items.push({ stop, ...generated });
    console.log(`${stop.id}: ${generated.file}`);
    console.log(`  ${generated.url}`);
  }
  const pdf = await generatePdf(items);
  console.log(`PDF imprimible: ${pdf}`);
  const posters = await generatePostersPdf(items, publicBaseUrl);
  console.log(`Carteles de parada: ${posters}`);
  if (isLocalBase) console.log('\nAVISO: son QR de prueba (localhost) en dist/qr-prueba. Para imprimir, generá con la URL pública.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
