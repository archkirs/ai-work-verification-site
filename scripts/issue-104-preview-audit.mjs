import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE;
const CANONICAL = 'https://useasmade.com';
if (!BASE) throw new Error('AUDIT_BASE is required');

const pages = [
  ['Home','/','general','/'],
  ['Students','/student.html','student','/student.html'],
  ['Creative Work','/artist.html','artist','/artist.html'],
  ['Reviewers','/reviewer.html','reviewer','/reviewer.html'],
  ['MADE Records','/records.html','general','/records.html'],
  ['Comic MADE Record','/sample-comic.html','artist','/records.html'],
  ['Professional CV MADE Record','/sample-cv.html','general','/records.html'],
  ['About','/about.html','general',null],
  ['Contact','/contact','general',null],
  ['Privacy','/privacy.html','general',null],
  ['Terms','/terms.html','general',null],
  ['Pilot Notice','/pilot-notice.html','general',null],
];
const audienceRoutes = new Set(['/','/student.html','/artist.html','/reviewer.html']);
const failures=[]; let checks=0;
function check(ok,scope,detail){checks++; if(!ok) failures.push(`${scope}: ${detail}`);}
function meta(html, attr, key){
  const safe=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return html.match(new RegExp(`<meta[^>]+${attr}=["']${safe}["'][^>]+content=["']([^"']*)["'][^>]*>`,'i'))?.[1]?.trim()||'';
}
function canonical(html){return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]?.trim()||'';}
async function get(url, opts={}){return fetch(url,{redirect:'manual',headers:{'user-agent':'AsMade-Issue-104-Preview-Audit/1.0',...(opts.headers||{})},...opts});}

