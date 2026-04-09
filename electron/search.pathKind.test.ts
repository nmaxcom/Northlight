import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePathKind } from './search';

describe('search path kind resolution', () => {
  it('classifies an extensionless file as file using the real filesystem', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-kind-'));
    const path = join(dir, 'log');
    await writeFile(path, 'watchman log\n', 'utf8');

    await expect(resolvePathKind(path, 'folder')).resolves.toBe('file');
  });

  it('classifies an extensionless directory as folder using the real filesystem', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'northlight-kind-'));
    const path = join(dir, 'log');
    await mkdir(path);

    await expect(resolvePathKind(path, 'file')).resolves.toBe('folder');
  });

  it('keeps app bundles as app', async () => {
    await expect(resolvePathKind('/Applications/Preview.app', 'folder')).resolves.toBe('app');
  });
});
