import type { ScopeEntry, SearchScopeToken, SearchTimeToken } from './types';

function inferHomePath(scopes: ScopeEntry[]) {
  const match = scopes
    .map((scope) => scope.path.match(/^\/Users\/[^/]+/))
    .find((candidate): candidate is RegExpMatchArray => Boolean(candidate));

  return match?.[0] ?? '/Users';
}

export function resolveIntentScopePath(scopeToken: SearchScopeToken | undefined, scopes: ScopeEntry[]) {
  if (!scopeToken) {
    return null;
  }

  const homePath = inferHomePath(scopes);
  switch (scopeToken) {
    case 'downloads':
      return `${homePath}/Downloads`;
    case 'documents':
      return `${homePath}/Documents`;
    case 'desktop':
      return `${homePath}/Desktop`;
    case 'library':
      return `${homePath}/Library`;
    case 'home':
      return homePath;
    default:
      return null;
  }
}

export function pathMatchesIntentScope(path: string, scopeToken: SearchScopeToken | undefined, scopes: ScopeEntry[]) {
  const resolvedScope = resolveIntentScopePath(scopeToken, scopes);
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
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  if (timeToken === 'today') {
    return modifiedAt >= startOfToday;
  }

  if (timeToken === 'yesterday') {
    return modifiedAt >= startOfYesterday && modifiedAt < startOfToday;
  }

  return modifiedAt >= sevenDaysAgo;
}