const discovered=new Set();
for(const [name,route,landing] of pages){
  const url=BASE+route; const r=await get(url); const html=await r.text();
  check(r.status===200,`HTTP ${name}`,`expected 200 got ${r.status}`);
  check(Boolean(html.match(/<title>[^<]+<\/title>/i)),`SEO ${name}`,'title present');
  check(Boolean(meta(html,'name','description')),`SEO ${name}`,'description present');
  check(canonical(html)===CANONICAL+route,`SEO ${name}`,`canonical=${canonical(html)||'(missing)'}`);
  check(!/\bnoindex\b/i.test(meta(html,'name','robots')),`SEO ${name}`,'canonical page indexable');
  for(const k of ['og:title','og:description','og:url','og:image']) check(Boolean(meta(html,'property',k)),`SEO ${name}`,`${k} present`);
  for(const k of ['twitter:card','twitter:title','twitter:description','twitter:image']) check(Boolean(meta(html,'name',k)),`SEO ${name}`,`${k} present`);
  if(route==='/') check(/application\/ld\+json/i.test(html)&&/"@type"\s*:\s*"WebSite"/i.test(html),'SEO Home','WebSite JSON-LD');
  check(!/\/lab\/v4\//i.test(html),`Leakage ${name}`,'no /lab/v4/ in canonical HTML');
  check(!/design-lab-panel|data-design-lab|lab-controls\.js/i.test(html),`Leakage ${name}`,'no Design Lab controls');
  check((html.match(/class=["'][^"']*asmade-nav-link\b[^"']*["']/gi)||[]).length===5,`Shell ${name}`,'five primary nav cells');
  check((html.match(/class=["'][^"']*asmade-header\b[^"']*["']/gi)||[]).length===1,`Shell ${name}`,'one shared header');
  check((html.match(/class=["'][^"']*asmade-footer\b[^"']*["']/gi)||[]).length===1,`Shell ${name}`,'one shared footer');
  const tally=[...html.matchAll(/https:\/\/tally\.so\/r\/NpQkRB\?landing=([a-z]+)/g)].map(m=>m[1]);
  check(tally.length>0,`Tally ${name}`,'CTA present');
  check(tally.every(v=>v===landing),`Tally ${name}`,`expected ${landing}, got ${[...new Set(tally)].join(',')}`);
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)){
    const href=m[1]; if(!href||href.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    try{const u=new URL(href,url); if(u.origin===new URL(BASE).origin&&!u.pathname.startsWith('/api/')) discovered.add(u.href);}catch{}
  }
}
for(const href of discovered){const r=await get(href); check(r.status>=200&&r.status<400,'Internal link',`${href} -> ${r.status}`); await r.body?.cancel();}

const robots=await get(BASE+'/robots.txt'); const robotsText=await robots.text();
check(robots.status===200,'robots.txt',`status ${robots.status}`); check(/Disallow:\s*\/api\//i.test(robotsText),'robots.txt','API disallow'); check(/Sitemap:\s*https:\/\/useasmade\.com\/sitemap\.xml/i.test(robotsText),'robots.txt','sitemap production canonical');
const sitemap=await get(BASE+'/sitemap.xml'); const sitemapText=await sitemap.text();
check(sitemap.status===200,'sitemap.xml',`status ${sitemap.status}`); for(const [,route] of pages) check(sitemapText.includes(`<loc>${CANONICAL+route}</loc>`),'sitemap.xml',`${route} listed`); check(!sitemapText.includes('/lab/v4/'),'sitemap.xml','Lab excluded');
for(const [src,dst] of [['/creator.html','/artist.html'],['/registry.html','/reviewer.html'],['/index.html','/'],['/contact/index.html','/contact']]){const r=await get(BASE+src); const loc=r.headers.get('location')||''; check(r.status===308,'Redirect',`${src} status ${r.status}`); check(new URL(loc,BASE).pathname===dst,'Redirect',`${src} -> ${loc}`); await r.body?.cancel();}
const missing=await get(BASE+'/__issue104-missing.html'); check(missing.status===404,'404',`status ${missing.status}`); await missing.body?.cancel();
for(const landing of ['general','student','artist','reviewer']){const r=await get(`https://tally.so/r/NpQkRB?landing=${landing}`); check(r.status>=200&&r.status<400,'Tally external',`${landing} -> ${r.status}`); await r.body?.cancel();}
for(const [key,file] of [['comic-summary-v1','AsMade_MR-PILOT-EC-P050-001_v0.4_Summary.pdf'],['cv-summary-v1','AsMade_MR-PILOT-CV-001_v0.3_Summary.pdf']]){const r=await get(`${BASE}/api/record-export-download?export=${key}&disposition=attachment`); check(r.status===200,'Summary PDF',`${key} status ${r.status}`); check((r.headers.get('content-type')||'').startsWith('application/pdf'),'Summary PDF',`${key} type`); check((r.headers.get('content-disposition')||'').includes(file),'Summary PDF',`${key} filename`); await r.body?.cancel();}
for(const [key,type] of [['comic-m001','image/png'],['cv-en','image/webp'],['cv-sr','image/webp']]){const r=await get(`${BASE}/api/evidence-download?asset=${key}&disposition=inline`); check(r.status===200,'Evidence',`${key} status ${r.status}`); check((r.headers.get('content-type')||'').startsWith(type),'Evidence',`${key} type`); check(/noindex/i.test(r.headers.get('x-robots-tag')||''),'Evidence',`${key} noindex`); await r.body?.cancel();}
const badEvidence=await get(`${BASE}/api/evidence-download?asset=private-raw-test&disposition=inline`); check(badEvidence.status===404,'Evidence','private/unknown rejected'); await badEvidence.body?.cancel();
const contact=await get(BASE+'/api/contact',{method:'POST',headers:{'content-type':'application/json',origin:BASE},body:JSON.stringify({email:'not-an-email',topic:'',message:''})}); let cb={}; try{cb=await contact.json();}catch{} check(contact.status===422,'Contact API',`validation status ${contact.status}`); check(Boolean(cb?.errors),'Contact API','structured validation errors');

const browser=await chromium.launch({headless:true});
for(const [key,width,height] of [['desktop',1440,900],['mobile390',390,844],['mobile320',320,760]]){
  const context=await browser.newContext({viewport:{width,height}}); const p=await context.newPage();
  for(const [name,route,,active] of pages){
    const resp=await p.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000}); await p.waitForTimeout(250);
    check(resp?.status()===200,`Browser ${key} ${name}`,`status ${resp?.status()}`);
    check(await p.locator('.asmade-header').count()===1,`Browser ${key} ${name}`,'header present');
    check(await p.locator('.asmade-footer').count()===1,`Browser ${key} ${name}`,'footer present');
    check(await p.locator('.asmade-nav-link').count()===5,`Browser ${key} ${name}`,'five nav cells');
    if(active) check(await p.locator(`.asmade-nav-link[aria-current="page"][href="${active}"]`).count()===1,`Browser ${key} ${name}`,'active nav');
    const overflow=await p.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth)); check(overflow<=1,`Browser ${key} ${name}`,`horizontal overflow ${overflow}px`);
    const hidden=await p.evaluate(()=>[...document.querySelectorAll('.fade')].filter(el=>{const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return r.height>0&&r.width>0&&(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)}).length); check(hidden===0,`Browser ${key} ${name}`,`hidden meaningful fade nodes ${hidden}`);
    if(audienceRoutes.has(route)){
      const heroCount=await p.locator('.dark-zone .hero').count();
      check(heroCount===1,`V4 ${key} ${name}`,'dark V4 hero present');
      if(heroCount===1){const display=await p.locator('.hero').evaluate(el=>getComputedStyle(el).display); check(display==='grid',`V4 ${key} ${name}`,`hero display ${display}`);}
    }
    if(route==='/sample-comic.html'||route==='/sample-cv.html'){
      const tabs=p.getByRole('tab'); const tabCount=await tabs.count(); check(tabCount===4,`Record ${key} ${name}`,'four tabs');
      if(tabCount===4){for(let i=1;i<4;i++) await tabs.nth(i).click(); check((await tabs.nth(3).getAttribute('aria-selected'))==='true',`Record ${key} ${name}`,'History tab activates');}
    }
  }
  await context.close();
}
const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}); const rp=await reduced.newPage(); await rp.goto(BASE+'/',{waitUntil:'domcontentloaded'}); await rp.waitForTimeout(100); const hiddenReduced=await rp.evaluate(()=>[...document.querySelectorAll('.fade')].filter(el=>Number(getComputedStyle(el).opacity)===0).length); check(hiddenReduced===0,'Reduced motion Home','meaningful content visible'); await reduced.close(); await browser.close();

console.log(`Issue #104 Preview audit: ${checks} checks, ${failures.length} failures`);
if(failures.length){console.error(failures.map(x=>'- '+x).join('\n')); process.exit(1);}