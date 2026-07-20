const sharp = require('sharp');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const assets = require('../evidence-assets.json');

const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const INK = '#111214';
const SVG_FONT = 'DejaVu Sans, sans-serif';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[char]));
}

function gridSvg(x, y, size, opacity = 0.72) {
  const scale = size / 32;
  const squares = [];
  for (const sy of [2, 10, 18, 26]) {
    for (const sx of [2, 10, 18, 26]) {
      squares.push(`<rect x="${x + sx * scale}" y="${y + sy * scale}" width="${4 * scale}" height="${4 * scale}"/>`);
    }
  }
  return `<g fill="${INK}" fill-opacity="${opacity}">${squares.join('')}</g>`;
}

function imageBlock({ x, y, width, height, asset, opacity, strong }) {
  const markSize = height * 0.62;
  const markX = x + height * 0.16;
  const markY = y + (height - markSize) / 2;
  const textX = markX + markSize + height * 0.18;
  const brandSize = height * (strong ? 0.22 : 0.20);
  const labelSize = height * 0.145;
  const metaSize = height * 0.12;
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff" fill-opacity="0.80" stroke="${INK}" stroke-opacity="0.24" stroke-width="${Math.max(1, height * 0.012)}"/>
      ${gridSvg(markX, markY, markSize)}
      <text x="${textX}" y="${y + height * 0.35}" font-family="${SVG_FONT}" font-size="${brandSize}" font-weight="700" fill="${INK}">AsMade</text>
      <text x="${textX}" y="${y + height * 0.57}" font-family="${SVG_FONT}" font-size="${labelSize}" font-weight="700" fill="${INK}">MADE Record</text>
      <text x="${textX}" y="${y + height * 0.79}" font-family="${SVG_FONT}" font-size="${metaSize}" font-weight="600" fill="${INK}">${escapeXml(asset.recordId)} | ${escapeXml(asset.materialId)}</text>
    </g>`;
}

function buildImageOverlay(width, height, asset) {
  const short = Math.min(width, height);
  const margin = clamp(short * 0.03, 18, 90);
  const stripH = clamp(short * 0.065, 44, 120);
  const sideH = clamp(short * 0.11, 64, 170);
  const centreH = clamp(short * 0.135, 78, 210);
  const sideW = sideH * 3.45;
  const centreW = centreH * 3.55;
  const usableBottom = height - stripH;

  const topLeft = { x: margin, y: margin, width: sideW, height: sideH };
  const centre = {
    x: (width - centreW) / 2,
    y: clamp((usableBottom - centreH) / 2, margin, Math.max(margin, usableBottom - centreH - margin)),
    width: centreW,
    height: centreH,
  };
  const bottomRight = {
    x: Math.max(margin, width - sideW - margin),
    y: Math.max(margin, usableBottom - sideH - margin),
    width: sideW,
    height: sideH,
  };

  const stripFont = clamp(stripH * 0.27, 11, 28);
  const stripY = height - stripH;
  const leftText = `AsMade | MADE Record | ${asset.recordId} | v${asset.recordVersion} | ${asset.materialId}`;
  const rightText = 'useasmade.com';

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${imageBlock({ ...topLeft, asset, opacity: 0.78, strong: false })}
      ${imageBlock({ ...centre, asset, opacity: 1, strong: true })}
      ${imageBlock({ ...bottomRight, asset, opacity: 0.78, strong: false })}
      <rect x="0" y="${stripY}" width="${width}" height="${stripH}" fill="#fff" fill-opacity="0.94"/>
      <line x1="0" y1="${stripY}" x2="${width}" y2="${stripY}" stroke="${INK}" stroke-opacity="0.28" stroke-width="${Math.max(1, stripH * 0.018)}"/>
      <text x="${margin}" y="${stripY + stripH * 0.62}" font-family="${SVG_FONT}" font-size="${stripFont}" font-weight="700" fill="${INK}">${escapeXml(leftText)}</text>
      <text x="${width - margin}" y="${stripY + stripH * 0.62}" text-anchor="end" font-family="${SVG_FONT}" font-size="${stripFont}" font-weight="700" fill="${INK}">${rightText}</text>
    </svg>`);
}

async function buildImageDerivative(source, asset) {
  const pipeline = sharp(source, { failOn: 'error' });
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) throw new Error('missing_image_dimensions');
  const overlay = buildImageOverlay(metadata.width, metadata.height, asset);
  const composited = pipeline.composite([{ input: overlay, blend: 'over' }]);
  if (asset.format === 'webp') {
    return { body: await composited.webp({ quality: 92, effort: 4 }).toBuffer(), contentType: 'image/webp' };
  }
  return { body: await composited.png({ compressionLevel: 9 }).toBuffer(), contentType: 'image/png' };
}

