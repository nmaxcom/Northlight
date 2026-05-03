import { execFileSync, spawn } from 'node:child_process';
import { existsSync, statSync, watch } from 'node:fs';
import process from 'node:process';

const RESTART_DEBOUNCE_MS = 300;
const RESTART_SETTLE_MS = 700;
const EXIT_RESTART_BASE_DELAY_MS = 700;
const EXIT_RESTART_MAX_DELAY_MS = 5000;
const MAIN_ENTRY = 'dist-electron/main/main.js';
const DEV_COMMAND = 'NORTHLIGHT_DEV=1 npx electron-vite dev --watch';
const ELECTRON_PROCESS_MARKER = `${process.cwd()}/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron .`;

const watchTargets = [
  'electron',
  'src',
  'package.json',
  'package-lock.json',
  'electron.vite.config.ts',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json'
];

let child = null;
let shuttingDown = false;
let restartTimer = null;
let restartReason = null;
let restartCount = 0;
const expectedRestartChildren = new WeakSet();

function log(message) {
  process.stdout.write(`[dev-supervisor] ${message}\n`);
}

function findNorthlightElectronProcesses() {
  try {
    const output = execFileSync('ps', ['-ax', '-o', 'pid=,ppid=,command='], { encoding: 'utf8' });
    const processes = output
      .split('\n')
      .map((line) => line.trim())
      .map((line) => {
        const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
        return {
          pid: match?.[1] ?? '',
          ppid: match?.[2] ?? '',
          command: match?.[3] ?? line
        };
      });
    const profileByParent = new Map();

    for (const entry of processes) {
      if (entry.command.includes('Application Support/Northlight Dev')) {
        profileByParent.set(entry.ppid, 'Northlight Dev');
      } else if (entry.command.includes('Application Support/Northlight')) {
        profileByParent.set(entry.ppid, 'Northlight');
      }
    }

    return processes
      .filter((entry) => entry.command.includes(ELECTRON_PROCESS_MARKER))
      .map((entry) => ({
        pid: entry.pid || 'unknown',
        profile: profileByParent.get(entry.pid) ?? 'Northlight'
      }));
  } catch {
    return [];
  }
}

function logExistingProcesses(processes) {
  for (const entry of processes) {
    log(`already running: ${entry.profile} pid=${entry.pid}`);
  }
}

function createLineFilter(streamName) {
  let buffer = '';
  let suppressRendererUrlLines = 0;

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (suppressRendererUrlLines > 0) {
      suppressRendererUrlLines -= 1;
      return;
    }

    if (trimmed.includes("Warning: The 'NO_COLOR' env is ignored")) {
      return;
    }

    if (trimmed.includes("(electron) 'console-message' arguments are deprecated")) {
      return;
    }

    if (trimmed.includes('build the electron main process successfully')) {
      log('main built');
      return;
    }

    if (trimmed.includes('build the electron preload files successfully')) {
      log('preload built');
      return;
    }

    if (trimmed.includes('dev server running for the electron renderer process at:')) {
      suppressRendererUrlLines = 2;
      log('renderer dev server ready');
      return;
    }

    if (trimmed.includes('start electron app')) {
      log('launching Electron');
      return;
    }

    if (
      trimmed.startsWith('[main]') ||
      trimmed.startsWith('[renderer]') ||
      trimmed.toLowerCase().includes('error') ||
      trimmed.toLowerCase().includes('failed')
    ) {
      process[streamName].write(`${trimmed}\n`);
      return;
    }

    if (
      trimmed.startsWith('vite ') ||
      trimmed === 'watching for file changes...' ||
      trimmed === 'build started...' ||
      trimmed === 'transforming...' ||
      trimmed === 'rendering chunks...' ||
      trimmed.startsWith('✓') ||
      trimmed === '-----' ||
      trimmed.includes('built in ') ||
      trimmed.includes('dist-electron/')
    ) {
      return;
    }

    process[streamName].write(`${trimmed}\n`);
  };

  return (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      handleLine(line);
    }
  };
}

function startChild(reason = 'initial start') {
  if (shuttingDown) {
    return;
  }

  const existingDevProcesses = findNorthlightElectronProcesses().filter((entry) => entry.profile === 'Northlight Dev');
  if (existingDevProcesses.length > 0) {
    logExistingProcesses(existingDevProcesses);
    log(`not started: ${DEV_COMMAND}`);
    log('watching for source changes');
    return;
  }

  log(`command: ${DEV_COMMAND}`);
  log(`starting (${reason})`);
  child = spawn('npx', ['electron-vite', 'dev', '--watch'], {
    env: {
      ...process.env,
      NORTHLIGHT_DEV: '1'
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout?.on('data', createLineFilter('stdout'));
  child.stderr?.on('data', createLineFilter('stderr'));

  const spawnedChild = child;
  spawnedChild.on('exit', (code, signal) => {
    const expected = shuttingDown || expectedRestartChildren.has(spawnedChild);
    child = null;

    if (expected) {
      return;
    }

    if (code === 0 && !signal) {
      logExistingProcesses(findNorthlightElectronProcesses());
      log('child exited cleanly; keeping supervisor alive for the next source change');
      return;
    }

    if (!existsSync(MAIN_ENTRY)) {
      log(`child exited (${signal ?? code ?? 'unknown'}) and ${MAIN_ENTRY} is missing; waiting for a source change before retrying`);
      return;
    }

    const delay = Math.min(EXIT_RESTART_BASE_DELAY_MS * 2 ** restartCount, EXIT_RESTART_MAX_DELAY_MS);
    restartCount += 1;
    log(`child exited (${signal ?? code ?? 'unknown'}); restarting in ${delay}ms`);
    restartTimer = setTimeout(() => {
      restartTimer = null;
      startChild('child exit');
    }, delay);
  });
}

function stopChild(signal = 'SIGTERM') {
  if (!child) {
    return;
  }

  child.kill(signal);
}

function scheduleRestart(reason) {
  if (shuttingDown) {
    return;
  }

  restartReason = reason;
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    restartCount = 0;
    const reasonText = restartReason ?? 'file change';
    restartReason = null;

    if (!child) {
      startChild(reasonText);
      return;
    }

    log(`restarting after ${reasonText}`);
    const previousChild = child;
    expectedRestartChildren.add(previousChild);
    previousChild.once('exit', () => {
      setTimeout(() => startChild(reasonText), RESTART_SETTLE_MS);
    });
    previousChild.kill('SIGTERM');
  }, RESTART_DEBOUNCE_MS);
}

function watchTarget(target) {
  if (!existsSync(target)) {
    return null;
  }

  try {
    const targetStats = statSync(target);
    return watch(
      target,
      {
        recursive: targetStats.isDirectory()
      },
      (_eventType, filename) => {
        const changedPath = filename ? `${target}/${filename}` : target;
        scheduleRestart(changedPath);
      }
    );
  } catch (error) {
    log(`could not watch ${target}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const watchers = watchTargets.map(watchTarget).filter(Boolean);

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  for (const watcher of watchers) {
    watcher.close();
  }

  if (!child) {
    process.exit(0);
  }

  child.once('exit', () => process.exit(0));
  stopChild(signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startChild();
