import type { ScopeEntry, SearchScopeToken, SearchTimeToken } from './types';

export const RECENT_TIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function inferHomePath(scopes: ScopeEntry[]) {
  const match = scopes
    .map((scope) => scope.path.match(/^\/Users\/[^/]+/))
    .find((candidate): candidate is RegExpMatchArray => Boolean(candidate));

  return match?.[0] ?? '/Users';
}

function normalizeScopePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function resolveIntentScopePath(scopeToken: SearchScopeToken | undefined, scopePath: string | undefined, scopes: ScopeEntry[]) {
  const homePath = inferHomePath(scopes);
  if (scopePath) {
    if (scopePath.startsWith('~/')) {
      return normalizeScopePath(`${homePath}/${scopePath.slice(2)}`);
    }

    return normalizeScopePath(scopePath);
  }

  if (!scopeToken) {
    return null;
  }

  switch (scopeToken) {
    case 'downloads':
      return normalizeScopePath(`${homePath}/Downloads`);
    case 'documents':
      return normalizeScopePath(`${homePath}/Documents`);
    case 'desktop':
      return normalizeScopePath(`${homePath}/Desktop`);
    case 'library':
      return normalizeScopePath(`${homePath}/Library`);
    case 'home':
      return normalizeScopePath(homePath);
    default:
      return null;
  }
}

export function pathMatchesIntentScope(path: string, scopeToken: SearchScopeToken | undefined, scopePath: string | undefined, scopes: ScopeEntry[]) {
  const resolvedScope = resolveIntentScopePath(scopeToken, scopePath, scopes);
  if (!resolvedScope) {
    return true;
  }

  return path === resolvedScope || path.startsWith(`${resolvedScope}/`);
}

export function modifiedAtMatchesIntentTime(modifiedAt: number | null | undefined, timeToken: SearchTimeToken | undefined, now = Date.now()) {
  if (!timeToken || modifiedAt === null || modifiedAt === undefined) {
    return true;
  }

  const current = new Date(now);
  const startOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - RECENT_TIME_WINDOW_MS;

  if (timeToken === 'today') {
    return modifiedAt >= startOfToday;
  }

  if (timeToken === 'yesterday') {
    return modifiedAt >= startOfYesterday && modifiedAt < startOfToday;
  }

  return modifiedAt >= sevenDaysAgo;
}
