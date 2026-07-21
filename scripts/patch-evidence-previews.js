const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const RECORD_STYLESHEET = '<link rel="stylesheet" href="record-demo.css" />';
const EVIDENCE_POLISH_STYLESHEET = '<link rel="stylesheet" href="/record-evidence-polish.css" />';

const replacements = {
  'sample-comic.html': [
    {
      asset: 'comic-m001',
      source: 'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-ec-p050-001/materials/m-001/presentation-v1.png',
    },
  ],
  'sample-cv.html': [
    {
      asset: 'cv-en',
      source: 'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-page-1-v1.webp',
    },
    {
      asset: 'cv-sr',
      source: 'https://s3.eu-central-003.backblazeb2.com/asmade-public-presentation-euc1-7f3a9c/public-demo/mr-pilot-cv-001/materials/m2-001/redacted-page-2-v1.webp',
    },
  ],
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureEvidencePolishStylesheet(html, filename) {
  if (html.includes(EVIDENCE_POLISH_STYLESHEET)) return html;
  if (!html.includes(RECORD_STYLESHEET)) {
    throw new Error(`Expected Record stylesheet link in ${filename}.`);
  }
  return html.replace(
    RECORD_STYLESHEET,
    `${RECORD_STYLESHEET}\n  ${EVIDENCE_POLISH_STYLESHEET}`,
  );
}

for (const [filename, assets] of Object.entries(replacements)) {
  const filepath = path.join(ROOT, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  html = ensureEvidencePolishStylesheet(html, filename);

  for (const { asset, source } of assets) {
    const sourcePattern = escapeRegExp(source);
    const pairPattern = new RegExp(
      `(<a\\s+href=")${sourcePattern}("[^>]*>\\s*<img\\s+src=")${sourcePattern}("[^>]*>)`,
      'g',
    );

    let count = 0;
    html = html.replace(pairPattern, (_match, beforeHref, between, afterImg) => {
      count += 1;
      return `${beforeHref}evidence-viewer.html?asset=${asset}${between}/api/evidence-download?asset=${asset}&amp;disposition=inline${afterImg}`;
    });

    if (count !== 1) {
      throw new Error(`Expected exactly one Work preview pair for ${asset} in ${filename}; found ${count}.`);
    }
  }

  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`Patched protected Evidence Work previews and heading polish in ${filename}.`);
}
