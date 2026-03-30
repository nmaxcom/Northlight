import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron';
import type { NativeImage } from 'electron';
import { execFile, spawn } from 'node:child_process';
import { access, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { platform } from 'node:process';
import packageJson from '../package.json';
import type { LauncherPreview, LauncherSettings, LocalSearchItem } from '../src/lib/search/types';
import { createBlurSuppressionDeadline, DEFAULT_LAUNCHER_SHORTCUT, resolveLauncherShortcut, shouldHideLauncherOnBlur } from '../src/lib/windowVisibility';
import { configureIndexWatchers, getSearchStatus, searchIndexedPaths, setIndexChangedListener, warmSearchIndex } from './search';
import {
  ensureLauncherState,
  getClipboardHistory,
  getLauncherStateSnapshot,
  getLauncherSettings,
  saveLauncherSettings,
  startClipboardMonitor
} from './settings';

const WINDOW_WIDTH = 1120;
const WINDOW_HEIGHT = 760;
const SETTINGS_WINDOW_WIDTH = 980;
const SETTINGS_WINDOW_HEIGHT = 760;

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let rendererReady = false;
let pendingShow = false;
let registeredLauncherShortcut: string | null = null;
let launcherSettingsCache = getLauncherStateSnapshot().settings;
let blurSuppressionDeadline = 0;
const iconCache = new Map<string, string | null>();
const previewCache = new Map<string, LauncherPreview | null>();
const textPreviewExtensions = new Set([
  '.txt', '.md', '.markdown', '.mdx', '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini', '.conf', '.env',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml',
  '.svg', '.sh', '.zsh', '.bash', '.py', '.rb', '.php', '.java', '.kt', '.swift', '.go', '.rs', '.c', '.cc',
  '.cpp', '.h', '.hpp', '.sql', '.graphql', '.gql', '.csv', '.log', '.plist'
]);
const imagePreviewExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.avif']);
const pdfPreviewExtensions = new Set(['.pdf']);

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

async function getImagePreview(path: string) {
  const imageBuffer = await readFile(path);
  return {
    mediaUrl: bufferToDataUrl(imageBuffer, mimeTypeForExtension(extname(path))),
    mediaKind: 'image' as const,
    mediaAlt: basename(path)
  };
}

async function getPdfPreview(path: string) {
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

function nativeImageToDataUrl(image: NativeImage) {
  if (image.isEmpty()) {
    return null;
  }

  return bufferToDataUrl(image.toPNG(), 'image/png');
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
  const appScopes = launcherSettingsCache.scopes
    .filter((scope) => scope.enabled && /\/Applications$/i.test(scope.path))
    .map((scope) => scope.path);

  const seen = new Set<string>();

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
        void getPathIcon(appPath);

        if (seen.size >= 48) {
          return;
        }
      }
    } catch {
      // Ignore individual scope failures during icon warmup.
    }
  }
}

