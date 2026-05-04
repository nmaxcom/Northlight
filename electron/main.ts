import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron';
import { execFile, spawn } from 'node:child_process';
import { access, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { homedir } from 'node:os';
import { platform } from 'node:process';
import packageJson from '../package.json';
import { shouldHideLauncherApp } from '../src/lib/launcher/dismissBehavior';
import { getLauncherOpenStrategy } from '../src/lib/launcher/openTarget';
import { DEFAULT_LAUNCHER_SHORTCUT, FALLBACK_LAUNCHER_SHORTCUT, resolveLauncherShortcut } from '../src/lib/shortcuts';
import type { LauncherPreview, LauncherSettings, LocalSearchItem, SearchIntent } from '../src/lib/search/types';
import { buildPathAutocompleteState, expandHomePath } from '../src/lib/search/pathAutocomplete';
import { createBlurSuppressionDeadline, shouldHideLauncherOnBlur } from '../src/lib/windowVisibility';
import { getIdleTraceSummary, getTraceDump, getTraceState, ingestRendererTrace, recordTrace, setTraceEnabled, traceSpan, writeTraceDumpFile } from './diagnostics';
import {
  configureIndexWatchers,
  getRecentLocalSelections,
  getScopeInsights,
  getSearchStatus,
  recordLocalSelection,
  requestSearchRefresh,
  searchHotPaths,
  searchIndexedPaths,
  setIndexChangedListener,
  warmSearchIndex
} from './search';
import {
  ensureLauncherState,
  getClipboardHistory,
  getLauncherStateSnapshot,
  getSearchPerformance,
  getLauncherSettings,
  recordSearchPerformanceSample,
  saveLauncherSettings,
  startClipboardMonitor
} from './settings';
import { buildFilePreview } from './filePreview';
import { readFileTextPreview } from './previewText';
import { resolveAppIconDataUrl, resolveCachedAppIconDataUrl } from './appIcon';
import { prewarmFinderIconHelper, resolveFinderIconDataUrl } from './finderIcon';

const BASE_APP_NAME = packageJson.productName ?? 'Northlight';
const IS_DEV_SESSION = process.env.NORTHLIGHT_DEV === '1' || Boolean(process.env.ELECTRON_RENDERER_URL);
const DEV_INSTANCE_SUFFIX = process.env.NORTHLIGHT_DEV_INSTANCE ? ` ${process.env.NORTHLIGHT_DEV_INSTANCE}` : '';
const APP_NAME = IS_DEV_SESSION ? `${BASE_APP_NAME} Dev${DEV_INSTANCE_SUFFIX}` : BASE_APP_NAME;

// Set identity paths before single-instance lock so dev runs do not collide with generic Electron apps.
try {
  app.setName(APP_NAME);
  const appDataPath = app.getPath('appData');
  app.setPath('userData', join(appDataPath, APP_NAME));
} catch {
  // Keep default paths when Electron refuses early path overrides.
}

const WINDOW_WIDTH = 1120;
const WINDOW_HEIGHT = 760;
const COMPACT_WINDOW_WIDTH = 760;
const COMPACT_WINDOW_HEIGHT = 360;
const SETTINGS_WINDOW_WIDTH = 980;
const SETTINGS_WINDOW_HEIGHT = 760;
const DEVTOOLS_SHORTCUT = 'CommandOrControl+Shift+J';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let rendererReady = false;
let pendingShow = false;
let registeredLauncherShortcut: string | null = null;
let launcherSettingsCache = getLauncherStateSnapshot().settings;
let blurSuppressionDeadline = 0;
let pendingLauncherPositionSave: ReturnType<typeof setTimeout> | null = null;
let launcherDevToolsPinned = false;
let launcherLayoutMode: 'compact' | 'full' = 'compact';
const iconCache = new Map<string, string | null>();
const previewCache = new Map<string, LauncherPreview | null>();
let mainRequestSequence = 0;
const LAUNCHER_POSITION_SAVE_DEBOUNCE_MS = 160;
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const HOME_PATH = homedir();
const APP_ICON_PREWARM_ROOTS = ['/Applications', '/System/Applications', join(HOME_PATH, 'Applications')];
const APP_ICON_PREWARM_LIMIT = 96;
const APP_ICON_PREWARM_CONCURRENCY = 4;

function logFatalContext(label: string, payload?: unknown) {
  try {
    if (payload instanceof Error) {
      console.error(`[main] ${label}: ${payload.stack ?? payload.message}`);
      return;
    }

    if (payload !== undefined) {
      console.error(`[main] ${label}: ${JSON.stringify(payload)}`);
      return;
    }

    console.error(`[main] ${label}`);
  } catch {
    console.error(`[main] ${label}`);
  }
}

async function readDirectoryFolderPaths(path: string) {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(path, entry.name));
  } catch {
    return [];
  }
}

