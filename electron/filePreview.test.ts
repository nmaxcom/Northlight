import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { buildFilePreview } from './filePreview';

describe('file preview integration', () => {
  it('shows body text for an extensionless utf-8 file through the file preview path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-file-preview-'));
    const path = join(dir, 'log');
    await writeFile(path, 'line one\nline two\n', 'utf8');

    const preview = await buildFilePreview(path);
    expect(preview.body).toBe('line one\nline two\n');
    expect(preview.bodyMode).toBe('plain');
    expect(preview.sections[0]).toEqual({ label: 'Type', value: 'UNKNOWN' });
  });

  it('shows body text for an uncommon-extension utf-16 file through the file preview path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-file-preview-'));
    const path = join(dir, 'capture.weird');
    const body = 'northlight\npreview\nutf16\n';
    await writeFile(path, Buffer.from(`\ufeff${body}`, 'utf16le'));

    const preview = await buildFilePreview(path);
    expect(preview.body).toBe(body);
    expect(preview.bodyMode).toBe('plain');
    expect(preview.sections[0]).toEqual({ label: 'Type', value: 'WEIRD' });
  });

  it('does not show body text for binary files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-file-preview-'));
    const path = join(dir, 'blob');
    await writeFile(path, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x10]));

    const preview = await buildFilePreview(path);
    expect(preview.body).toBeUndefined();
    expect(preview.sections[0]).toEqual({ label: 'Type', value: 'UNKNOWN' });
  });

  it('keeps image previews on the image path instead of falling back to text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-file-preview-'));
    const path = join(dir, 'fake.png');
    await writeFile(path, 'not real image bytes but should stay on image branch', 'utf8');
    const getImagePreview = vi.fn().mockResolvedValue({
      mediaUrl: 'data:image/png;base64,abc',
      mediaKind: 'image',
      mediaAlt: 'fake.png'
    });

    const preview = await buildFilePreview(path, { getImagePreview });
    expect(getImagePreview).toHaveBeenCalledWith(path);
    expect(preview.mediaUrl).toBe('data:image/png;base64,abc');
    expect(preview.body).toBeUndefined();
  });

  it('keeps pdf previews on the pdf path instead of falling back to text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-file-preview-'));
    const path = join(dir, 'notes.pdf');
    await writeFile(path, 'fake pdf bytes', 'utf8');
    const getPdfPreview = vi.fn().mockResolvedValue({
      mediaUrl: 'data:image/png;base64,pdf',
      mediaKind: 'document',
      mediaAlt: 'notes.pdf'
    });

    const preview = await buildFilePreview(path, { getPdfPreview });
    expect(getPdfPreview).toHaveBeenCalledWith(path);
    expect(preview.mediaUrl).toBe('data:image/png;base64,pdf');
    expect(preview.body).toBeUndefined();
  });
});
