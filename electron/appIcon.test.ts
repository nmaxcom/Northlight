import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { resolveAppIconDataUrl } from './appIcon';

function fakeNativeImage(data = 'native-icon') {
  return {
    isEmpty: () => false,
    toPNG: () => Buffer.from(data, 'utf8')
  } as never;
}

describe('resolveAppIconDataUrl', () => {
  it('prefers an explicit bundle icon resource when CFBundleIconFile is present', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'northlight-app-icon-'));
    const appPath = join(tempDir, 'Sample.app');
    const resourcesDir = join(appPath, 'Contents', 'Resources');
    await mkdir(resourcesDir, { recursive: true });
    await writeFile(join(resourcesDir, 'SampleIcon.icns'), 'icon-bytes', 'utf8');
    const renderedPng = join(tempDir, 'icon-cache', 'd034ee39a48706a3aeadb4d84f84f80e06c4f357.png');

    const runCommand = vi.fn().mockImplementation(async (_command: string, args: string[]) => {
      const outIndex = args.indexOf('--out');
      await mkdir(join(tempDir, 'icon-cache'), { recursive: true });
      await writeFile(args[outIndex + 1]!, 'rendered-icon', 'utf8');
    });

    const result = await resolveAppIconDataUrl({
      appPath,
      userDataPath: tempDir,
      getPlistValue: vi.fn().mockImplementation(async (_plistPath, key) => (key === 'CFBundleIconFile' ? 'SampleIcon' : '')),
      runCommand,
      getNativeFileIcon: vi.fn().mockResolvedValue(fakeNativeImage('unused'))
    });

    expect(runCommand).toHaveBeenCalledWith('sips', expect.arrayContaining(['--out', expect.stringContaining('.png')]));
    expect(result.cacheable).toBe(true);
    expect(result.source).toBe('bundle-resource');
    expect(result.icon).toBeTruthy();
    expect(renderedPng).toContain('icon-cache');
  });

  it('falls back to a quick look thumbnail for asset-catalog apps like Calendar', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'northlight-app-icon-'));
    const appPath = join(tempDir, 'Calendar.app');
    await mkdir(join(appPath, 'Contents', 'Resources'), { recursive: true });

    const runCommand = vi.fn().mockImplementation(async (command: string, args: string[]) => {
      if (command !== 'qlmanage') {
        throw new Error('unexpected command');
      }

      const outputDir = args[args.indexOf('-o') + 1]!;
      await writeFile(join(outputDir, 'Calendar.png'), 'calendar-thumbnail', 'utf8');
    });

    const result = await resolveAppIconDataUrl({
      appPath,
      userDataPath: tempDir,
      getPlistValue: vi.fn().mockImplementation(async (_plistPath, key) => (key === 'CFBundleIconName' ? 'AppIcon' : '')),
      runCommand,
      getNativeFileIcon: vi.fn().mockResolvedValue(fakeNativeImage('unused'))
    });

    expect(runCommand).toHaveBeenCalledWith('qlmanage', expect.arrayContaining(['-t', '-s', '512', '-o', expect.any(String), appPath]));
    expect(result.cacheable).toBe(true);
    expect(result.source).toBe('quicklook-thumbnail');
    expect(result.icon).toBeTruthy();
  });

  it('does not cache native fallback icons when richer app icon sources fail', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'northlight-app-icon-'));
    const appPath = join(tempDir, 'Fallback.app');
    await mkdir(join(appPath, 'Contents'), { recursive: true });

    const result = await resolveAppIconDataUrl({
      appPath,
      userDataPath: tempDir,
      getPlistValue: vi.fn().mockResolvedValue(''),
      runCommand: vi.fn().mockRejectedValue(new Error('quicklook unavailable')),
      getNativeFileIcon: vi.fn().mockResolvedValue(fakeNativeImage('native-fallback'))
    });

    expect(result.cacheable).toBe(false);
    expect(result.source).toBe('native-fallback');
    expect(result.icon).toBeTruthy();
  });
});
