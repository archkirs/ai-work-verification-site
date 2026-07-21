import { spawn } from 'node:child_process';
import { access, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const input = resolve(root, process.argv[2] || 'summary-pdf-comic-prototype.html');
const output = resolve(
  root,
  process.argv[3] || 'artifacts/AsMade_MR-PILOT-EC-P050-001_v0.4_Summary_Prototype.pdf'
);

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable'
].filter(Boolean);

let chrome;
for (const candidate of chromeCandidates) {
  try {
    await access(candidate);
    chrome = candidate;
    break;
  } catch {
    // Try the next known executable path.
  }
}

if (!chrome) {
  console.error('No Chromium/Chrome executable found. Set CHROME_BIN to render the prototype PDF.');
  process.exit(1);
}

await mkdir(dirname(output), { recursive: true });

const args = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--virtual-time-budget=10000',
  `--print-to-pdf=${output}`,
  '--print-to-pdf-no-header',
  `file://${input}`
];

console.log(`Rendering ${input}`);
console.log(`Using ${chrome}`);
console.log(`Writing ${output}`);

const child = spawn(chrome, args, { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