async function buildPathAutocompleteFolderPaths(input: string) {
  const folderPaths = new Set<string>([
    '/Applications',
    '/System',
    '/System/Applications',
    HOME_PATH
  ]);

  const scopeContext = buildPathAutocompleteState(input, input.length, launcherSettingsCache.aliases, Array.from(folderPaths), HOME_PATH).context;
  if (!scopeContext?.rawReference || (!scopeContext.rawReference.startsWith('/') && scopeContext.rawReference !== '~' && !scopeContext.rawReference.startsWith('~/'))) {
    return Array.from(folderPaths);
  }

  const rawReference = scopeContext.rawReference;
  if (rawReference === '~') {
    return Array.from(folderPaths);
  }

  const expandedReference = expandHomePath(rawReference, HOME_PATH);
  const candidateParent = rawReference.endsWith('/')
    ? expandedReference
    : expandedReference.slice(0, expandedReference.lastIndexOf('/')) || '/';

  for (const entry of await readDirectoryFolderPaths(candidateParent)) {
    folderPaths.add(entry);
  }

  folderPaths.add(candidateParent);
  return Array.from(folderPaths);
}

function clearPendingLauncherPositionSave() {
  if (!pendingLauncherPositionSave) {
    return;
  }

  clearTimeout(pendingLauncherPositionSave);
  pendingLauncherPositionSave = null;
}

function persistLauncherPosition() {
  clearPendingLauncherPositionSave();

  const launcherPosition = launcherSettingsCache.launcherPosition;
  if (!launcherPosition) {
    return;
  }

  void saveLauncherSettings(launcherSettingsCache)
    .then((savedSettings) => {
      launcherSettingsCache = savedSettings;
    })
    .catch(() => {
      // Keep the latest in-memory position even if persistence fails.
    });
}

function scheduleLauncherPositionSave() {
  clearPendingLauncherPositionSave();
  pendingLauncherPositionSave = setTimeout(() => {
    persistLauncherPosition();
  }, LAUNCHER_POSITION_SAVE_DEBOUNCE_MS);
}

function nextRequestId(prefix: string) {
  mainRequestSequence += 1;
  return `${prefix}-${mainRequestSequence}`;
}

function iconCacheKey(path: string, size: 'normal' | 'large') {
  return `${size}:${path}`;
}

function finderIconPixelSize(size: 'normal' | 'large') {
  return size === 'large' ? 512 : 128;
}

function getFinderIconDataUrl(path: string, size: 'normal' | 'large') {
  return resolveFinderIconDataUrl(app.getPath('userData'), path, finderIconPixelSize(size));
}

async function getCachedPathIcon(path: string, size: 'normal' | 'large' = 'normal') {
  const cacheKey = iconCacheKey(path, size);
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey) ?? null;
  }

  if (!path.endsWith('.app')) {
    return null;
  }

  const cachedAppIcon = await resolveCachedAppIconDataUrl(path, app.getPath('userData'));
  if (cachedAppIcon) {
    iconCache.set(cacheKey, cachedAppIcon);
    return cachedAppIcon;
  }

  return null;
}

