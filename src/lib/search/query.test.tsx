import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildConversionResult, buildImmediateResults, buildResults } from './query';
import { launcherRuntime } from './runtime';

describe('buildResults', () => {
  beforeEach(() => {
    window.launcher = undefined;
    launcherRuntime.clearRankStore();
  });

  it('returns a deterministic conversion result', () => {
    const results = buildConversionResult('30mph to kmh');

    expect(results[0]?.kind).toBe('conversion');
    expect(results[0]?.title).toContain('48.28');
  });

  it('returns ranked file matches', async () => {
    const results = await buildResults('product');

    expect(results.some((result) => result.kind === 'file')).toBe(true);
  });

  it('returns no results for empty input', async () => {
    await expect(buildResults('   ')).resolves.toEqual([]);
  });

  it('keeps conversion results ahead of local results', async () => {
    const results = await buildResults('30mph to kmh');

    expect(results[0]?.kind).toBe('conversion');
  });

  it('returns conversion results immediately without waiting for local search', () => {
    const results = buildImmediateResults('30mph to kmh');

    expect(results[0]?.kind).toBe('conversion');
    expect(results[0]?.title).toContain('48.28');
  });

  it('returns no conversion result for unsupported units', () => {
    expect(buildConversionResult('20zz to kmh')).toEqual([]);
  });

  it('returns percentage calculations immediately', () => {
    const results = buildImmediateResults('15% of 240');

    expect(results[0]?.title).toContain('36');
  });

  it('returns fuzzy app matches for abbreviations', async () => {
    const results = await buildResults('btt');

    expect(results.some((result) => result.title === 'BetterTouchTool.app')).toBe(true);
  });

  it('promotes repeatedly chosen results above similar matches', async () => {
    launcherRuntime.recordSelection('/Applications/BetterTouchTool.app');
    launcherRuntime.recordSelection('/Applications/BetterTouchTool.app');

    const results = await buildResults('better');

    expect(results[0]?.title).toBe('BetterTouchTool.app');
  });

  it('shows folder quick actions on folder results', async () => {
    const results = await buildResults('steel');
    const folderResult = results.find((result) => result.title === 'steel-moodboard');

    expect(folderResult?.actions.some((action) => action.label === 'Open In Terminal')).toBe(true);
  });

  it('filters local results to folders when the query ends with a slash', async () => {
    const results = await buildResults('steel/');

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.kind === 'folder')).toBe(true);
  });

  it('filters local results to apps when a trailing app refiner is present', async () => {
    const results = await buildResults('better app');

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.kind === 'app')).toBe(true);
    expect(results.some((result) => result.title === 'BetterTouchTool.app')).toBe(true);
  });

  it('filters image queries to image files only and removes unrelated result classes', async () => {
    window.launcher = {
      searchLocal: vi.fn().mockResolvedValue([
        {
          id: '/Users/nm4/Pictures/snowboard.jpg',
          path: '/Users/nm4/Pictures/snowboard.jpg',
          name: 'snowboard.jpg',
          kind: 'file',
          score: 88
        },
        {
          id: '/Users/nm4/Pictures/snowboard.png',
          path: '/Users/nm4/Pictures/snowboard.png',
          name: 'snowboard.png',
          kind: 'file',
          score: 79
        },
        {
          id: '/Users/nm4/Documents/snowboard.pdf',
          path: '/Users/nm4/Documents/snowboard.pdf',
          name: 'snowboard.pdf',
          kind: 'file',
          score: 95
        },
        {
          id: '/Users/nm4/Documents/snowboard',
          path: '/Users/nm4/Documents/snowboard',
          name: 'snowboard',
          kind: 'folder',
          score: 102
        },
        {
          id: '/Applications/Snowboard.app',
          path: '/Applications/Snowboard.app',
          name: 'Snowboard.app',
          kind: 'app',
          score: 104
        }
      ]),
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    const results = await buildResults('snowboard img');

    expect(results.map((result) => result.title)).toEqual(['snowboard.jpg', 'snowboard.png']);
    expect(results.every((result) => result.kind === 'file')).toBe(true);
  });

  it('filters extension-specific queries to the requested extension family', async () => {
    window.launcher = {
      searchLocal: vi.fn().mockResolvedValue([
        {
          id: '/Users/nm4/Pictures/snowboard.jpg',
          path: '/Users/nm4/Pictures/snowboard.jpg',
          name: 'snowboard.jpg',
          kind: 'file',
          score: 90
        },
        {
          id: '/Users/nm4/Pictures/snowboard.jpeg',
          path: '/Users/nm4/Pictures/snowboard.jpeg',
          name: 'snowboard.jpeg',
          kind: 'file',
          score: 85
        },
        {
          id: '/Users/nm4/Pictures/snowboard.png',
          path: '/Users/nm4/Pictures/snowboard.png',
          name: 'snowboard.png',
          kind: 'file',
          score: 92
        }
      ]),
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    const results = await buildResults('snowboard jpg');

    expect(results.map((result) => result.title)).toEqual(['snowboard.jpeg', 'snowboard.jpg']);
    expect(results.every((result) => result.title.endsWith('.jpg') || result.title.endsWith('.jpeg'))).toBe(true);
  });

  it('treats conflicting trailing refiners as plain text instead of activating a broken filter', async () => {
    window.launcher = {
      searchLocal: vi.fn().mockResolvedValue([
        {
          id: '/Users/nm4/Documents/snowboard app jpg.md',
          path: '/Users/nm4/Documents/snowboard app jpg.md',
          name: 'snowboard app jpg.md',
          kind: 'file',
          score: 101
        }
      ]),
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    const results = await buildResults('snowboard app jpg');

    expect(results.some((result) => result.title === 'snowboard app jpg.md')).toBe(true);
  });

  it('does not steal standalone literal refiner words from the query', async () => {
    window.launcher = {
      searchLocal: vi.fn().mockResolvedValue([
        {
          id: '/Users/nm4/Documents/img-notes.md',
          path: '/Users/nm4/Documents/img-notes.md',
          name: 'img-notes.md',
          kind: 'file',
          score: 88
        }
      ]),
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    const results = await buildResults('img');

    expect(results.some((result) => result.title === 'img-notes.md')).toBe(true);
  });

  it('passes refiners into the local search call so refined queries can surface a different top set', async () => {
    const searchLocal = vi.fn().mockResolvedValue([
      {
        id: '/Users/nm4/Pictures/snowboard.jpg',
        path: '/Users/nm4/Pictures/snowboard.jpg',
        name: 'snowboard.jpg',
        kind: 'file',
        score: 84
      }
    ]);

    window.launcher = {
      searchLocal,
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    await buildResults('snowboard jpg');

    expect(searchLocal).toHaveBeenCalledWith('snowboard', undefined, {
      kind: 'file',
      extensions: ['jpg', 'jpeg']
    });
  });
});
