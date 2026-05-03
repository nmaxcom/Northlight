import { spawn } from 'node:child_process';
import { existsSync, statSync, watch } from 'node:fs';
import process from 'node:process';

const RESTART_DEBOUNCE_MS = 300;
const RESTART_SETTLE_MS = 700;
const EXIT_RESTART_BASE_DELAY_MS = 700;
const EXIT_RESTART_MAX_DELAY_MS = 5000;
const MAIN_ENTRY = 'dist-electron/main/main.js';

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

function startChild(reason = 'initial start') {
  if (shuttingDown) {
    return;
  }

  log(`starting electron-vite dev --watch (${reason})`);
  child = spawn('npx', ['electron-vite', 'dev', '--watch'], {
    env: {
      ...process.env,
      NORTHLIGHT_DEV: '1'
    },
    stdio: 'inherit'
  });

  const spawnedChild = child;
  spawnedChild.on('exit', (code, signal) => {
    const expected = shuttingDown || expectedRestartChildren.has(spawnedChild);
    child = null;

    if (expected) {
      return;
    }

    if (code === 0 && !signal) {
      log('child exited cleanly; supervisor stopping');
      shutdown('SIGTERM');
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
