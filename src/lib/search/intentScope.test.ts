import { describe, expect, it } from 'vitest';
import { modifiedAtMatchesIntentTime, pathMatchesIntentScope, resolveIntentScopePath } from './intentScope';

const scopes = [
  { id: 'scope-0', path: '/Applications', enabled: true },
  { id: 'scope-1', path: '/Users/nm4/Documents', enabled: true }
];

describe('intentScope helpers', () => {
  it('resolves known scope tokens relative to the inferred home path', () => {
    expect(resolveIntentScopePath('library', scopes)).toBe('/Users/nm4/Library');
    expect(resolveIntentScopePath('home', scopes)).toBe('/Users/nm4');
  });

  it('matches a path against a resolved scope token', () => {
    expect(pathMatchesIntentScope('/Users/nm4/Library/Application Support/Google', 'library', scopes)).toBe(true);
    expect(pathMatchesIntentScope('/Users/nm4/Desktop/mockup.png', 'library', scopes)).toBe(false);
  });

  it('matches time tokens against modification timestamps', () => {
    const now = new Date('2026-04-01T16:00:00Z').getTime();
    expect(modifiedAtMatchesIntentTime(new Date('2026-04-01T12:00:00Z').getTime(), 'today', now)).toBe(true);
    expect(modifiedAtMatchesIntentTime(new Date('2026-03-31T12:00:00Z').getTime(), 'today', now)).toBe(false);
    expect(modifiedAtMatchesIntentTime(new Date('2026-03-31T12:00:00Z').getTime(), 'yesterday', now)).toBe(true);
    expect(modifiedAtMatchesIntentTime(new Date('2026-03-27T12:00:00Z').getTime(), 'recent', now)).toBe(true);
  });
});
