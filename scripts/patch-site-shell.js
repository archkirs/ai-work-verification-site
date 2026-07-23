const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const headerTemplate = fs.readFileSync(path.join(root, 'site-shell', 'header.html'), 'utf8').trim();
const footerTemplate = fs.readFileSync(path.join(root, 'site-shell', 'footer.html'), 'utf8').trim();

const preview = process.env.VERCEL_ENV !== 'production';
const routes = preview
  ? {
      home: '/lab/v4/',
      student: '/lab/v4/student.html',
      artist: '/lab/v4/artist.html',
      reviewer: '/lab/v4/reviewer.html',
    }
  : {
      home: '/',
      student: '/student.html',
      artist: '/artist.html',
      reviewer: '/reviewer.html',
    };

const pages = [
  { file: 'lab/v4/index.html', active: 'home', footer: 'home', landing: 'general' },
  { file: 'lab/v4/student.html', active: 'student', footer: 'student', landing: 'student' },
  { file: 'lab/v4/artist.html', active: 'artist', footer: 'artist', landing: 'artist' },
  { file: 'lab/v4/reviewer.html', active: 'reviewer', footer: 'reviewer', landing: 'reviewer' },
  { file: 'index.html', active: 'home', footer: 'home', landing: 'general' },
  { file: 'student.html', active: 'student', footer: 'student', landing: 'student' },
  { file: 'artist.html', active: 'artist', footer: 'artist', landing: 'artist' },
  { file: 'reviewer.html', active: 'reviewer', footer: 'reviewer', landing: 'reviewer' },
  { file: 'records.html', active: 'records', footer: 'records', landing: 'general' },
  { file: 'sample-comic.html', active: 'records', footer: 'records', landing: 'artist' },
  { file: 'sample-cv.html', active: 'records', footer: 'records', landing: 'general' },
  { file: 'about.html', active: '', footer: 'about', landing: 'general' },
  { file: 'contact/index.html', active: '', footer: 'contact', landing: 'general' },
  { file: 'privacy.html', active: '', footer: 'privacy', landing: 'general', legal: true },
  { file: 'terms.html', active: '', footer: 'terms', landing: 'general', legal: true },
  { file: 'pilot-notice.html', active: '', footer: 'pilot', landing: 'general', legal: true },
];

const headerPattern = /<header[^>]*class="[^"]*(?:v4-header|site-header)[^"]*"[^>]*>[\s\S]*?<\/header>/i;
const footerPattern = /<footer[^>]*class="[^"]*(?:v4-footer|site-footer|footer)[^"]*"[^>]*>[\s\S]*?<\/footer>/i;

function current(name, active) {
  return name === active ? 'aria-current="page"' : '';
}

function render(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (!(key in values)) throw new Error(`Missing shell token ${key}`);
    return values[key];
  });
}

function valuesFor(page) {
  return {
    HOME_URL: routes.home,
    STUDENT_URL: routes.student,
    ARTIST_URL: routes.artist,
    REVIEWER_URL: routes.reviewer,
    LANDING: page.landing,
    HOME_CURRENT: current('home', page.active),
    STUDENT_CURRENT: current('student', page.active),
    ARTIST_CURRENT: current('artist', page.active),
    REVIEWER_CURRENT: current('reviewer', page.active),
    RECORDS_CURRENT: current('records', page.active),
    FOOTER_HOME_CURRENT: current('home', page.footer),
    FOOTER_STUDENT_CURRENT: current('student', page.footer),
    FOOTER_ARTIST_CURRENT: current('artist', page.footer),
    FOOTER_REVIEWER_CURRENT: current('reviewer', page.footer),
    FOOTER_RECORDS_CURRENT: current('records', page.footer),
    FOOTER_ABOUT_CURRENT: current('about', page.footer),
    FOOTER_CONTACT_CURRENT: current('contact', page.footer),
    FOOTER_PRIVACY_CURRENT: current('privacy', page.footer),
    FOOTER_TERMS_CURRENT: current('terms', page.footer),
    FOOTER_PILOT_CURRENT: current('pilot', page.footer),
  };
}

function enhanceMotionMarkup(html, page) {
  if (!page.legal) return html;
  return html
    .replace(/class="legal-hero"/g, 'class="legal-hero fade"')
    .replace(/class="legal-section"/g, 'class="legal-section fade"');
}

function injectHeadAssets(html) {
  const assets = [];
  if (!html.includes('/site-shell.css')) {
    assets.push('<link rel="stylesheet" href="/site-shell.css" />');
  }
  if (!html.includes('/v4-content-safety.css')) {
    assets.push('<link rel="stylesheet" href="/v4-content-safety.css" />');
  }
  if (!html.includes('v4-motion-enabled')) {
    assets.push('<script>document.documentElement.classList.add("v4-motion-enabled")</script>');
  }
  if (!html.includes('/v4-motion.js')) {
    assets.push('<script src="/v4-motion.js" defer></script>');
  }
  if (!assets.length) return html;
  if (!html.includes('</head>')) throw new Error('Missing </head>');
  return html.replace('</head>', `  ${assets.join('\n  ')}\n</head>`);
}

for (const page of pages) {
  const absolute = path.join(root, page.file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Shared-shell target not found: ${page.file}`);
  }

  let html = fs.readFileSync(absolute, 'utf8');
  if (!headerPattern.test(html)) throw new Error(`Header not found in ${page.file}`);
  if (!footerPattern.test(html)) throw new Error(`Footer not found in ${page.file}`);

  const values = valuesFor(page);
  html = html.replace(headerPattern, render(headerTemplate, values));
  html = html.replace(footerPattern, render(footerTemplate, values));
  html = enhanceMotionMarkup(html, page);
  html = injectHeadAssets(html);
  fs.writeFileSync(absolute, html, 'utf8');
}

console.log(`Patched shared AsMade shell on ${pages.length} pages (${preview ? 'preview' : 'production'} routes).`);
