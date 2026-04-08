import { spawn } from 'node:child_process';
import process from 'node:process';
import { exportDesignHtml } from './export-design-html.mjs';

const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4175'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

let printedLinks = false;
let exportStarted = false;

function printLinks(baseUrl) {
  if (printedLinks) {
    return;
  }

  printedLinks = true;
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const urls = [
    `${normalized}/design/`,
    `${normalized}/design/launcher-current-view.html`,
    `${normalized}/design/settings-current-view.html`
  ];

  process.stdout.write('\nDesign links:\n');
  for (const url of urls) {
    process.stdout.write(`  ${url}\n`);
  }
  process.stdout.write('\nChrome DevTools workspace:\n');
  process.stdout.write(`  ${normalized}/.well-known/appspecific/com.chrome.devtools.json\n`);
  process.stdout.write('  Open DevTools > Sources > Workspaces and click Connect if Chrome offers it.\n');
  process.stdout.write('\n');
}

async function exportStandaloneDesigns(baseUrl) {
  process.stdout.write('Generating self-contained design HTML...\n');
  await exportDesignHtml(baseUrl);
  process.stdout.write('Generated self-contained design HTML in /design/*.html\n\n');
}

function relay(chunk, writer) {
  const text = chunk.toString();
  writer.write(text);

  const match = text.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/);
  if (match) {
    const baseUrl = match[1];
    if (!exportStarted) {
      exportStarted = true;
      exportStandaloneDesigns(baseUrl).catch((error) => {
        process.stderr.write(`${error.stack ?? error}\n`);
        vite.kill('SIGTERM');
        process.exitCode = 1;
      });
    }
    printLinks(baseUrl);
  }
}

vite.stdout.on('data', (chunk) => relay(chunk, process.stdout));
vite.stderr.on('data', (chunk) => relay(chunk, process.stderr));

vite.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
