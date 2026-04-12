import { describe, expect, it } from 'vitest';
import { localIntentFilterKey, matchesLocalIntent, parseIntentQuery, searchIntentKey } from './intentParser';

describe('parseIntentQuery', () => {
  it('parses a trailing folder slash into a folder filter', () => {
    expect(parseIntentQuery('project/')).toEqual({
      rawQuery: 'project/',
      searchText: 'project',
      intent: { localFilter: { kind: 'folder' }, matchedTokens: ['/'] },
      localFilter: { kind: 'folder' },
      matchedTokens: ['/']
    });
  });

  it('parses trailing image refiners without requiring prefixes', () => {
    expect(parseIntentQuery('snowboard img')).toEqual({
      rawQuery: 'snowboard img',
      searchText: 'snowboard',
      intent: {
        localFilter: { kind: 'file', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'heic', 'heif'] },
        matchedTokens: ['img']
      },
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'heic', 'heif'] },
      matchedTokens: ['img']
    });
  });

  it('narrows image filters when a concrete extension is added after them', () => {
    expect(parseIntentQuery('snowboard img .jpg')).toEqual({
      rawQuery: 'snowboard img .jpg',
      searchText: 'snowboard',
      intent: {
        localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] },
        matchedTokens: ['img', '.jpg']
      },
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] },
      matchedTokens: ['img', '.jpg']
    });
  });

  it('parses dot-extension trailing refiners', () => {
    expect(parseIntentQuery('notes .md')).toEqual({
      rawQuery: 'notes .md',
      searchText: 'notes',
      intent: { localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] }, matchedTokens: ['.md'] },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md']
    });
  });

  it('parses app refiners case-insensitively', () => {
    expect(parseIntentQuery('figma APP')).toEqual({
      rawQuery: 'figma APP',
      searchText: 'figma',
      intent: { localFilter: { kind: 'app' }, matchedTokens: ['APP'] },
      localFilter: { kind: 'app' },
      matchedTokens: ['APP']
    });
  });

  it('ignores a candidate refiner when it is the whole query', () => {
    expect(parseIntentQuery('img')).toEqual({
      rawQuery: 'img',
      searchText: 'img',
      intent: null,
      localFilter: null,
      matchedTokens: []
    });
  });

  it('ignores embedded refiner-like text', () => {
    expect(parseIntentQuery('img-tools')).toEqual({
      rawQuery: 'img-tools',
      searchText: 'img-tools',
      intent: null,
      localFilter: null,
      matchedTokens: []
    });
  });

  it('keeps bare extension words as literal search text', () => {
    expect(parseIntentQuery('invoice pdf')).toEqual({
      rawQuery: 'invoice pdf',
      searchText: 'invoice pdf',
      intent: null,
      localFilter: null,
      matchedTokens: []
    });
  });

  it('ignores conflicting trailing refiners instead of partially applying them', () => {
    expect(parseIntentQuery('snowboard app .jpg')).toEqual({
      rawQuery: 'snowboard app .jpg',
      searchText: 'snowboard app .jpg',
      intent: null,
      localFilter: null,
      matchedTokens: []
    });
  });

  it('keeps safe whitespace normalization while preserving the raw query', () => {
    expect(parseIntentQuery('   snowboard    .jpg   ')).toEqual({
      rawQuery: '   snowboard    .jpg   ',
      searchText: 'snowboard',
      intent: { localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] }, matchedTokens: ['.jpg'] },
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] },
      matchedTokens: ['.jpg']
    });
  });

  it('does not treat a double trailing slash as a folder refiner', () => {
    expect(parseIntentQuery('project//')).toEqual({
      rawQuery: 'project//',
      searchText: 'project//',
      intent: null,
      localFilter: null,
      matchedTokens: []
    });
  });

  it('parses scope and time refiners as structured intent', () => {
    expect(parseIntentQuery('config .json in:library today')).toEqual({
      rawQuery: 'config .json in:library today',
      searchText: 'config',
      intent: {
        localFilter: { kind: 'file', extensions: ['json', 'jsonc'] },
        scopeToken: 'library',
        scopePath: undefined,
        timeToken: 'today',
        matchedTokens: ['.json', 'in:library', 'today']
      },
      localFilter: { kind: 'file', extensions: ['json', 'jsonc'] },
      matchedTokens: ['.json', 'in:library', 'today']
    });
  });

  it('parses a concrete in:path refiner as a structured scope path', () => {
    expect(parseIntentQuery('northlight .md in:/Users/nm4/STUFF/Coding/Northlight')).toEqual({
      rawQuery: 'northlight .md in:/Users/nm4/STUFF/Coding/Northlight',
      searchText: 'northlight',
      intent: {
        localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
        scopeToken: undefined,
        scopePath: '/Users/nm4/STUFF/Coding/Northlight',
        timeToken: undefined,
        matchedTokens: ['.md', 'in:/Users/nm4/STUFF/Coding/Northlight']
      },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md', 'in:/Users/nm4/STUFF/Coding/Northlight']
    });
  });

  it('parses a concrete in:~/path refiner as a structured scope path', () => {
    expect(parseIntentQuery('notes .md in:~/Documents')).toEqual({
      rawQuery: 'notes .md in:~/Documents',
      searchText: 'notes',
      intent: {
        localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
        scopeToken: undefined,
        scopePath: '~/Documents',
        timeToken: undefined,
        matchedTokens: ['.md', 'in:~/Documents']
      },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md', 'in:~/Documents']
    });
  });

  it('parses a leading in: alias as a structured scope path candidate', () => {
    expect(parseIntentQuery('in:Northlight product .md')).toEqual({
      rawQuery: 'in:Northlight product .md',
      searchText: 'product',
      intent: {
        localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
        scopeToken: undefined,
        scopePath: 'Northlight',
        timeToken: undefined,
        matchedTokens: ['.md', 'in:Northlight']
      },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md', 'in:Northlight']
    });
  });

  it('parses a leading named scope token before the search text', () => {
    expect(parseIntentQuery('in:desktop notes today')).toEqual({
      rawQuery: 'in:desktop notes today',
      searchText: 'notes',
      intent: {
        localFilter: null,
        scopeToken: 'desktop',
        scopePath: undefined,
        timeToken: 'today',
        matchedTokens: ['today', 'in:desktop']
      },
      localFilter: null,
      matchedTokens: ['today', 'in:desktop']
    });
  });

  it('treats alias-like in: tokens as valid explicit scope references', () => {
    expect(parseIntentQuery('notes .md in:docs')).toEqual({
      rawQuery: 'notes .md in:docs',
      searchText: 'notes',
      intent: {
        localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
        scopeToken: undefined,
        scopePath: 'docs',
        timeToken: undefined,
        matchedTokens: ['.md', 'in:docs']
      },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md', 'in:docs']
    });
  });

  it('parses a concrete in:path refiner with spaces when it is the last trailing scope token', () => {
    expect(parseIntentQuery('northlight .md in:/Users/nm4/My Projects/Northlight')).toEqual({
      rawQuery: 'northlight .md in:/Users/nm4/My Projects/Northlight',
      searchText: 'northlight',
      intent: {
        localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
        scopeToken: undefined,
        scopePath: '/Users/nm4/My Projects/Northlight',
        timeToken: undefined,
        matchedTokens: ['.md', 'in:/Users/nm4/My Projects/Northlight']
      },
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['.md', 'in:/Users/nm4/My Projects/Northlight']
    });
  });
});

