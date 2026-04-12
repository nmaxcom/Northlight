import { describe, expect, it } from 'vitest';
import { applyPathAutocompleteCandidate, buildFixtureFolderPaths, buildPathAutocompleteState, detectPathAutocompleteContext, pathAutocompleteSuffix } from './pathAutocomplete';
import type { AliasEntry } from './types';

const aliases: AliasEntry[] = [
  {
    id: 'alias-northlight',
    trigger: 'Northlight',
    targetType: 'path',
    target: '/Users/nm4/STUFF/Coding/Northlight',
    note: 'Northlight repo'
  }
];

const folderPaths = buildFixtureFolderPaths(
  [
    '/Users/nm4/STUFF/Coding/Northlight/docs/product-brief.md',
    '/Users/nm4/Documents/Brand/steel-moodboard/hero-reference.png'
  ],
  '/Users/nm4'
);

describe('pathAutocomplete helpers', () => {
  it('detects global path context for absolute paths', () => {
    expect(detectPathAutocompleteContext('/Users/nm4/ST')).toEqual({
      mode: 'path',
      replaceStart: 0,
      replaceEnd: 13,
      rawReference: '/Users/nm4/ST'
    });
  });

  it('detects scope context for in: aliases', () => {
    expect(detectPathAutocompleteContext('in:nor')).toEqual({
      mode: 'scope',
      replaceStart: 3,
      replaceEnd: 6,
      rawReference: 'nor'
    });
  });

  it('completes only the next folder segment', () => {
    const state = buildPathAutocompleteState('/Users/nm4/ST', '/Users/nm4/ST'.length, aliases, folderPaths, '/Users/nm4');
    const candidate = state.candidates[0];

    expect(candidate.replacementText).toBe('/Users/nm4/STUFF/');
    expect(applyPathAutocompleteCandidate('/Users/nm4/ST', state.context!, candidate)).toBe('/Users/nm4/STUFF/');
    expect(pathAutocompleteSuffix('/Users/nm4/ST', state.context, candidate)).toBe('UFF/');
  });

  it('surfaces aliases first inside in: contexts', () => {
    const state = buildPathAutocompleteState('in:nor', 'in:nor'.length, aliases, folderPaths, '/Users/nm4');

    expect(state.candidates[0]).toEqual(
      expect.objectContaining({
        kind: 'alias',
        label: 'Northlight',
        replacementText: 'Northlight'
      })
    );
    expect(state.resolvedFolderPath).toBeNull();
  });

  it('resolves concrete aliases and concrete folders to a folder path', () => {
    expect(buildPathAutocompleteState('in:Northlight', 'in:Northlight'.length, aliases, folderPaths, '/Users/nm4').resolvedFolderPath).toBe(
      '/Users/nm4/STUFF/Coding/Northlight'
    );
    expect(
      buildPathAutocompleteState('/Users/nm4/STUFF/Coding/Northlight/', '/Users/nm4/STUFF/Coding/Northlight/'.length, aliases, folderPaths, '/Users/nm4')
        .resolvedFolderPath
    ).toBe('/Users/nm4/STUFF/Coding/Northlight');
  });
});