async function attachCachedIcons<T extends LocalSearchItem>(items: T[]) {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const iconUrl = await getCachedPathIcon(item.path);
      return iconUrl ? { ...item, iconUrl } : item;
    })
  );

  return enriched;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.max(1, Math.round(kb))} KB`;
  }

  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  }

  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

function runOpenCommand(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile('open', args, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function runCommandOutput(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile(command, args, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout.toString().trim());
    });
  });
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function openLauncherTarget(path: string) {
  const strategy = getLauncherOpenStrategy(path, platform);

  if (strategy.kind === 'open-app') {
    await runCommand(strategy.command, strategy.args);
    return;
  }

  await shell.openPath(path);
}

async function getPlistValue(plistPath: string, key: string) {
  return runCommandOutput('plutil', ['-extract', key, 'raw', '-o', '-', plistPath]).catch(() => '');
}

function mimeTypeForExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    case '.tif':
    case '.tiff':
      return 'image/tiff';
    case '.svg':
      return 'image/svg+xml';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function getImagePreview(path: string, requestId?: string) {
  return traceSpan(
    {
      subsystem: 'preview',
      event: 'image-preview',
      requestId,
      path,
      kind: 'image'
    },
    async () => {
      const imageBuffer = await readFile(path);
      return {
        mediaUrl: bufferToDataUrl(imageBuffer, mimeTypeForExtension(extname(path))),
        mediaKind: 'image' as const,
        mediaAlt: basename(path)
      };
    }
  );
}

async function getPdfPreview(path: string, requestId?: string) {
  return traceSpan(
    {
      subsystem: 'preview',
      event: 'pdf-preview',
      requestId,
      path,
      kind: 'pdf'
    },
    async () => {
      const previewCacheDir = join(app.getPath('userData'), 'preview-cache');
      const previewHash = createHash('sha1').update(path).digest('hex');
      const outputDir = join(previewCacheDir, previewHash);

      await mkdir(outputDir, { recursive: true });
      await runCommand('qlmanage', ['-t', '-s', '900', '-o', outputDir, path]);
      const generated = (await readdir(outputDir)).find((entry) => entry.endsWith('.png'));
      if (!generated) {
        return null;
      }

      const imageBuffer = await readFile(join(outputDir, generated));
      return {
        mediaUrl: bufferToDataUrl(imageBuffer, 'image/png'),
        mediaKind: 'document' as const,
        mediaAlt: basename(path)
      };
    }
  );
}

function positionLauncherWindow() {
  if (!mainWindow) {
    return;
  }

  if (launcherSettingsCache.launcherPosition) {
    mainWindow.setPosition(launcherSettingsCache.launcherPosition.x, launcherSettingsCache.launcherPosition.y);
    return;
  }

  mainWindow.center();
}

async function prewarmAppIcons() {
  const appScopes = Array.from(new Set([
    ...APP_ICON_PREWARM_ROOTS,
    ...launcherSettingsCache.scopes
      .filter((scope) => scope.enabled && /\/Applications$/i.test(scope.path))
      .map((scope) => scope.path)
  ]));

  const seen = new Set<string>();
  const appPaths: string[] = [];

  for (const scopePath of appScopes) {
    try {
      const entries = await readdir(scopePath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.endsWith('.app')) {
          continue;
        }

        const appPath = join(scopePath, entry.name);
        if (seen.has(appPath)) {
          continue;
        }

        seen.add(appPath);
        appPaths.push(appPath);

        if (appPaths.length >= APP_ICON_PREWARM_LIMIT) {
          break;
        }
      }
    } catch {
      // Ignore individual scope failures during icon warmup.
    }

    if (appPaths.length >= APP_ICON_PREWARM_LIMIT) {
      break;
    }
  }

  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: APP_ICON_PREWARM_CONCURRENCY }, async () => {
      while (nextIndex < appPaths.length) {
        const appPath = appPaths[nextIndex];
        nextIndex += 1;
        if (appPath) {
          await getPathIcon(appPath).catch(() => null);
        }
      }
    })
  );
}

async function showLauncher() {
  if (!mainWindow || !rendererReady) {
    pendingShow = true;
    return;
  }

  pendingShow = false;
  blurSuppressionDeadline = createBlurSuppressionDeadline(Date.now());
  applyLauncherLayoutMode(launcherLayoutMode);
  positionLauncherWindow();
  syncLauncherWindowLevel();
  if (platform === 'darwin') {
    app.focus({ steal: true });
  }
  mainWindow.moveTop();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.focus();
  mainWindow.webContents.send('launcher:visibility-changed', true);
}

function applyLauncherLayoutMode(mode: 'compact' | 'full') {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  launcherLayoutMode = mode;
  const [width, height] = mode === 'compact' ? [COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT] : [WINDOW_WIDTH, WINDOW_HEIGHT];
  const [currentWidth, currentHeight] = mainWindow.getContentSize();

  if (currentWidth !== width || currentHeight !== height) {
    mainWindow.setContentSize(width, height);
  }
}

function broadcastDevToolsPinnedChanged() {
  const windows = [mainWindow, settingsWindow].filter((candidate): candidate is BrowserWindow => Boolean(candidate && !candidate.isDestroyed()));
  for (const win of windows) {
    win.webContents.send('launcher:devtools-pinned-changed', launcherDevToolsPinned);
  }
}

function syncLauncherWindowLevel() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (launcherDevToolsPinned) {
    mainWindow.setAlwaysOnTop(false);
    return;
  }

  if (platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    return;
  }

  mainWindow.setAlwaysOnTop(true);
}

function setLauncherDevToolsPinned(nextPinned: boolean) {
  if (launcherDevToolsPinned === nextPinned) {
    return nextPinned;
  }

  launcherDevToolsPinned = nextPinned;
  syncLauncherWindowLevel();
  broadcastDevToolsPinnedChanged();
  return launcherDevToolsPinned;
}

function closeLauncherDevTools() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.webContents.isDevToolsOpened()) {
    return;
  }

  mainWindow.webContents.closeDevTools();
}

function openLauncherDevTools() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.webContents.isDevToolsOpened()) {
    return;
  }

  mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
}

async function toggleLauncherDevToolsPinned() {
  if (launcherDevToolsPinned) {
    setLauncherDevToolsPinned(false);
    closeLauncherDevTools();
    return false;
  }

  await createWindow();
  await showLauncher();
  setLauncherDevToolsPinned(true);
  openLauncherDevTools();
  return true;
}

function hideLauncher(force = false) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (launcherDevToolsPinned && !force) {
    return;
  }

  mainWindow.hide();
  mainWindow.webContents.send('launcher:visibility-changed', false);

  const hasVisibleSettingsWindow = Boolean(settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible());

  if (shouldHideLauncherApp(platform, hasVisibleSettingsWindow)) {
    app.hide();
  }
}

function loadRenderer(targetWindow: BrowserWindow, view: 'launcher' | 'settings') {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  if (rendererUrl) {
    void targetWindow.loadURL(`${rendererUrl}?view=${view}`);
    return;
  }

  void targetWindow.loadFile(join(__dirname, '../../out/renderer/index.html'), {
    search: `view=${view}`
  });
}

function attachRendererDiagnostics(targetWindow: BrowserWindow, label: 'launcher' | 'settings-window') {
  targetWindow.webContents.on('did-finish-load', () => {
    console.log(`[main] ${label} loaded`);
  });

  targetWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[main] ${label} failed: ${code} ${description} ${url}`);
  });

  targetWindow.webContents.on('render-process-gone', (_event, details) => {
    logFatalContext(`${label}-render-process-gone`, details);
  });

  targetWindow.webContents.on('console-message', (_event, level, message) => {
    if (
      IS_DEV_SESSION &&
      (message.includes('[vite] connecting') ||
        message.includes('[vite] connected') ||
        message.includes('[vite] server connection lost') ||
        message.includes('Download the React DevTools') ||
        message.includes('Electron Security Warning (Insecure Content-Security-Policy)'))
    ) {
      return;
    }

    const consoleMethod = level === 3 ? 'error' : level === 2 ? 'warn' : 'log';
    console[consoleMethod](`[${label}] ${message}`);
  });
}