describe('local intent helpers', () => {
  it('matches file extensions and kinds together', () => {
    expect(matchesLocalIntent({ kind: 'file', path: '/tmp/snowboard.jpg' }, { kind: 'file', extensions: ['jpg', 'jpeg'] })).toBe(true);
    expect(matchesLocalIntent({ kind: 'file', path: '/tmp/snowboard.png' }, { kind: 'file', extensions: ['jpg', 'jpeg'] })).toBe(false);
    expect(matchesLocalIntent({ kind: 'folder', path: '/tmp/snowboard' }, { kind: 'folder' })).toBe(true);
    expect(matchesLocalIntent({ kind: 'app', path: '/Applications/Figma.app' }, { kind: 'folder' })).toBe(false);
  });

  it('produces stable cache keys for filters', () => {
    expect(localIntentFilterKey(null)).toBe('all');
    expect(localIntentFilterKey({ kind: 'file', extensions: ['png', 'jpg'] })).toBe('file::jpg,png');
    expect(
      searchIntentKey({
        localFilter: { kind: 'file', extensions: ['png'] },
        scopeToken: 'downloads',
        scopePath: undefined,
        timeToken: 'recent',
        matchedTokens: ['.png', 'in:downloads', 'recent']
      })
    ).toBe('file::png::downloads::any-path::recent');
    expect(
      searchIntentKey({
        localFilter: { kind: 'file', extensions: ['png'] },
        scopeToken: undefined,
        scopePath: '/Users/nm4/Desktop',
        timeToken: 'recent',
        matchedTokens: ['png', 'in:/Users/nm4/Desktop', 'recent']
      })
    ).toBe('file::png::any-scope::/users/nm4/desktop::recent');
  });
});
