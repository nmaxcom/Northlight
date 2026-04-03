import { describe, expect, it } from 'vitest';
import { baseSearchScore, composedSearchScore } from './scoring';

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

  it('keeps direct app intent above noisy files under Applications', () => {
    const app = composedSearchScore(
      'text',
      {
        name: 'TextEdit.app',
        path: '/Applications/TextEdit.app',
        kind: 'app',
        score: 88
      },
      { appFirstEnabled: true }
    );

    const noisyFile = composedSearchScore(
      'text',
      {
        name: 'Text.tpl',
        path: '/Applications/Adobe Photoshop 2026/Presets/Tools/Text.tpl',
        kind: 'file',
        score: 132
      },
      { appFirstEnabled: true }
    );

    expect(app).toBeGreaterThan(noisyFile);
  });
});
