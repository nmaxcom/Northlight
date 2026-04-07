import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const actualUserDataPath = join(process.env.HOME ?? '', 'Library', 'Application Support', 'Northlight');

async function copyIfPresent(filename: string, targetDir: string) {
  const sourcePath = join(actualUserDataPath, filename);
  const contents = await readFile(sourcePath, 'utf8');
  await writeFile(join(targetDir, filename), contents, 'utf8');
}

describe('main-process search integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('finds Calendar.app from the real persisted catalog snapshot for hot search', async () => {
    if (process.platform !== 'darwin') {
      return;
    }

    const tempUserData = await mkdtemp(join(tmpdir(), 'northlight-search-it-'));
    await copyIfPresent('launcher-state.json', tempUserData);
    await copyIfPresent('local-search-catalog.json', tempUserData);

    vi.doMock('electron', () => ({
      app: {
        getPath: (name: string) => {
          if (name === 'userData') {
            return tempUserData;
          }

          throw new Error(`Unexpected app.getPath(${name})`);
        }
      },
      clipboard: {
        readText: () => ''
      }
    }));

    const { searchHotPaths, searchIndexedPaths, getSearchStatus } = await import('./search');
    const results = await searchHotPaths('calendar');
    const scopedResults = await searchHotPaths('calendar', '/System/Applications');
    const deepResults = await searchIndexedPaths('calendar');

    expect(results.some((result) => result.path === '/System/Applications/Calendar.app')).toBe(true);
    expect(scopedResults.some((result) => result.path === '/System/Applications/Calendar.app')).toBe(true);
    expect(deepResults.some((result) => result.path === '/System/Applications/Calendar.app')).toBe(true);
    expect(getSearchStatus('0.0.0').indexReady).toBe(true);
    expect(getSearchStatus('0.0.0').indexEntryCount).toBeGreaterThan(0);
  });
});
