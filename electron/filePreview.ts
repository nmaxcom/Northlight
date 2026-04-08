import { basename, extname } from 'node:path';
import { stat } from 'node:fs/promises';
import type { LauncherPreview } from '../src/lib/search/types';
import { readFileTextPreview } from './previewText';

export type PreviewMedia = {
  mediaUrl?: string;
  mediaKind?: 'image' | 'document';
  mediaAlt?: string;
} | null;

export const imagePreviewExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.avif']);
export const pdfPreviewExtensions = new Set(['.pdf']);

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

type BuildFilePreviewOptions = {
  getImagePreview?: (path: string) => Promise<PreviewMedia>;
  getPdfPreview?: (path: string) => Promise<PreviewMedia>;
  readTextPreview?: (path: string, extension: string) => Promise<{ body: string; bodyMode: 'plain' | 'code' } | null>;
};

export async function buildFilePreview(path: string, options: BuildFilePreviewOptions = {}): Promise<LauncherPreview> {
  const info = await stat(path);
  const extension = extname(path).toLowerCase();
  const displayExtension = extension.replace(/^\./, '') || 'unknown';
  const sections = [
    { label: 'Type', value: displayExtension.toUpperCase() },
    { label: 'Size', value: formatBytes(info.size) },
    { label: 'Modified', value: formatDate(info.mtime) }
  ];

  if (imagePreviewExtensions.has(extension)) {
    const media = await (options.getImagePreview?.(path) ?? Promise.resolve(null));
    return {
      title: basename(path),
      subtitle: path,
      mediaUrl: media?.mediaUrl,
      mediaKind: media?.mediaKind,
      mediaAlt: media?.mediaAlt,
      sections
    };
  }

  if (pdfPreviewExtensions.has(extension)) {
    const media = await (options.getPdfPreview?.(path) ?? Promise.resolve(null));
    return {
      title: basename(path),
      subtitle: path,
      mediaUrl: media?.mediaUrl,
      mediaKind: media?.mediaKind,
      mediaAlt: media?.mediaAlt,
      sections
    };
  }

  const textPreview = await (options.readTextPreview?.(path, extension) ?? readFileTextPreview(path, extension));
  if (textPreview) {
    return {
      title: basename(path),
      subtitle: path,
      body: textPreview.body,
      bodyMode: textPreview.bodyMode,
      sections
    };
  }

  return {
    title: basename(path),
    subtitle: path,
    sections
  };
}
