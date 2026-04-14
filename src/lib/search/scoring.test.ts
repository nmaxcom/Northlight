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
        path: '/System/Applications/TextEdit.app',
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

  it('keeps exact system app matches above broad file noise', () => {
    const app = composedSearchScore(
      'textedit',
      {
        name: 'TextEdit.app',
        path: '/System/Applications/TextEdit.app',
        kind: 'app',
        score: 64
      },
      { appFirstEnabled: true }
    );

    const noisyFile = composedSearchScore(
      'textedit',
      {
        name: 'textedit-reference.md',
        path: '/Users/nm4/Documents/textedit-reference.md',
        kind: 'file',
        score: 120
      },
      { appFirstEnabled: true }
    );

    expect(app).toBeGreaterThan(noisyFile);
  });

  it('does not drop exact catalog-style hits when the incoming provider score is missing', () => {
    const app = composedSearchScore(
      'calendar',
      {
        name: 'Calendar.app',
        path: '/System/Applications/Calendar.app',
        kind: 'app',
        score: undefined
      },
      { appFirstEnabled: true }
    );

    expect(app).toBeGreaterThan(0);
  });

  it('keeps leading-dot filenames searchable as literal names', () => {
    const score = baseSearchScore('.env', {
      name: '.env',
      path: '/Users/nm4/STUFF/Coding/Northlight/.env',
      kind: 'file'
    });

    expect(score).toBeGreaterThan(0);
  });
});
