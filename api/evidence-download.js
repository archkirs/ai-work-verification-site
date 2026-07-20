const sharp = require('sharp');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const assets = require('../evidence-assets.json');

const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const INK = '#111214';
const FONT_REGULAR = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const FONT_BOLD = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

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

function blockGeometry({ x, y, width, height, opacity, strong }) {
  const markSize = height * 0.62;
  const markX = x + height * 0.16;
  const markY = y + (height - markSize) / 2;
  const textX = markX + markSize + height * 0.18;
  const textRight = x + width - height * 0.16;
  return {
    x,
    y,
    width,
    height,
    opacity,
    strong,
    markSize,
    markX,
    markY,
    textX,
    textWidth: Math.max(1, textRight - textX),
  };
}

function imageBlockShape(block) {
  return `
    <g opacity="${block.opacity}">
      <rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="#fff" fill-opacity="0.80" stroke="${INK}" stroke-opacity="0.24" stroke-width="${Math.max(1, block.height * 0.012)}"/>
      ${gridSvg(block.markX, block.markY, block.markSize)}
    </g>`;
}

function buildImageShapeOverlay(width, height) {
  const short = Math.min(width, height);
  const margin = clamp(short * 0.03, 18, 90);
  const stripH = clamp(short * 0.065, 44, 120);
  const sideH = clamp(short * 0.11, 64, 170);
  const centreH = clamp(short * 0.135, 78, 210);
  const sideW = sideH * 3.45;
  const centreW = centreH * 3.55;
  const usableBottom = height - stripH;

  const blocks = [
    blockGeometry({ x: margin, y: margin, width: sideW, height: sideH, opacity: 0.78, strong: false }),
    blockGeometry({
      x: (width - centreW) / 2,
      y: clamp((usableBottom - centreH) / 2, margin, Math.max(margin, usableBottom - centreH - margin)),
      width: centreW,
      height: centreH,
      opacity: 1,
      strong: true,
    }),
    blockGeometry({
      x: Math.max(margin, width - sideW - margin),
      y: Math.max(margin, usableBottom - sideH - margin),
      width: sideW,
      height: sideH,
      opacity: 0.78,
      strong: false,
    }),
  ];

  const stripY = height - stripH;
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${blocks.map(imageBlockShape).join('')}
      <rect x="0" y="${stripY}" width="${width}" height="${stripH}" fill="#fff" fill-opacity="0.94"/>
      <line x1="0" y1="${stripY}" x2="${width}" y2="${stripY}" stroke="${INK}" stroke-opacity="0.28" stroke-width="${Math.max(1, stripH * 0.018)}"/>
    </svg>`);

  return { svg, blocks, margin, stripH, stripY, width, height };
}

async function renderTextLayer(text, width, height, fontfile, align = 'left') {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  return sharp({
    text: {
      text: `<span foreground="${INK}">${escapeXml(text)}</span>`,
      font: 'DejaVu Sans',
      fontfile,
      width: safeWidth,
      height: safeHeight,
      align,
      wrap: 'none',
      rgba: true,
    },
  }).png().toBuffer();
}

async function buildImageTextComposites(layout, asset) {
  const composites = [];

  for (const block of layout.blocks) {
    const brandH = block.height * (block.strong ? 0.23 : 0.21);
    const labelH = block.height * 0.16;
    const metaH = block.height * 0.13;

    const brand = await renderTextLayer('AsMade', block.textWidth, brandH, FONT_BOLD);
    const label = await renderTextLayer('MADE Record', block.textWidth, labelH, FONT_BOLD);
    const meta = await renderTextLayer(`${asset.recordId} | ${asset.materialId}`, block.textWidth, metaH, FONT_REGULAR);

    composites.push(
      { input: brand, left: Math.round(block.textX), top: Math.round(block.y + block.height * 0.14) },
      { input: label, left: Math.round(block.textX), top: Math.round(block.y + block.height * 0.42) },
      { input: meta, left: Math.round(block.textX), top: Math.round(block.y + block.height * 0.66) },
    );
  }

  const leftText = `AsMade | MADE Record | ${asset.recordId} | v${asset.recordVersion} | ${asset.materialId}`;
  const rightText = 'useasmade.com';
  const rightWidth = clamp(layout.width * 0.17, 120, 320);
  const stripTextHeight = layout.stripH * 0.42;
  const leftWidth = Math.max(1, layout.width - layout.margin * 3 - rightWidth);

  const leftLayer = await renderTextLayer(leftText, leftWidth, stripTextHeight, FONT_BOLD);
  const rightLayer = await renderTextLayer(rightText, rightWidth, stripTextHeight, FONT_BOLD, 'right');

  composites.push(
    { input: leftLayer, left: Math.round(layout.margin), top: Math.round(layout.stripY + layout.stripH * 0.28) },
    { input: rightLayer, left: Math.round(layout.width - layout.margin - rightWidth), top: Math.round(layout.stripY + layout.stripH * 0.28) },
  );

  return composites;
}

async function buildImageDerivative(source, asset) {
  const pipeline = sharp(source, { failOn: 'error' });
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) throw new Error('missing_image_dimensions');

  const layout = buildImageShapeOverlay(metadata.width, metadata.height);
  const textComposites = await buildImageTextComposites(layout, asset);
  const composited = pipeline.composite([
    { input: layout.svg, blend: 'over' },
    ...textComposites,
  ]);

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
