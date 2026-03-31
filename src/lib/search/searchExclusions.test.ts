import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { isPrivateNorthlightPath } from './searchExclusions';

describe('Northlight private path exclusions', () => {
  it('recognizes the app userData root as private when home is indexed', () => {
    const userDataRoot = join(homedir(), 'Library', 'Application Support', 'Northlight');

    expect(isPrivateNorthlightPath(userDataRoot, userDataRoot)).toBe(true);
    expect(isPrivateNorthlightPath(join(userDataRoot, 'local-search-index.json'), userDataRoot)).toBe(true);
    expect(isPrivateNorthlightPath(join(userDataRoot, 'preview-cache', 'abc.png'), userDataRoot)).toBe(true);
    expect(isPrivateNorthlightPath(join(homedir(), 'Library', 'Preferences'), userDataRoot)).toBe(false);
  });
});
