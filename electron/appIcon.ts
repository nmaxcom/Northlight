import type { NativeImage } from 'electron';
import { access, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname, join } from 'node:path';

function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function nativeImageToDataUrl(image: NativeImage) {
  if (image.isEmpty()) {
    return null;
  }

  return bufferToDataUrl(image.toPNG(), 'image/png');
}

export type ResolveAppIconDeps = {
  appPath: string;
  userDataPath: string;
  getPlistValue: (plistPath: string, key: string) => Promise<string>;
  runCommand: (command: string, args: string[]) => Promise<void>;
  getNativeFileIcon: (path: string) => Promise<NativeImage>;
};

export type ResolvedAppIcon = {
  icon: string | null;
  cacheable: boolean;
  source: 'bundle-resource' | 'quicklook-thumbnail' | 'native-fallback' | 'missing';
};

async function renderBundleResourceIcon(appPath: string, plistPath: string, userDataPath: string, getPlistValue: ResolveAppIconDeps['getPlistValue'], runCommand: ResolveAppIconDeps['runCommand']) {
  const iconFile = await getPlistValue(plistPath, 'CFBundleIconFile').catch(() => '');
  if (!iconFile) {
    return null;
  }

  const normalizedIconName = extname(iconFile) ? iconFile : `${iconFile}.icns`;
  const bundleIconPath = join(appPath, 'Contents', 'Resources', normalizedIconName);
  await access(bundleIconPath);

  const iconCacheDir = join(userDataPath, 'icon-cache');
  const iconHash = createHash('sha1').update(bundleIconPath).digest('hex');
  const renderedIconPath = join(iconCacheDir, `${iconHash}.png`);

  await mkdir(iconCacheDir, { recursive: true });

  try {
    await access(renderedIconPath);
  } catch {
    await runCommand('sips', ['-s', 'format', 'png', bundleIconPath, '--out', renderedIconPath]);
  }

  const renderedIconBuffer = await readFile(renderedIconPath);
  if (renderedIconBuffer.length === 0) {
    return null;
  }

  return bufferToDataUrl(renderedIconBuffer, 'image/png');
}

async function renderQuickLookThumbnail(appPath: string, userDataPath: string, runCommand: ResolveAppIconDeps['runCommand']) {
  const appStats = await stat(appPath);
  const quickLookCacheDir = join(userDataPath, 'icon-cache', 'quicklook');
  const thumbnailHash = createHash('sha1').update(`${appPath}:${appStats.mtimeMs}`).digest('hex');
  const outputDir = join(quickLookCacheDir, thumbnailHash);

  await mkdir(outputDir, { recursive: true });

  let existingPng = (await readdir(outputDir)).find((entry) => entry.endsWith('.png'));
  if (!existingPng) {
    await runCommand('qlmanage', ['-t', '-s', '512', '-o', outputDir, appPath]);
    existingPng = (await readdir(outputDir)).find((entry) => entry.endsWith('.png'));
  }

  if (!existingPng) {
    return null;
  }

  const thumbnailBuffer = await readFile(join(outputDir, existingPng));
  if (thumbnailBuffer.length === 0) {
    return null;
  }

  return bufferToDataUrl(thumbnailBuffer, 'image/png');
}

export async function resolveAppIconDataUrl({
  appPath,
  userDataPath,
  getPlistValue,
  runCommand,
  getNativeFileIcon
}: ResolveAppIconDeps): Promise<ResolvedAppIcon> {
  const plistPath = join(appPath, 'Contents', 'Info.plist');

  try {
    const bundleResourceIcon = await renderBundleResourceIcon(appPath, plistPath, userDataPath, getPlistValue, runCommand);
    if (bundleResourceIcon) {
      return {
        icon: bundleResourceIcon,
        cacheable: true,
        source: 'bundle-resource'
      };
    }
  } catch {
    // Fall through to other icon strategies.
  }

  try {
    const thumbnailIcon = await renderQuickLookThumbnail(appPath, userDataPath, runCommand);
    if (thumbnailIcon) {
      return {
        icon: thumbnailIcon,
        cacheable: true,
        source: 'quicklook-thumbnail'
      };
    }
  } catch {
    // Fall through to native fallback.
  }

  try {
    const nativeIcon = nativeImageToDataUrl(await getNativeFileIcon(appPath));
    return {
      icon: nativeIcon,
      cacheable: false,
      source: nativeIcon ? 'native-fallback' : 'missing'
    };
  } catch {
    return {
      icon: null,
      cacheable: false,
      source: 'missing'
    };
  }
}

