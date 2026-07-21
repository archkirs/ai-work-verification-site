import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const inputPath = resolve(root, 'summary-pdf-cv-prototype.html');
const outputPath = resolve(root, 'summary-pdf-cv-export.html');

let html = await readFile(inputPath, 'utf8');

const replacements = [
  ['<title>MADE Record — Summary PDF Prototype — Professional CV</title>', '<title>MADE Record — Summary PDF — Professional CV</title>'],
  ['<body class="summary-pdf-prototype cv-summary-prototype">', '<body class="summary-pdf-prototype cv-summary-prototype cv-summary-export">'],
  ['aria-label="MADE Record Summary PDF CV prototype"', 'aria-label="MADE Record Summary PDF CV export"'],
  ['<span>SUMMARY PDF · PRIVACY VALIDATION v0.2</span>', '<span>SUMMARY PDF · summary-pdf-v1</span>'],
  ['Only the approved Issue #66 branded redacted M2-001 Representation is shown. Raw CV and direct contact details remain outside this public-safe prototype.', 'Only the approved Issue #66 branded redacted M2-001 Representation is shown. Raw CV and direct contact details remain outside this public-safe Summary PDF.'],
  ['<dt>Prototype Export ID</dt><dd>EXP-MR-PILOT-CV-001-V0.3-SUM-PROT-001</dd>', '<dt>Export ID</dt><dd>EXP-MR-PILOT-CV-001-V0.3-SUMMARY-001</dd>'],
  ['<span>Product-review prototype · not a published Record Export</span>', '<span>MADE Record Summary PDF</span>']
];

for (const [from, to] of replacements) {
  if (!html.includes(from)) {
    throw new Error(`Expected CV prototype source fragment not found: ${from}`);
  }
  html = html.split(from).join(to);
}

const prototypeNote = /\n\s*<div class="prototype-note" role="note">[\s\S]*?<\/div>\n/;
if (!prototypeNote.test(html)) {
  throw new Error('Expected CV prototype review note not found');
}
html = html.replace(prototypeNote, '\n');

const exportStyles = [
  'summary-pdf-overrides.css',
  'summary-pdf-cv-export.css'
];
for (const stylesheet of exportStyles) {
  if (!html.includes(`href="${stylesheet}"`)) {
    html = html.replace('</head>', `  <link rel="stylesheet" href="${stylesheet}" />\n</head>`);
  }
}

const forbidden = [
  'PRODUCT REVIEW PROTOTYPE',
  'PRIVACY VALIDATION v0.2',
  'Prototype Export ID',
  'SUM-PROT-001',
  'not a published Record Export'
];
for (const value of forbidden) {
  if (html.includes(value)) throw new Error(`Prototype-only marker remained in CV export source: ${value}`);
}

const requiredPrivacyMarkers = [
  'EXP-MR-PILOT-CV-001-V0.3-SUMMARY-001',
  'cv-summary-export',
  'summary-pdf-cv-export.css',
  'branded-redacted-page-1-v1.webp',
  'branded-redacted-page-2-v1.webp',
  'Raw CV and direct contact details remain outside this public-safe Summary PDF.',
  'Phone, personal email, address, website and LinkedIn URL are excluded from the approved redacted M2-001 preview.',
  'The raw CV remains restricted.',
  'M2-002 · M2-004 · M2-006 · raw files or conversations are not embedded.',
  'M2-005 · M2-008'
];
for (const value of requiredPrivacyMarkers) {
  if (!html.includes(value)) throw new Error(`Required CV privacy/export marker missing: ${value}`);
}

await writeFile(outputPath, html, 'utf8');
console.log(`Generated ${outputPath}`);
