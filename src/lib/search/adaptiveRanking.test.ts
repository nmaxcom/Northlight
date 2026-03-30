import { afterEach, describe, expect, it } from 'vitest';
import { adaptiveRankBoost, clearRankStore, loadRankStore, recordSelection } from './adaptiveRanking';

describe('adaptive ranking', () => {
  afterEach(() => {
    clearRankStore();
  });

  it('increases boost with repeated selections', () => {
    recordSelection('/tmp/a', 1000);
    const firstBoost = adaptiveRankBoost('/tmp/a', 1000);
    recordSelection('/tmp/a', 1000);
    const secondBoost = adaptiveRankBoost('/tmp/a', 1000);

    expect(secondBoost).toBeGreaterThan(firstBoost);
  });

  it('loads persisted store data', () => {
    recordSelection('/tmp/a', 1000);

    expect(loadRankStore()['/tmp/a']?.launches).toBe(1);
  });
});
