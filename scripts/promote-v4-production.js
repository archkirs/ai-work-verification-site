const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isProduction = process.env.VERCEL_ENV === 'production';

const pages = [
  { canonical: 'index.html', source: 'lab/v4/index.html' },
  { canonical: 'student.html', source: 'lab/v4/student.html' },
  { canonical: 'artist.html', source: 'lab/v4/artist.html' },
  { canonical: 'reviewer.html', source: 'lab/v4/reviewer.html' },
];

const productionAssets = [
  { source: 'lab/v4/v4.css', target: 'v4-audience-base.css' },
  { source: 'lab/v4/audience.css', target: 'v4-audience-pages.css' },
  { source: 'lab/v4/polish.css', target: 'v4-audience-polish.css' },
];

const productionStyles = productionAssets.map(
  ({ target }) => `<link rel="stylesheet" href="/${target}" />`,
);

function extract(html, pattern, label, file) {
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing ${label} in ${file}`);
  return match[0];
}

function prepareHead(canonicalHtml, file) {
  let head = extract(canonicalHtml, /<head>[\s\S]*?<\/head>/i, '<head>', file);

  // Keep the canonical production metadata, schema, favicon and observability,
  // but replace legacy page CSS with the approved V4 audience-page system.
  head = head.replace(/\s*<link[^>]+rel=["']stylesheet["'][^>]*\/?>/gi, '');
  head = head.replace('</head>', `  ${productionStyles.join('\n  ')}\n</head>`);
  return head;
}

function prepareBody(v4Html, file) {
  let body = extract(v4Html, /<body[^>]*>[\s\S]*?<\/body>/i, '<body>', file);

  // Design Lab controls are review-only and must never ship on canonical routes.
  body = body.replace(/\s*<aside[^>]*class=["'][^"']*design-lab-panel[^"']*["'][^>]*>[\s\S]*?<\/aside>/i, '');
  body = body.replace(/\s*<script[^>]+src=["'](?:\.\.\/|\/)?lab-controls\.js["'][^>]*><\/script>/gi, '');

  // Canonical audience navigation must never point back into the Design Lab.
  body = body
    .replaceAll('/lab/v4/student.html', '/student.html')
    .replaceAll('/lab/v4/artist.html', '/artist.html')
    .replaceAll('/lab/v4/reviewer.html', '/reviewer.html')
    .replaceAll('/lab/v4/', '/');

  return body;
}

function buildCanonical(canonicalHtml, v4Html, mapping) {
  const head = prepareHead(canonicalHtml, mapping.canonical);
  const body = prepareBody(v4Html, mapping.source);
  const headIndex = canonicalHtml.indexOf('<head>');
  if (headIndex < 0) throw new Error(`Missing canonical document prefix in ${mapping.canonical}`);
  const prefix = canonicalHtml.slice(0, headIndex);
  const output = `${prefix}${head}\n${body}\n</html>\n`;

  const failures = [];
  if (!output.includes('A content passport for one AI-assisted work') && mapping.canonical === 'index.html') {
    failures.push('V4 Home marker missing');
  }
  if (output.includes('design-lab-panel')) failures.push('Design Lab panel remains');
  if (output.includes('lab-controls.js')) failures.push('Design Lab script remains');
  if (/meta\s+name=["']robots["'][^>]*noindex/i.test(output)) failures.push('noindex remains');
  if (output.includes('/lab/v4/')) failures.push('Design Lab path remains in canonical output');
  if (!head.includes('rel="canonical"')) failures.push('canonical metadata missing');
  if (!productionStyles.every((style) => head.includes(style))) failures.push('V4 production styles missing');

  if (failures.length) {
    throw new Error(`${mapping.canonical}: ${failures.join('; ')}`);
  }
  return output;
}

function publishCanonicalAssets() {
  if (!isProduction) return;

  for (const asset of productionAssets) {
    const sourcePath = path.join(root, asset.source);
    const targetPath = path.join(root, asset.target);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing V4 source asset: ${asset.source}`);
    fs.copyFileSync(sourcePath, targetPath);
  }
}

publishCanonicalAssets();

for (const mapping of pages) {
  const canonicalPath = path.join(root, mapping.canonical);
  const sourcePath = path.join(root, mapping.source);
  const canonicalHtml = fs.readFileSync(canonicalPath, 'utf8');
  const v4Html = fs.readFileSync(sourcePath, 'utf8');
  const output = buildCanonical(canonicalHtml, v4Html, mapping);

  if (isProduction) {
    fs.writeFileSync(canonicalPath, output, 'utf8');
  }
}

console.log(
  isProduction
    ? `Promoted approved V4 audience pages to ${pages.length} canonical production routes with canonical V4 assets.`
    : `Validated V4 production promotion for ${pages.length} canonical routes (Preview dry run).`,
);
