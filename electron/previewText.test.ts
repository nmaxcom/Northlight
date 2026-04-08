import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codePreviewExtensions, isProbablyPlainText, readFileTextPreview } from './previewText';

describe('preview text detection', () => {
  it('treats extensionless utf-8 content as previewable text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-preview-text-'));
    const path = join(dir, 'README');
    await writeFile(path, 'northlight preview body\nsecond line\n');

    await expect(readFileTextPreview(path, '')).resolves.toEqual({
      body: 'northlight preview body\nsecond line\n',
      bodyMode: 'plain'
    });
  });

  it('treats uncommon-extension utf-8 content as previewable text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-preview-text-'));
    const path = join(dir, 'notes.weird');
    await writeFile(path, 'config=true\nmode=sandbox\n');

    await expect(readFileTextPreview(path, '.weird')).resolves.toEqual({
      body: 'config=true\nmode=sandbox\n',
      bodyMode: 'plain'
    });
  });

  it('keeps known code extensions in code body mode', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-preview-text-'));
    const path = join(dir, 'config.ts');
    await writeFile(path, 'export const ready = true;\n');

    const preview = await readFileTextPreview(path, '.ts');
    expect(preview).toEqual({
      body: 'export const ready = true;\n',
      bodyMode: 'code'
    });
    expect(codePreviewExtensions.has('.ts')).toBe(true);
  });

  it('rejects buffers with embedded NUL bytes as binary', () => {
    expect(isProbablyPlainText(Buffer.from([0x41, 0x00, 0x42]), '')).toBe(false);
  });
});
