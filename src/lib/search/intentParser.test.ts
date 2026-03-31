import { describe, expect, it } from 'vitest';
import { localIntentFilterKey, matchesLocalIntent, parseIntentQuery } from './intentParser';

describe('parseIntentQuery', () => {
  it('parses a trailing folder slash into a folder filter', () => {
    expect(parseIntentQuery('project/')).toEqual({
      rawQuery: 'project/',
      searchText: 'project',
      localFilter: { kind: 'folder' },
      matchedTokens: ['/']
    });
  });

  it('parses trailing image refiners without requiring prefixes', () => {
    expect(parseIntentQuery('snowboard img')).toEqual({
      rawQuery: 'snowboard img',
      searchText: 'snowboard',
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'heic', 'heif'] },
      matchedTokens: ['img']
    });
  });

  it('narrows image filters when a concrete extension is added after them', () => {
    expect(parseIntentQuery('snowboard img jpg')).toEqual({
      rawQuery: 'snowboard img jpg',
      searchText: 'snowboard',
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] },
      matchedTokens: ['img', 'jpg']
    });
  });

  it('parses extension-only trailing refiners', () => {
    expect(parseIntentQuery('notes md')).toEqual({
      rawQuery: 'notes md',
      searchText: 'notes',
      localFilter: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
      matchedTokens: ['md']
    });
  });

  it('parses app refiners case-insensitively', () => {
    expect(parseIntentQuery('figma APP')).toEqual({
      rawQuery: 'figma APP',
      searchText: 'figma',
      localFilter: { kind: 'app' },
      matchedTokens: ['APP']
    });
  });

  it('ignores a candidate refiner when it is the whole query', () => {
    expect(parseIntentQuery('img')).toEqual({
      rawQuery: 'img',
      searchText: 'img',
      localFilter: null,
      matchedTokens: []
    });
  });

  it('ignores embedded refiner-like text', () => {
    expect(parseIntentQuery('img-tools')).toEqual({
      rawQuery: 'img-tools',
      searchText: 'img-tools',
      localFilter: null,
      matchedTokens: []
    });
  });

  it('ignores conflicting trailing refiners instead of partially applying them', () => {
    expect(parseIntentQuery('snowboard app jpg')).toEqual({
      rawQuery: 'snowboard app jpg',
      searchText: 'snowboard app jpg',
      localFilter: null,
      matchedTokens: []
    });
  });

  it('keeps safe whitespace normalization while preserving the raw query', () => {
    expect(parseIntentQuery('   snowboard    jpg   ')).toEqual({
      rawQuery: '   snowboard    jpg   ',
      searchText: 'snowboard',
      localFilter: { kind: 'file', extensions: ['jpg', 'jpeg'] },
      matchedTokens: ['jpg']
    });
  });

  it('does not treat a double trailing slash as a folder refiner', () => {
    expect(parseIntentQuery('project//')).toEqual({
      rawQuery: 'project//',
      searchText: 'project//',
      localFilter: null,
      matchedTokens: []
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
  });
});
