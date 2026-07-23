const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const pages = [
  { file: 'index.html', marker: 'A content passport for one AI-assisted work', interactive: false },
  { file: 'student.html', marker: 'AsMade for Students · one assignment, more context', interactive: true },
  { file: 'artist.html', marker: 'AsMade for Creative Work · show the choices behind the output', interactive: true },
  { file: 'reviewer.html', marker: 'AsMade for Reviewers · start with context, not a verdict', interactive: true },
];

const publicAssets = [
  { source: '/v4-audience-base.css', destination: '/lab/v4/v4.css' },
  { source: '/v4-audience-pages.css', destination: '/lab/v4/audience.css' },
  { source: '/v4-audience-polish.css', destination: '/lab/v4/polish.css' },
  { source: '/audience.js', destination: '/lab/v4/audience.js' },
];

function validateAssetDelivery() {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];

  for (const asset of publicAssets) {
    const sourcePath = path.join(root, asset.destination.replace(/^\//, ''));
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing adopted V4 source asset: ${asset.destination}`);
    }
    const mapped = rewrites.some(
      (rewrite) => rewrite.source === asset.source && rewrite.destination === asset.destination,
    );
    if (!mapped) {
      throw new Error(`Missing Vercel rewrite ${asset.source} -> ${asset.destination}`);
    }
  }
}

function validateCanonicalPage(page) {
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  const failures = [];

  if (!html.includes(page.marker)) failures.push('approved V4 marker missing');
  if (!html.includes('rel="canonical"')) failures.push('canonical metadata missing');
  if (!html.includes('/v4-audience-base.css')) failures.push('V4 base stylesheet missing');
  if (!html.includes('/v4-audience-pages.css')) failures.push('V4 audience stylesheet missing');
  if (!html.includes('/v4-audience-polish.css')) failures.push('V4 polish stylesheet missing');
  if (html.includes('/lab/v4/')) failures.push('Design Lab path leaked into canonical HTML');
  if (html.includes('design-lab-panel')) failures.push('Design Lab controls leaked into canonical HTML');
  if (/meta\s+name=["']robots["'][^>]*noindex/i.test(html)) failures.push('canonical noindex present');
  if (page.interactive && !html.includes('src="./audience.js"')) {
    failures.push('audience interaction script missing');
  }

  if (failures.length) {
    throw new Error(`${page.file}: ${failures.join('; ')}`);
  }
}

validateAssetDelivery();
pages.forEach(validateCanonicalPage);

console.log(`Validated ${pages.length} canonical V4 audience sources with identical Preview/production content selection.`);
