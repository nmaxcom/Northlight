import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildConversionResult, buildImmediateResults, buildResults } from './query';
import { launcherRuntime } from './runtime';

function installLocalSearchResults(results: Array<{ id: string; path: string; name: string; kind: 'file' | 'folder' | 'app'; score: number }>) {
  window.launcher = {
    searchLocal: vi.fn().mockResolvedValue(results),
    getClipboardHistory: vi.fn().mockResolvedValue([])
  } as never;
}

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

  it('returns no immediate results for empty input', () => {
    expect(buildImmediateResults('   ')).toEqual([]);
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

  it('returns built-in Apple apps from realistic /System/Applications paths in default search fixtures', async () => {
    const results = await buildResults('textedit');

    expect(results[0]?.title).toBe('TextEdit.app');
    expect(results[0]?.path).toBe('/System/Applications/TextEdit.app');
  });

  it('returns system settings commands for common launcher queries', async () => {
    const settings = await buildResults('settings');
    const keyboard = await buildResults('keyboard');
    const privacy = await buildResults('privacy');
    const display = await buildResults('display');
    const wifi = await buildResults('wifi');
    const prefs = await buildResults('prefs');

    expect(settings[0]?.title).toBe('Open System Settings');
    expect(settings[0]?.iconPath).toBe('/System/Applications/System Settings.app');
    expect(settings[0]?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(settings.some((result) => result.title === 'Open Northlight Settings')).toBe(true);
    expect(prefs.some((result) => result.title === 'Open Northlight Settings')).toBe(true);
    expect(keyboard[0]?.title).toBe('Open Keyboard Settings');
    expect(keyboard[0]?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/KeyboardSettings.appex');
    expect(keyboard[0]?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(privacy[0]?.title).toBe('Open Privacy & Security Settings');
    expect(privacy[0]?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/SecurityPrivacyExtension.appex');
    expect(privacy[0]?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(display[0]?.title).toBe('Open Display Settings');
    expect(wifi[0]?.title).toBe('Open Wi-Fi Settings');
    expect(wifi[0]?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/Wi-Fi.appex');
    expect(wifi[0]?.iconUrl).toMatch(/^data:image\/svg\+xml/);
  });

  it('supports broad macOS settings vocabulary beyond the basic examples', async () => {
    expect((await buildResults('system preferences'))[0]?.title).toBe('Open System Settings');
    expect((await buildResults('bluetooth'))[0]?.title).toBe('Open Bluetooth Settings');
    expect((await buildResults('sound'))[0]?.title).toBe('Open Sound Settings');
    expect((await buildResults('notifications'))[0]?.title).toBe('Open Notifications Settings');
    expect((await buildResults('wallpaper'))[0]?.title).toBe('Open Wallpaper Settings');
    expect((await buildResults('battery'))[0]?.title).toBe('Open Battery Settings');
    expect((await buildResults('spotlight'))[0]?.title).toBe('Open Spotlight Settings');
    expect((await buildResults('accessibility'))[0]?.title).toBe('Open Accessibility Settings');
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

  it('keeps direct app intent above noisy files inside app support paths', async () => {
    installLocalSearchResults([
      {
        id: '/Applications/Adobe Photoshop 2026/Presets/Tools/Text.tpl',
        path: '/Applications/Adobe Photoshop 2026/Presets/Tools/Text.tpl',
        name: 'Text.tpl',
        kind: 'file',
        score: 184
      },
      {
        id: '/Applications/Utilities/Adobe Creative Cloud/Components/CCX/preview/text.jsx',
        path: '/Applications/Utilities/Adobe Creative Cloud/Components/CCX/preview/text.jsx',
        name: 'text.jsx',
        kind: 'file',
        score: 176
      },
      {
        id: '/System/Applications/TextEdit.app',
        path: '/System/Applications/TextEdit.app',
        name: 'TextEdit.app',
        kind: 'app',
        score: 120
      }
    ]);

    const results = await buildResults('text');

    expect(results[0]?.title).toBe('TextEdit.app');
  });

  it('keeps common app queries ahead of similarly named files', async () => {
    installLocalSearchResults([
      {
        id: '/System/Applications/Preview.app',
        path: '/System/Applications/Preview.app',
        name: 'Preview.app',
        kind: 'app',
        score: 112
      },
      {
        id: '/Users/nm4/Design/preview.png',
        path: '/Users/nm4/Design/preview.png',
        name: 'preview.png',
        kind: 'file',
        score: 168
      },
      {
        id: '/System/Applications/Safari.app',
        path: '/System/Applications/Safari.app',
        name: 'Safari.app',
        kind: 'app',
        score: 104
      },
      {
        id: '/Users/nm4/STUFF/Coding/site/safari.css',
        path: '/Users/nm4/STUFF/Coding/site/safari.css',
        name: 'safari.css',
        kind: 'file',
        score: 162
      },
      {
        id: '/System/Applications/Notes.app',
        path: '/System/Applications/Notes.app',
        name: 'Notes.app',
        kind: 'app',
        score: 110
      },
      {
        id: '/Users/nm4/Documents/notes.md',
        path: '/Users/nm4/Documents/notes.md',
        name: 'notes.md',
        kind: 'file',
        score: 158
      }
    ]);

    expect((await buildResults('preview'))[0]?.title).toBe('Preview.app');
    expect((await buildResults('safari'))[0]?.title).toBe('Safari.app');
    expect((await buildResults('notes'))[0]?.title).toBe('Notes.app');
  });

  it('keeps direct app intent above noisy support files under Library containers', async () => {
    installLocalSearchResults([
      {
        id: '/Users/nm4/Library/Application Support/TextExpander/preview-text-template.txt',
        path: '/Users/nm4/Library/Application Support/TextExpander/preview-text-template.txt',
        name: 'preview-text-template.txt',
        kind: 'file',
        score: 176
      },
      {
        id: '/System/Applications/TextEdit.app',
        path: '/System/Applications/TextEdit.app',
        name: 'TextEdit.app',
        kind: 'app',
        score: 108
      }
    ]);

    const results = await buildResults('textedit');

    expect(results[0]?.title).toBe('TextEdit.app');
    expect(results[0]?.path).toBe('/System/Applications/TextEdit.app');
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

    const results = await buildResults('snowboard .jpg');

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

    const results = await buildResults('snowboard app .jpg');

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

  it('passes dot-extension refiners into the local search call so refined queries can surface a different top set', async () => {
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

    await buildResults('snowboard .jpg');

    expect(searchLocal).toHaveBeenCalledWith('snowboard', undefined, {
      localFilter: {
        kind: 'file',
        extensions: ['jpg', 'jpeg']
      },
      matchedTokens: ['.jpg']
    }, undefined);
  });

  it('passes scope and time refiners into the local search call as structured intent', async () => {
    const searchLocal = vi.fn().mockResolvedValue([]);

    window.launcher = {
      searchLocal,
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    await buildResults('config .json in:library today');

    expect(searchLocal).toHaveBeenCalledWith('config', undefined, {
      localFilter: {
        kind: 'file',
        extensions: ['json', 'jsonc']
      },
      scopeToken: 'library',
      scopePath: undefined,
      timeToken: 'today',
      matchedTokens: ['.json', 'in:library', 'today']
    }, undefined);
  });

  it('passes a concrete in:path refiner into local search as structured intent', async () => {
    const searchLocal = vi.fn().mockResolvedValue([]);

    window.launcher = {
      searchLocal,
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    await buildResults('northlight .md in:/Users/nm4/STUFF/Coding/Northlight');

    expect(searchLocal).toHaveBeenCalledWith('northlight', undefined, {
      localFilter: {
        kind: 'file',
        extensions: ['md', 'markdown', 'mdx']
      },
      scopeToken: undefined,
      scopePath: '/Users/nm4/STUFF/Coding/Northlight',
      timeToken: undefined,
      matchedTokens: ['.md', 'in:/Users/nm4/STUFF/Coding/Northlight']
    }, undefined);
  });

  it('passes a concrete in:path refiner with spaces into local search as structured intent', async () => {
    const searchLocal = vi.fn().mockResolvedValue([]);

    window.launcher = {
      searchLocal,
      getClipboardHistory: vi.fn().mockResolvedValue([])
    } as never;

    await buildResults('northlight .md in:/Users/nm4/My Projects/Northlight');

    expect(searchLocal).toHaveBeenCalledWith('northlight', undefined, {
      localFilter: {
        kind: 'file',
        extensions: ['md', 'markdown', 'mdx']
      },
      scopeToken: undefined,
      scopePath: '/Users/nm4/My Projects/Northlight',
      timeToken: undefined,
      matchedTokens: ['.md', 'in:/Users/nm4/My Projects/Northlight']
    }, undefined);
  });
});
