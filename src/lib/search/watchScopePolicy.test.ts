import { describe, expect, it } from 'vitest';
import { isWatchableScope } from './watchScopePolicy';

describe('watch scope policy', () => {
  it('disables recursive watching for high-churn broad scopes', () => {
    const home = '/Users/nm4';

    expect(isWatchableScope('/', home)).toBe(false);
    expect(isWatchableScope('/Users/nm4', home)).toBe(false);
    expect(isWatchableScope('/Users/nm4/Library', home)).toBe(false);
  });

  it('keeps narrower work scopes watchable', () => {
    const home = '/Users/nm4';

    expect(isWatchableScope('/Applications', home)).toBe(true);
    expect(isWatchableScope('/Users/nm4/Documents', home)).toBe(true);
    expect(isWatchableScope('/Users/nm4/Projects', home)).toBe(true);
    expect(isWatchableScope('/Users/nm4/Library/Application Support/Google', home)).toBe(true);
  });
});
