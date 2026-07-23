const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const production = process.env.VERCEL_ENV === 'production';
const pages = [
  'lab/v4/index.html',
  'lab/v4/student.html',
  'lab/v4/artist.html',
  'lab/v4/reviewer.html',
  'index.html',
  'student.html',
  'artist.html',
  'reviewer.html',
  'records.html',
  'sample-comic.html',
  'sample-cv.html',
  'about.html',
  'contact/index.html',
  'privacy.html',
  'terms.html',
  'pilot-notice.html',
];

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function hasNoindex(html) {
  return /<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b[^"']*["'][^>]*>/i.test(html);
}

const failures = [];
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const isLab = file.startsWith('lab/v4/');
  const noindex = hasNoindex(html);
  const checks = [
    [count(html, /class="asmade-header"/g) === 1, 'shared header'],
    [count(html, /class="asmade-footer"/g) === 1, 'shared footer'],
    [count(html, /class="asmade-nav-link"/g) === 5, 'five primary nav cells'],
    [html.includes('<p class="asmade-footer-heading">Site</p>'), 'Site footer group'],
    [html.includes('<p class="asmade-footer-heading">Project</p>'), 'Project footer group'],
    [html.includes('<p class="asmade-footer-heading">Legal</p>'), 'Legal footer group'],
    [html.includes('/site-shell.css'), 'shared shell stylesheet'],
    [html.includes('/v4-content-safety.css'), 'content visibility guard'],
    [html.includes('v4-motion-enabled'), 'progressive motion init'],
    [html.includes('/v4-motion.js'), 'shared motion observer'],
    [!html.includes('class="site-header"'), 'no legacy site-header'],
    [!html.includes('class="v4-header"'), 'no legacy V4 header'],
    [!html.includes('class="site-footer"'), 'no legacy site-footer'],
    [!html.includes('{{'), 'no unresolved shell tokens'],
    [!isLab || noindex, 'Design Lab remains noindex'],
    [!production || isLab || !noindex, 'canonical production page has no accidental noindex'],
  ];
  for (const [ok, label] of checks) {
    if (!ok) failures.push(`${file}: ${label}`);
  }
}

if (failures.length) {
  console.error('Shared site shell QA failed:\n' + failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(`Shared site shell QA passed on ${pages.length} pages.`);
