import { beforeEach, describe, expect, it } from 'vitest';
import { buildConversionResult, buildImmediateResults, buildResults } from './query';
import { launcherRuntime } from './runtime';

describe('buildResults', () => {
  beforeEach(() => {
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
});