async function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  launcherSettingsCache = getLauncherStateSnapshot().settings;
  rendererReady = false;

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    fullscreenable: false,
    skipTaskbar: true,
    hiddenInMissionControl: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  attachRendererDiagnostics(mainWindow, 'launcher');

  mainWindow.webContents.on('devtools-closed', () => {
    if (launcherDevToolsPinned) {
      setLauncherDevToolsPinned(false);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (pendingShow) {
      void showLauncher();
    }
  });

  mainWindow.on('closed', () => {
    clearPendingLauncherPositionSave();
    setLauncherDevToolsPinned(false);
    mainWindow = null;
    rendererReady = false;
    pendingShow = false;
  });

  if (platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  positionLauncherWindow();

  mainWindow.on('blur', () => {
    persistLauncherPosition();

    if (launcherDevToolsPinned) {
      return;
    }

    if (!mainWindow || !shouldHideLauncherOnBlur(mainWindow.isVisible(), Date.now(), blurSuppressionDeadline)) {
      return;
    }

    hideLauncher();
  });

  mainWindow.on('moved', () => {
    const bounds = mainWindow?.getBounds();
    if (!bounds) {
      return;
    }

    const previousPosition = launcherSettingsCache.launcherPosition;
    if (previousPosition?.x === bounds.x && previousPosition?.y === bounds.y) {
      return;
    }

    launcherSettingsCache = {
      ...launcherSettingsCache,
      launcherPosition: {
        x: bounds.x,
        y: bounds.y
      }
    };
    scheduleLauncherPositionSave();
  });

  loadRenderer(mainWindow, 'launcher');
  return mainWindow;
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: SETTINGS_WINDOW_WIDTH,
    height: SETTINGS_WINDOW_HEIGHT,
    useContentSize: true,
    show: false,
    resizable: true,
    minimizable: false,
    fullscreenable: false,
    title: 'Northlight Settings',
    backgroundColor: '#0b1117',
    titleBarStyle: platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

  attachRendererDiagnostics(settingsWindow, 'settings-window');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  loadRenderer(settingsWindow, 'settings');
  return settingsWindow;
}

async function getPathPreview(path: string, kind: LocalSearchItem['kind'], requestId?: string): Promise<LauncherPreview | null> {
  const previewKey = `${kind}:${path}`;
  if (kind !== 'app' && previewCache.has(previewKey)) {
    recordTrace({
      subsystem: 'preview',
      event: 'preview-cache-hit',
      requestId,
      path,
      kind,
      cacheState: 'hit'
    });
    return previewCache.get(previewKey) ?? null;
  }

  try {
    const startedAt = Date.now();
    recordTrace({
      subsystem: 'preview',
      event: 'preview-start',
      requestId,
      path,
      kind,
      cacheState: 'miss'
    });
    if (kind === 'folder') {
      const entries = await readdir(path, { withFileTypes: true });
      const folders = entries.filter((entry) => entry.isDirectory()).slice(0, 4).map((entry) => entry.name);
      const files = entries.filter((entry) => entry.isFile()).slice(0, 6).map((entry) => entry.name);
      const sample = [...folders, ...files].join('\n') || 'Empty folder';

      const preview = {
        title: basename(path),
        subtitle: path,
        body: sample,
        bodyMode: 'plain',
        sections: [
          { label: 'Type', value: 'Folder' },
          { label: 'Items', value: entries.length.toString() },
          { label: 'Folders', value: folders.length.toString() },
          { label: 'Files', value: files.length.toString() }
        ]
      };
      previewCache.set(previewKey, preview);
      recordTrace({
        subsystem: 'preview',
        event: 'preview-complete',
        requestId,
        path,
        kind,
        cacheState: 'miss',
        durationMs: Date.now() - startedAt
      });
      return preview;
    }

    if (kind === 'app') {
      const plistPath = join(path, 'Contents', 'Info.plist');
      const bundleId = await getPlistValue(plistPath, 'CFBundleIdentifier');
      const version =
        (await getPlistValue(plistPath, 'CFBundleShortVersionString')) || (await getPlistValue(plistPath, 'CFBundleVersion'));
      const media = await getPathIcon(path, requestId, 'large');

      const preview = {
        title: basename(path).replace(/\.app$/i, ''),
        subtitle: path,
        mediaUrl: media ?? undefined,
        mediaKind: media ? 'image' : undefined,
        mediaAlt: basename(path),
        sections: [
          { label: 'Type', value: 'Application' },
          { label: 'Bundle', value: basename(path) },
          ...(version ? [{ label: 'Version', value: version }] : []),
          ...(bundleId ? [{ label: 'Bundle ID', value: bundleId }] : [])
        ]
      };
      recordTrace({
        subsystem: 'preview',
        event: 'preview-complete',
        requestId,
        path,
        kind,
        cacheState: 'miss',
        durationMs: Date.now() - startedAt
      });
      return preview;
    }

    const extension = extname(path).toLowerCase();
    const preview = await buildFilePreview(path, {
      getImagePreview: (filePath) => getImagePreview(filePath, requestId),
      getPdfPreview: (filePath) => getPdfPreview(filePath, requestId),
      readTextPreview: (filePath, fileExtension) =>
        traceSpan(
          {
            subsystem: 'preview',
            event: 'text-preview-read',
            requestId,
            path: filePath,
            kind: fileExtension || 'text'
          },
          async () => readFileTextPreview(filePath, fileExtension)
        )
    });

    previewCache.set(previewKey, preview);
    recordTrace({
      subsystem: 'preview',
      event: 'preview-complete',
      requestId,
      path,
      kind,
      cacheState: 'miss',
      durationMs: Date.now() - startedAt
    });
    return preview;
  } catch {
    previewCache.set(previewKey, null);
    recordTrace({
      subsystem: 'preview',
      event: 'preview-complete',
      requestId,
      path,
      kind,
      cacheState: 'miss',
      outcome: 'error'
    });
    return null;
  }
}

function broadcastSettings(settings: LauncherSettings) {
  const windows = [mainWindow, settingsWindow].filter((candidate): candidate is BrowserWindow => Boolean(candidate && !candidate.isDestroyed()));
  for (const win of windows) {
    win.webContents.send('launcher:settings-changed', settings);
  }
}

function broadcastIndexChanged() {
  const windows = [mainWindow, settingsWindow].filter((candidate): candidate is BrowserWindow => Boolean(candidate && !candidate.isDestroyed()));
  for (const win of windows) {
    win.webContents.send('launcher:index-changed');
  }
}

function registerShortcuts() {
  void getLauncherSettings().then((settings) => {
    const requested = settings.launcherHotkey ?? '';
    const resolved = resolveLauncherShortcut(requested, app.isPackaged);
    const fallback = FALLBACK_LAUNCHER_SHORTCUT;
    let nextShortcut = resolved;

    if (!registerLauncherShortcut(resolved)) {
      nextShortcut = fallback;
      if (!registerLauncherShortcut(fallback)) {
        nextShortcut = '';
        console.warn(`[main] failed to register fallback launcher shortcut: ${fallback}`);
      }
    }

    console.log(`[main] launcher shortcut active: ${nextShortcut || 'disabled'}`);

    if (requested && nextShortcut !== requested) {
      void saveLauncherSettings({
        ...settings,
        launcherHotkey: nextShortcut
      }).then((nextSettings) => {
        broadcastSettings(nextSettings);
      });
    }
  });

  const devtoolsRegistered = globalShortcut.register(DEVTOOLS_SHORTCUT, () => {
    void toggleLauncherDevToolsPinned();
  });

  if (!devtoolsRegistered) {
    console.warn(`[main] failed to register devtools shortcut: ${DEVTOOLS_SHORTCUT}`);
  }
}

function registerLauncherShortcut(accelerator: string) {
  if (registeredLauncherShortcut) {
    globalShortcut.unregister(registeredLauncherShortcut);
    registeredLauncherShortcut = null;
  }

  const trimmed = accelerator.trim();
  if (!trimmed) {
    return true;
  }

  const registered = globalShortcut.register(trimmed, () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isVisible()) {
      hideLauncher();
      return;
    }

    void showLauncher();
  });

  if (!registered) {
    console.warn(`[main] failed to register global shortcut: ${trimmed}`);
    return false;
  }

  registeredLauncherShortcut = trimmed;
  return true;
}

