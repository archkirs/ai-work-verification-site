import fs from 'node:fs/promises';
import path from 'node:path';

const base = 'https://useasmade.com';
const out = 'audit-source-output';
const routes = ['/', '/student.html', '/artist.html', '/reviewer.html', '/records.html', '/about.html', '/contact'];

await fs.mkdir(out, { recursive: true });

for (const route of routes) {
  const response = await fetch(`${base}${route}`, {
    redirect: 'manual',
    headers: { 'user-agent': 'AsMade-Issue-100-Audit/1.0' },
  });
  const html = await response.text();
  const safe = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/g, '');
  await fs.writeFile(path.join(out, `${safe}.html`), html);

  const labContexts = [];
  let pos = html.indexOf('/lab/v4/');
  while (pos >= 0 && labContexts.length < 10) {
    labContexts.push(html.slice(Math.max(0, pos - 100), Math.min(html.length, pos + 180)).replace(/\s+/g, ' '));
    pos = html.indexOf('/lab/v4/', pos + 1);
  }

  const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0]?.slice(0, 1200).replace(/\s+/g, ' ') || '(none)';
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0]?.slice(0, 1200).replace(/\s+/g, ' ') || '(none)';
  const info = {
    route,
    status: response.status,
    bytes: Buffer.byteLength(html),
    asmadeHeaderOccurrences: (html.match(/asmade-header/g) || []).length,
    asmadeFooterOccurrences: (html.match(/asmade-footer/g) || []).length,
    asmadeNavLinkOccurrences: (html.match(/asmade-nav-link/g) || []).length,
    labV4Occurrences: (html.match(/\/lab\/v4\//g) || []).length,
    designLabOccurrences: (html.match(/design-lab-panel|data-design-lab|lab-controls\.js/g) || []).length,
    header,
    footer,
    labContexts,
  };
  await fs.writeFile(path.join(out, `${safe}.json`), JSON.stringify(info, null, 2));
  console.log(JSON.stringify(info));
}
