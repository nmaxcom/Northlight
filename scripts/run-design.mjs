import { spawn } from 'node:child_process';

const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4175'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

let printedLinks = false;

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
  process.stdout.write('\n');
}

function relay(chunk, writer) {
  const text = chunk.toString();
  writer.write(text);

  const match = text.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/);
  if (match) {
    printLinks(match[1]);
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