function drawPdfGrid(page, x, y, size, opacity) {
  const unit = size / 8;
  for (const gy of [0.5, 2.5, 4.5, 6.5]) {
    for (const gx of [0.5, 2.5, 4.5, 6.5]) {
      page.drawRectangle({
        x: x + gx * unit,
        y: y + gy * unit,
        width: unit,
        height: unit,
        color: rgb(0.067, 0.071, 0.078),
        opacity: 0.72 * opacity,
      });
    }
  }
}

function drawPdfBlock(page, fonts, asset, x, y, width, height, opacity, strong) {
  const ink = rgb(0.067, 0.071, 0.078);
  page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1), opacity: 0.80 * opacity, borderColor: ink, borderOpacity: 0.24 * opacity, borderWidth: 0.7 });
  const markSize = height * 0.60;
  const markX = x + height * 0.14;
  const markY = y + (height - markSize) / 2;
  drawPdfGrid(page, markX, markY, markSize, opacity);
  const textX = markX + markSize + height * 0.16;
  page.drawText('AsMade', { x: textX, y: y + height * 0.62, size: height * (strong ? 0.20 : 0.18), font: fonts.bold, color: ink, opacity });
  page.drawText('MADE Record', { x: textX, y: y + height * 0.40, size: height * 0.125, font: fonts.bold, color: ink, opacity });
  page.drawText(`${asset.recordId} | ${asset.materialId}`, { x: textX, y: y + height * 0.18, size: height * 0.095, font: fonts.regular, color: ink, opacity });
}

async function buildPdfDerivative(source, asset) {
  const pdf = await PDFDocument.load(source, { updateMetadata: false });
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const ink = rgb(0.067, 0.071, 0.078);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const short = Math.min(width, height);
    const margin = clamp(short * 0.035, 14, 28);
    const stripH = clamp(short * 0.055, 24, 42);
    const sideH = clamp(short * 0.095, 42, 68);
    const centreH = clamp(short * 0.12, 52, 84);
    const sideW = sideH * 3.45;
    const centreW = centreH * 3.55;

    drawPdfBlock(page, fonts, asset, margin, height - margin - sideH, sideW, sideH, 0.78, false);
    drawPdfBlock(page, fonts, asset, (width - centreW) / 2, (height - stripH - centreH) / 2, centreW, centreH, 1, true);
    drawPdfBlock(page, fonts, asset, width - margin - sideW, stripH + margin, sideW, sideH, 0.78, false);

    page.drawRectangle({ x: 0, y: 0, width, height: stripH, color: rgb(1, 1, 1), opacity: 0.94 });
    page.drawLine({ start: { x: 0, y: stripH }, end: { x: width, y: stripH }, thickness: 0.7, color: ink, opacity: 0.28 });
    const left = `AsMade | MADE Record | ${asset.recordId} | v${asset.recordVersion} | ${asset.materialId}`;
    page.drawText(left, { x: margin, y: stripH * 0.36, size: clamp(stripH * 0.24, 6.5, 10), font: fonts.bold, color: ink });
    const right = 'useasmade.com';
    const rightSize = clamp(stripH * 0.24, 6.5, 10);
    const rightWidth = fonts.bold.widthOfTextAtSize(right, rightSize);
    page.drawText(right, { x: width - margin - rightWidth, y: stripH * 0.36, size: rightSize, font: fonts.bold, color: ink });
  }

  const body = Buffer.from(await pdf.save({ useObjectStreams: true }));
  return { body, contentType: 'application/pdf' };
}

async function fetchSource(asset) {
  const response = await fetch(asset.sourceUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`source_http_${response.status}`);
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) throw new Error('source_too_large');
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > MAX_SOURCE_BYTES) throw new Error('source_too_large');
  return body;
}

module.exports = async function evidenceDownloadHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end('Method not allowed');
  }

  const assetKey = typeof req.query.asset === 'string' ? req.query.asset : '';
  const asset = Object.prototype.hasOwnProperty.call(assets, assetKey) ? assets[assetKey] : null;
  if (!asset) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Evidence derivative not found.');
  }

  const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';

  try {
    const source = await fetchSource(asset);
    const derivative = asset.kind === 'pdf'
      ? await buildPdfDerivative(source, asset)
      : await buildImageDerivative(source, asset);

    res.statusCode = 200;
    res.setHeader('Content-Type', derivative.contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${asset.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res.end(derivative.body);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'evidence_derivative_error',
      asset: assetKey,
      code: error && error.message ? error.message : 'unknown_error',
    }));
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end('Evidence derivative is temporarily unavailable.');
  }
};