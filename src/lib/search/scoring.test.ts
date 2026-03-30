import { describe, expect, it } from 'vitest';
import { baseSearchScore } from './scoring';

describe('baseSearchScore', () => {
  it('matches app abbreviations', () => {
    const score = baseSearchScore('btt', {
      name: 'BetterTouchTool.app',
      path: '/Applications/BetterTouchTool.app',
      kind: 'app'
    });

    expect(score).toBeGreaterThan(0);
  });

  it('keeps exact matches above fuzzy matches', () => {
    const exact = baseSearchScore('fig', {
      name: 'fig',
      path: '/Users/nm4/Documents/fig',
      kind: 'file'
    });
    const fuzzy = baseSearchScore('fig', {
      name: 'Figma.app',
      path: '/Applications/Figma.app',
      kind: 'app'
    });

    expect(exact).toBeGreaterThan(fuzzy);
  });
});
