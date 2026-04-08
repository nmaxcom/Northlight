import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codePreviewExtensions, detectPlainTextEncoding, isProbablyPlainText, readFileTextPreview } from './previewText';

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

  it('treats utf-16le extensionless content as previewable text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-preview-text-'));
    const path = join(dir, 'journal');
    const body = 'northlight utf16 preview\nsecond line\n';
    await writeFile(path, Buffer.from(`\ufeff${body}`, 'utf16le'));

    await expect(readFileTextPreview(path, '')).resolves.toEqual({
      body,
      bodyMode: 'plain'
    });
    expect(detectPlainTextEncoding(Buffer.from(`\ufeff${body}`, 'utf16le'), '')).toBe('utf16le');
  });

  it('treats utf-16be uncommon-extension content as previewable text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-preview-text-'));
    const path = join(dir, 'notes.weird');
    const body = 'alpha\nbeta\ngamma\n';
    const utf16le = Buffer.from(`\ufeff${body}`, 'utf16le');
    const utf16be = Buffer.alloc(utf16le.length);
    for (let index = 0; index < utf16le.length; index += 2) {
      utf16be[index] = utf16le[index + 1];
      utf16be[index + 1] = utf16le[index];
    }
    await writeFile(path, utf16be);

    await expect(readFileTextPreview(path, '.weird')).resolves.toEqual({
      body,
      bodyMode: 'plain'
    });
    expect(detectPlainTextEncoding(utf16be, '.weird')).toBe('utf16be');
  });
});