function showLauncher() {
  if (!mainWindow || !rendererReady) {
    pendingShow = true;
    return;
  }

  pendingShow = false;
  blurSuppressionDeadline = createBlurSuppressionDeadline(Date.now());
  positionLauncherWindow();
  if (platform === 'darwin') {
    app.focus({ steal: true });
  }
  mainWindow.moveTop();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.focus();
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

async function createWindow() {
  launcherSettingsCache = getLauncherStateSnapshot().settings;

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
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

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[main] renderer loaded');
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[main] renderer failed: ${code} ${description} ${url}`);
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const label = level === 3 ? 'error' : level === 2 ? 'warn' : 'log';
    console[label](`[renderer] ${message}`);
  });

  mainWindow.once('ready-to-show', () => {
    if (pendingShow) {
      void showLauncher();
    }
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
    if (!mainWindow || !shouldHideLauncherOnBlur(mainWindow.isVisible(), Date.now(), blurSuppressionDeadline)) {
      return;
    }

    mainWindow.hide();
  });

  mainWindow.on('moved', () => {
    const bounds = mainWindow?.getBounds();
    if (!bounds) {
      return;
    }

    const nextSettings = {
      ...launcherSettingsCache,
      launcherPosition: {
        x: bounds.x,
        y: bounds.y
      }
    };
    launcherSettingsCache = nextSettings;

    void saveLauncherSettings(nextSettings)
      .then((savedSettings) => {
        launcherSettingsCache = savedSettings;
        broadcastSettings(savedSettings);
      })
      .catch(() => {
        // Keep last known in-memory position even if persistence fails.
      });
  });

  loadRenderer(mainWindow, 'launcher');
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

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  loadRenderer(settingsWindow, 'settings');
  return settingsWindow;
}

async function getPathPreview(path: string, kind: LocalSearchItem['kind']): Promise<LauncherPreview | null> {
  const previewKey = `${kind}:${path}`;
  if (previewCache.has(previewKey)) {
    return previewCache.get(previewKey) ?? null;
  }

  try {
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
      return preview;
    }

    if (kind === 'app') {
      const plistPath = join(path, 'Contents', 'Info.plist');
      const bundleId = await getPlistValue(plistPath, 'CFBundleIdentifier');
      const version =
        (await getPlistValue(plistPath, 'CFBundleShortVersionString')) || (await getPlistValue(plistPath, 'CFBundleVersion'));
      const media = await getPathIcon(path);

      const preview = {
        title: basename(path).replace(/\.app$/i, ''),
        subtitle: path,
        body: 'macOS application bundle',
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
      previewCache.set(previewKey, preview);
      return preview;
    }

    const info = await stat(path);
    const extension = extname(path).toLowerCase();
    const displayExtension = extension.replace(/^\./, '') || 'unknown';
    const sections = [
      { label: 'Type', value: displayExtension.toUpperCase() },
      { label: 'Size', value: formatBytes(info.size) },
      { label: 'Modified', value: formatDate(info.mtime) }
    ];

    if (imagePreviewExtensions.has(extension)) {
      const media = await getImagePreview(path);
      const preview = {
        title: basename(path),
        subtitle: path,
        mediaUrl: media?.mediaUrl,
        mediaKind: media?.mediaKind,
        mediaAlt: media?.mediaAlt,
        sections
      };
      previewCache.set(previewKey, preview);
      return preview;
    }

    if (pdfPreviewExtensions.has(extension)) {
      const media = await getPdfPreview(path);
      const preview = {
        title: basename(path),
        subtitle: path,
        mediaUrl: media?.mediaUrl,
        mediaKind: media?.mediaKind,
        mediaAlt: media?.mediaAlt,
        sections
      };
      previewCache.set(previewKey, preview);
      return preview;
    }

    if (textPreviewExtensions.has(extension)) {
      const body = (await readFile(path, 'utf8')).slice(0, 12000);
      const preview = {
        title: basename(path),
        subtitle: path,
        body,
        bodyMode: ['.json', '.yaml', '.yml', '.toml', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.xml', '.sql', '.sh', '.py', '.swift', '.go', '.rs'].includes(extension)
          ? 'code'
          : 'plain',
        sections
      };
      previewCache.set(previewKey, preview);
      return preview;
    }

    const preview = {
      title: basename(path),
      subtitle: path,
      sections
    };
    previewCache.set(previewKey, preview);
    return preview;
  } catch {
    previewCache.set(previewKey, null);
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
    const fallback = DEFAULT_LAUNCHER_SHORTCUT;
    const nextShortcut = registerLauncherShortcut(resolved) ? resolved : fallback;

    if (requested && nextShortcut !== requested) {
      void saveLauncherSettings({
        ...settings,
        launcherHotkey: nextShortcut
      }).then((nextSettings) => {
        broadcastSettings(nextSettings);
      });
    }
  });
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
      mainWindow.hide();
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

async function getPathIcon(path: string) {
  if (iconCache.has(path)) {
    return iconCache.get(path) ?? null;
  }

  try {
    if (path.endsWith('.app')) {
      const plistPath = join(path, 'Contents', 'Info.plist');
      const iconName = await runCommandOutput('plutil', ['-extract', 'CFBundleIconFile', 'raw', '-o', '-', plistPath]).catch(() => '');

      if (iconName) {
        const normalizedIconName = extname(iconName) ? iconName : `${iconName}.icns`;
        const bundleIconPath = join(path, 'Contents', 'Resources', normalizedIconName);
        await access(bundleIconPath);
        const iconCacheDir = join(app.getPath('userData'), 'icon-cache');
        const iconHash = createHash('sha1').update(bundleIconPath).digest('hex');
        const renderedIconPath = join(iconCacheDir, `${iconHash}.png`);

        await mkdir(iconCacheDir, { recursive: true });

        try {
          await access(renderedIconPath);
        } catch {
          await runCommand('sips', ['-s', 'format', 'png', bundleIconPath, '--out', renderedIconPath]);
        }

        const renderedIconBuffer = await readFile(renderedIconPath);
        if (renderedIconBuffer.length > 0) {
          const icon = bufferToDataUrl(renderedIconBuffer, 'image/png');
          iconCache.set(path, icon);
          return icon;
        }
      }
    }

    const image = await app.getFileIcon(path, { size: 'normal' });
    const icon = nativeImageToDataUrl(image);
    iconCache.set(path, icon);
    return icon;
  } catch {
    iconCache.set(path, null);
    return null;
  }
}

app.whenReady().then(async () => {
  app.setName(packageJson.productName ?? 'Northlight');

  if (platform === 'darwin') {
    app.setActivationPolicy('accessory');
    app.dock?.hide();
  }

  await ensureLauncherState();
  launcherSettingsCache = getLauncherStateSnapshot().settings;
  startClipboardMonitor();
  setIndexChangedListener(() => {
    broadcastIndexChanged();
  });
  void warmSearchIndex();
  void configureIndexWatchers();
  void prewarmAppIcons();
  await createWindow();
  registerShortcuts();

  ipcMain.handle('launcher:open-path', async (_event, path: string) => {
    mainWindow?.hide();
    await shell.openPath(path);
  });

  ipcMain.handle('launcher:search-local', async (_event, query: string, scopePath?: string | null) =>
    searchIndexedPaths(query, scopePath)
  );

  ipcMain.handle('launcher:get-status', async () => getSearchStatus(packageJson.version));
  ipcMain.handle('launcher:get-settings', async () => getLauncherSettings());
  ipcMain.handle('launcher:save-settings', async (_event, settings: LauncherSettings) => {
    const currentSettings = launcherSettingsCache;
    const nextSettings = await saveLauncherSettings(settings);
    launcherSettingsCache = nextSettings;
    const currentRegisteredShortcut = resolveLauncherShortcut(currentSettings.launcherHotkey, app.isPackaged);
    const nextRegisteredShortcut = resolveLauncherShortcut(nextSettings.launcherHotkey, app.isPackaged);

    if (currentRegisteredShortcut !== nextRegisteredShortcut) {
      const fallback = currentRegisteredShortcut || DEFAULT_LAUNCHER_SHORTCUT;
      const registered = registerLauncherShortcut(nextRegisteredShortcut);

      if (!registered) {
        const recoveredSettings = await saveLauncherSettings({
          ...nextSettings,
          launcherHotkey: fallback
        });
        launcherSettingsCache = recoveredSettings;
        registerLauncherShortcut(recoveredSettings.launcherHotkey);
        broadcastSettings(recoveredSettings);
        void warmSearchIndex();
        return recoveredSettings;
      }
    }

    broadcastSettings(nextSettings);
    void warmSearchIndex();
    void configureIndexWatchers();
    return nextSettings;
  });
  ipcMain.handle('launcher:get-clipboard-history', async () => getClipboardHistory());
  ipcMain.handle('launcher:open-settings', async () => {
    openSettingsWindow();
  });
  ipcMain.handle('launcher:get-path-preview', async (_event, path: string, kind: LocalSearchItem['kind']) =>
    getPathPreview(path, kind)
  );
  ipcMain.handle('launcher:get-path-icon', async (_event, path: string) => getPathIcon(path));
  ipcMain.handle('launcher:get-path-icons', async (_event, paths: string[]) =>
    Object.fromEntries(await Promise.all(paths.map(async (path) => [path, await getPathIcon(path)] as const)))
  );
  ipcMain.handle('launcher:quick-look-path', async (_event, path: string) => {
    mainWindow?.hide();
    quickLookPath(path);
  });

  ipcMain.handle('launcher:reveal-path', async (_event, path: string) => {
    mainWindow?.hide();
    await runOpenCommand(['-R', path]);
  });

  ipcMain.handle('launcher:open-in-terminal', async (_event, path: string) => {
    mainWindow?.hide();
    await runOpenCommand(['-a', 'Terminal', path]);
  });

  ipcMain.handle('launcher:open-with-text-edit', async (_event, path: string) => {
    mainWindow?.hide();
    await runOpenCommand(['-a', 'TextEdit', path]);
  });

  ipcMain.handle('launcher:trash-path', async (_event, path: string) => {
    mainWindow?.hide();
    await shell.trashItem(path);
  });

  ipcMain.handle('launcher:hide', () => {
    mainWindow?.hide();
  });

  ipcMain.handle('launcher:ready', async () => {
    rendererReady = true;
    if (pendingShow) {
      showLauncher();
    }

    void warmSearchIndex();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
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