function quickLookPath(path: string) {
  const child = spawn('qlmanage', ['-p', path], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

async function getPathIcon(path: string, requestId?: string, size: 'normal' | 'large' = 'normal') {
  const cacheKey = iconCacheKey(path, size);

  if (iconCache.has(cacheKey)) {
    recordTrace({
      subsystem: 'icon',
      event: 'icon-cache-hit',
      requestId,
      path,
      kind: size,
      cacheState: 'hit'
    });
    return iconCache.get(cacheKey) ?? null;
  }

  try {
    const startedAt = Date.now();
    recordTrace({
      subsystem: 'icon',
      event: 'icon-start',
      requestId,
      path,
      kind: size,
      cacheState: 'miss'
    });

    if (path.endsWith('.app')) {
      const resolvedAppIcon = await resolveAppIconDataUrl({
        appPath: path,
        userDataPath: app.getPath('userData'),
        getPlistValue,
        runCommand,
        // Native file icon APIs have been unstable on some macOS/Electron builds.
        // Keep runtime icon resolution deterministic and crash-safe.
        disableNativeFileIcon: true,
        getNativeFileIcon: async () => {
          throw new Error('native-file-icon-disabled');
        }
      });

      if (resolvedAppIcon.icon) {
        if (resolvedAppIcon.cacheable) {
          iconCache.set(cacheKey, resolvedAppIcon.icon);
        }

        recordTrace({
          subsystem: 'icon',
          event: 'icon-complete',
          requestId,
          path,
          kind: size,
          cacheState: 'miss',
          durationMs: Date.now() - startedAt,
          outcome: resolvedAppIcon.source
        });
        return resolvedAppIcon.icon;
      }
    }

    const finderIcon = await traceSpan(
      {
        subsystem: 'icon',
        event: 'finder-icon-helper',
        requestId,
        path,
        kind: size
      },
      async () => getFinderIconDataUrl(path, size)
    );

    if (finderIcon) {
      iconCache.set(cacheKey, finderIcon);
      recordTrace({
        subsystem: 'icon',
        event: 'icon-complete',
        requestId,
        path,
        kind: size,
        cacheState: 'miss',
        durationMs: Date.now() - startedAt,
        outcome: 'finder-icon-helper'
      });
      return finderIcon;
    }

    recordTrace({
      subsystem: 'icon',
      event: 'icon-complete',
      requestId,
      path,
      kind: size,
      cacheState: 'miss',
      durationMs: Date.now() - startedAt,
      outcome: 'missing'
    });
    return null;
  } catch {
    if (path.startsWith('/System/Library/ExtensionKit/Extensions/')) {
      return getPathIcon('/System/Applications/System Settings.app', requestId, size);
    }

    recordTrace({
      subsystem: 'icon',
      event: 'icon-complete',
      requestId,
      path,
      kind: size,
      cacheState: 'miss',
      outcome: 'error'
    });
    return null;
  }
}

if (!hasSingleInstanceLock) {
  console.error(`[main] ${APP_NAME} is already running in another process; quitting this duplicate instance.`);
  app.quit();
}

process.on('uncaughtException', (error) => {
  logFatalContext('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  logFatalContext('unhandledRejection', reason);
});

process.on('exit', (code) => {
  logFatalContext('process-exit', { code });
});

app.on('second-instance', () => {
  if (!app.isReady()) {
    return;
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    void createWindow().then(() => {
      showLauncher();
    });
    return;
  }

  void showLauncher();
});

app.on('render-process-gone', (_event, webContents, details) => {
  logFatalContext('render-process-gone', {
    details,
    url: webContents.getURL(),
    id: webContents.id
  });
});

app.on('child-process-gone', (_event, details) => {
  logFatalContext('child-process-gone', details);
});

app.whenReady().then(async () => {
  if (platform === 'darwin') {
    app.setActivationPolicy('accessory');
    app.dock?.hide();
  }

  await ensureLauncherState();
  launcherSettingsCache = getLauncherStateSnapshot().settings;
  startClipboardMonitor();
  void prewarmFinderIconHelper(app.getPath('userData')).catch(() => undefined);
  setIndexChangedListener(() => {
    broadcastIndexChanged();
  });
  void warmSearchIndex();
  void prewarmAppIcons().catch(() => undefined);
  void configureIndexWatchers();
  // Avoid startup crashes in IconServices by loading app icons on demand.
  await createWindow();
  registerShortcuts();

  ipcMain.handle('launcher:open-path', async (_event, path: string) => {
    mainWindow?.hide();
    await openLauncherTarget(path);
  });

  ipcMain.handle(
    'launcher:search-local-hot',
    async (_event, query: string, scopePath?: string | null, intent?: SearchIntent | null, requestId?: string) => {
      const traceRequestId = requestId || nextRequestId('search-hot');

      return traceSpan(
        {
          subsystem: 'ipc',
          event: 'search-local-hot',
          requestId: traceRequestId,
          query,
          scopePath,
          localFilter: intent?.localFilter
        },
        async () => attachCachedIcons(await searchHotPaths(query, scopePath, intent, { requestId: traceRequestId }))
      );
    }
  );
  ipcMain.handle(
    'launcher:search-local',
    async (_event, query: string, scopePath?: string | null, intent?: SearchIntent | null, requestId?: string) => {
      const traceRequestId = requestId || nextRequestId('search');

      return traceSpan(
        {
          subsystem: 'ipc',
          event: 'search-local',
          requestId: traceRequestId,
          query,
          scopePath,
          localFilter: intent?.localFilter
        },
        async () => attachCachedIcons(await searchIndexedPaths(query, scopePath, intent, { requestId: traceRequestId }))
      );
    }
  );
  ipcMain.handle('launcher:record-local-selection', async (_event, item: Pick<LocalSearchItem, 'path' | 'name' | 'kind'>) => {
    await recordLocalSelection(item);
  });

  ipcMain.handle('launcher:get-status', async (_event, requestId?: string) => {
    const traceRequestId = requestId || nextRequestId('status');
    const startedAt = Date.now();
    const status = getSearchStatus(packageJson.version);
    recordTrace({
      subsystem: 'status',
      event: 'get-status',
      requestId: traceRequestId,
      durationMs: Date.now() - startedAt,
      details: {
        ready: status.indexReady,
        refreshing: status.isRefreshing,
        restoring: status.isRestoring,
        count: status.indexEntryCount
      }
    });
    return status;
  });
  ipcMain.handle('launcher:get-settings', async () => getLauncherSettings());
  ipcMain.handle('launcher:get-path-autocomplete', async (_event, input: string, caret: number) => {
    const folderPaths = await buildPathAutocompleteFolderPaths(input.slice(0, Math.max(0, Math.min(caret, input.length))));
    return buildPathAutocompleteState(input, caret, launcherSettingsCache.aliases, folderPaths, HOME_PATH);
  });
  ipcMain.handle('launcher:get-search-performance', async () => getSearchPerformance());
  ipcMain.handle('launcher:record-search-performance', async (_event, sample) => {
    await recordSearchPerformanceSample(sample);
  });
  ipcMain.handle('launcher:get-scope-insights', async () => getScopeInsights());
  ipcMain.handle('launcher:get-effective-shortcut', async () => resolveLauncherShortcut(launcherSettingsCache.launcherHotkey, app.isPackaged));
  ipcMain.handle('launcher:get-devtools-pinned', async () => launcherDevToolsPinned);
  ipcMain.handle('launcher:toggle-devtools-pinned', async () => toggleLauncherDevToolsPinned());
  ipcMain.handle('launcher:get-trace-state', async () => getTraceState());
  ipcMain.handle('launcher:set-trace-enabled', async (_event, enabled: boolean) => setTraceEnabled(enabled));
  ipcMain.handle('launcher:trace-event', async (_event, event) => {
    ingestRendererTrace(event);
  });
  ipcMain.handle('launcher:get-trace-dump', async () => getTraceDump());
  ipcMain.handle('launcher:get-idle-trace-summary', async () => getIdleTraceSummary());
  ipcMain.handle('launcher:write-trace-dump', async () => writeTraceDumpFile());
  ipcMain.handle('launcher:save-settings', async (_event, settings: LauncherSettings) => {
    const currentSettings = launcherSettingsCache;
    const nextSettings = await saveLauncherSettings(settings);
    launcherSettingsCache = nextSettings;
    const currentRegisteredShortcut = resolveLauncherShortcut(currentSettings.launcherHotkey, app.isPackaged);
    const nextRegisteredShortcut = resolveLauncherShortcut(nextSettings.launcherHotkey, app.isPackaged);

    if (currentRegisteredShortcut !== nextRegisteredShortcut) {
      const fallback = currentRegisteredShortcut || FALLBACK_LAUNCHER_SHORTCUT;
      const registered = registerLauncherShortcut(nextRegisteredShortcut);

      if (!registered) {
        const recoveredSettings = await saveLauncherSettings({
          ...nextSettings,
          launcherHotkey: fallback
        });
        launcherSettingsCache = recoveredSettings;
        registerLauncherShortcut(recoveredSettings.launcherHotkey);
        broadcastSettings(recoveredSettings);
        requestSearchRefresh();
        return recoveredSettings;
      }
    }

    broadcastSettings(nextSettings);
    requestSearchRefresh();
    void configureIndexWatchers();
    return nextSettings;
  });
  ipcMain.handle('launcher:get-clipboard-history', async () => getClipboardHistory());
  ipcMain.handle('launcher:get-recent-items', async () => ({
    local: await attachCachedIcons(await getRecentLocalSelections(5)),
    clipboard: (await getClipboardHistory()).slice(0, 3)
  }));
  ipcMain.handle('launcher:set-layout-mode', async (_event, mode: 'compact' | 'full') => {
    applyLauncherLayoutMode(mode === 'compact' ? 'compact' : 'full');
  });
  ipcMain.handle('launcher:open-settings', async () => {
    openSettingsWindow();
  });
  ipcMain.handle('launcher:open-system-settings', async (_event, url: string) => {
    hideLauncher();
    try {
      await runOpenCommand([url]);
    } catch {
      await runOpenCommand(['/System/Applications/System Settings.app']);
    }
  });
  ipcMain.handle('launcher:get-path-preview', async (_event, path: string, kind: LocalSearchItem['kind'], requestId?: string) =>
    getPathPreview(path, kind, requestId || nextRequestId('preview'))
  );
  ipcMain.handle('launcher:get-path-icon', async (_event, path: string, requestId?: string) =>
    getPathIcon(path, requestId || nextRequestId('icon'))
  );
  ipcMain.handle('launcher:get-path-icons', async (_event, paths: string[], requestId?: string) => {
    const traceRequestId = requestId || nextRequestId('icons');
    return traceSpan(
      {
        subsystem: 'icon',
        event: 'icon-batch',
        requestId: traceRequestId,
        resultCount: paths.length
      },
      async () => {
        const settledIcons = await Promise.allSettled(
          paths.map(async (path) => [path, await getPathIcon(path, traceRequestId)] as const)
        );

        return Object.fromEntries(
          settledIcons.flatMap((entry) => (entry.status === 'fulfilled' ? [entry.value] : []))
        );
      }
    );
  });
  ipcMain.handle('launcher:quick-look-path', async (_event, path: string) => {
    hideLauncher();
    quickLookPath(path);
  });

  ipcMain.handle('launcher:reveal-path', async (_event, path: string) => {
    hideLauncher();
    await runOpenCommand(['-R', path]);
  });

  ipcMain.handle('launcher:open-in-terminal', async (_event, path: string) => {
    hideLauncher();
    await runOpenCommand(['-a', 'Terminal', path]);
  });

  ipcMain.handle('launcher:open-with-text-edit', async (_event, path: string) => {
    hideLauncher();
    await runOpenCommand(['-a', 'TextEdit', path]);
  });

  ipcMain.handle('launcher:hide', () => {
    hideLauncher();
  });

  ipcMain.handle('launcher:ready', async () => {
    rendererReady = true;
    if (pendingShow) {
      showLauncher();
    }
  });

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      void createWindow().then(() => {
        showLauncher();
      });
      return;
    }

    void showLauncher();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});
