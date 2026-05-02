import { execFile } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

type ExecFileBufferResult = {
  stdout: Buffer;
  stderr: Buffer;
};

type FinderIconDeps = {
  runExecFile?: (command: string, args: string[]) => Promise<ExecFileBufferResult>;
};

const FINDER_ICON_HELPER_SOURCE = `
import AppKit
import Foundation
import QuickLookThumbnailing

guard CommandLine.arguments.count >= 3 else {
  fputs("usage: finder-icon <path> <size>\\n", stderr)
  exit(64)
}

let targetPath = CommandLine.arguments[1]
let sizeValue = Double(CommandLine.arguments[2]) ?? 256

func pngData(for image: NSImage, size: Double) -> Data? {
  image.size = NSSize(width: size, height: size)
  guard let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff) else {
    return nil
  }

  return bitmap.representation(using: .png, properties: [:])
}

func bundleAppIcon(path: String, size: Double) -> Data? {
  guard let bundle = Bundle(path: path) else {
    return nil
  }

  if let iconName = bundle.object(forInfoDictionaryKey: "CFBundleIconName") as? String,
     let assetImage = bundle.image(forResource: NSImage.Name(iconName)),
     let assetPng = pngData(for: assetImage, size: size) {
    return assetPng
  }

  if let iconFile = bundle.object(forInfoDictionaryKey: "CFBundleIconFile") as? String {
    let iconUrl: URL?
    if iconFile.contains(".") {
      let parts = iconFile.split(separator: ".", maxSplits: 1).map(String.init)
      iconUrl = bundle.url(forResource: parts.first, withExtension: parts.count > 1 ? parts[1] : nil)
    } else {
      iconUrl = bundle.url(forResource: iconFile, withExtension: "icns")
    }

    if let iconUrl, let image = NSImage(contentsOf: iconUrl), let iconPng = pngData(for: image, size: size) {
      return iconPng
    }
  }

  return nil
}

func quickLookAppIcon(path: String, size: Double) -> Data? {
  let semaphore = DispatchSemaphore(value: 0)
  let request = QLThumbnailGenerator.Request(
    fileAt: URL(fileURLWithPath: path),
    size: CGSize(width: size, height: size),
    scale: 2,
    representationTypes: .all
  )

  var output: Data? = nil
  QLThumbnailGenerator.shared.generateBestRepresentation(for: request) { thumbnail, _ in
    if let cgImage = thumbnail?.cgImage {
      let bitmap = NSBitmapImageRep(cgImage: cgImage)
      output = bitmap.representation(using: .png, properties: [:])
    }
    semaphore.signal()
  }

  _ = semaphore.wait(timeout: .now() + 10)
  return output
}

let png: Data?
if targetPath.hasSuffix(".app") {
  png =
    bundleAppIcon(path: targetPath, size: sizeValue) ??
    quickLookAppIcon(path: targetPath, size: sizeValue) ??
    pngData(for: NSWorkspace.shared.icon(forFile: targetPath), size: sizeValue)
} else {
  png = pngData(for: NSWorkspace.shared.icon(forFile: targetPath), size: sizeValue)
}

guard let png else {
  fputs("failed to render icon\\n", stderr)
  exit(65)
}

FileHandle.standardOutput.write(png)
`;

const HELPER_SOURCE_HASH = createHash('sha1').update(FINDER_ICON_HELPER_SOURCE).digest('hex');
const HELPER_DIRNAME = 'finder-icon-helper';
const HELPER_SOURCE_NAME = 'finder-icon.swift';
const HELPER_BINARY_NAME = 'finder-icon';
const HELPER_HASH_NAME = 'finder-icon.sha1';

let helperBuildPromise: Promise<string> | null = null;

function defaultExecFile(command: string, args: string[]) {
  return new Promise<ExecFileBufferResult>((resolve, reject) => {
    execFile(command, args, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 16 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        stdout: stdout as Buffer,
        stderr: stderr as Buffer
      });
    });
  });
}

async function ensureFinderIconHelper(userDataPath: string, deps: FinderIconDeps = {}) {
  const runExecFile = deps.runExecFile ?? defaultExecFile;
  const helperDir = join(userDataPath, HELPER_DIRNAME);
  const helperSourcePath = join(helperDir, HELPER_SOURCE_NAME);
  const helperBinaryPath = join(helperDir, HELPER_BINARY_NAME);
  const helperHashPath = join(helperDir, HELPER_HASH_NAME);

  if (!helperBuildPromise) {
    helperBuildPromise = (async () => {
      await mkdir(helperDir, { recursive: true });
      const moduleCachePath = join(helperDir, 'module-cache');
      await mkdir(moduleCachePath, { recursive: true });

      const [existingHash, helperBinaryExists] = await Promise.all([
        readFile(helperHashPath, 'utf8').catch(() => ''),
        access(helperBinaryPath).then(() => true).catch(() => false)
      ]);

      if (helperBinaryExists && existingHash.trim() === HELPER_SOURCE_HASH) {
        return helperBinaryPath;
      }

      await writeFile(helperSourcePath, FINDER_ICON_HELPER_SOURCE, 'utf8');
      await runExecFile('/usr/bin/xcrun', [
        'swiftc',
        helperSourcePath,
        '-o',
        helperBinaryPath,
        '-framework',
        'AppKit',
        '-module-cache-path',
        moduleCachePath
      ]);
      await writeFile(helperHashPath, HELPER_SOURCE_HASH, 'utf8');
      return helperBinaryPath;
    })().finally(() => {
      helperBuildPromise = null;
    });
  }

  return helperBuildPromise;
}

export async function prewarmFinderIconHelper(userDataPath: string, deps: FinderIconDeps = {}) {
  await ensureFinderIconHelper(userDataPath, deps);
}

export async function resolveFinderIconDataUrl(
  userDataPath: string,
  targetPath: string,
  pixelSize: number,
  deps: FinderIconDeps = {}
) {
  const runExecFile = deps.runExecFile ?? defaultExecFile;
  const helperBinaryPath = await ensureFinderIconHelper(userDataPath, { runExecFile });
  const { stdout } = await runExecFile(helperBinaryPath, [targetPath, String(pixelSize)]);

  if (!stdout || stdout.length === 0) {
    return null;
  }

  return `data:image/png;base64,${stdout.toString('base64')}`;
}
