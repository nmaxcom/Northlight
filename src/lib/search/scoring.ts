import type { LocalSearchItem } from './types';

function stripFileDecorations(value: string) {
  const withoutApp = value.replace(/\.app$/i, '');
  const basename = withoutApp.split('/').at(-1) ?? withoutApp;
  const extensionStart = basename.lastIndexOf('.');

  if (extensionStart <= 0) {
    return withoutApp;
  }

  return withoutApp.slice(0, withoutApp.length - (basename.length - extensionStart));
}

function splitTokens(value: string) {
  return stripFileDecorations(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeSearchText(value: string) {
  return stripFileDecorations(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function basename(path: string) {
  const segments = path.split('/').filter(Boolean);
  return segments.at(-1) ?? path;
}

function pathDepth(path: string) {
  return path.split('/').filter(Boolean).length;
}

function buildAcronym(value: string) {
  return splitTokens(value)
    .map((token) => token[0] ?? '')
    .join('');
}

function isSubsequence(query: string, candidate: string) {
  let queryIndex = 0;

  for (let candidateIndex = 0; candidateIndex < candidate.length && queryIndex < query.length; candidateIndex += 1) {
    if (candidate[candidateIndex] === query[queryIndex]) {
      queryIndex += 1;
    }
  }

  return queryIndex === query.length;
}

function fuzzySubsequenceScore(query: string, candidate: string) {
  if (!isSubsequence(query, candidate)) {
    return 0;
  }

  const densityPenalty = Math.max(candidate.length - query.length, 0);
  return Math.max(52 - densityPenalty, 28);
}

export function baseSearchScore(query: string, item: Pick<LocalSearchItem, 'name' | 'path' | 'kind'>) {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (normalizedQuery.length < 2) {
    return 0;
  }

  const rawBaseName = basename(item.path);
  const normalizedBaseName = normalizeSearchText(rawBaseName);
  const normalizedPath = normalizeSearchText(item.path);
  const acronym = buildAcronym(rawBaseName);
  let score = 0;

  if (normalizedBaseName === normalizedQuery) {
    score = 150;
  } else if (normalizedBaseName.startsWith(normalizedQuery)) {
    score = 126;
  } else if (normalizedBaseName.includes(normalizedQuery)) {
    score = 104;
  } else if (acronym.startsWith(normalizedQuery)) {
    score = 92;
  } else {
    score = fuzzySubsequenceScore(normalizedQuery, normalizedBaseName);

    if (score === 0 && normalizedPath.includes(normalizedQuery)) {
      score = 74;
    }
  }

  if (score === 0) {
    return 0;
  }

  if (item.kind === 'app') {
    score += 10;
  }

  return score;
}

function providerCarryScore(score: number | null | undefined, hasDirectTextualMatch: boolean) {
  const normalized = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  const capped = Math.max(0, Math.min(normalized, hasDirectTextualMatch ? 28 : 72));
  return capped;
}

function bundleNoisePenalty(item: Pick<LocalSearchItem, 'path' | 'kind'>) {
  if (item.kind === 'app') {
    return 0;
  }

  const loweredPath = item.path.toLowerCase();

  if (loweredPath.includes('.app/contents/')) {
    return 36;
  }

  if (loweredPath.startsWith('/applications/') && pathDepth(loweredPath) > 2) {
    return 28;
  }

  if (
    loweredPath.includes('/library/application support/') ||
    loweredPath.includes('/library/containers/') ||
    loweredPath.includes('/library/group containers/')
  ) {
    return 18;
  }

  return 0;
}

function appIntentBonus(baseScore: number, item: Pick<LocalSearchItem, 'kind'>, appFirstEnabled: boolean) {
  if (item.kind !== 'app') {
    return 0;
  }

  let bonus = 0;

  if (baseScore >= 150) {
    bonus += 18;
  } else if (baseScore >= 126) {
    bonus += 14;
  } else if (baseScore >= 104) {
    bonus += 8;
  }

  if (appFirstEnabled) {
    bonus += 12;
  }

  return bonus;
}

export function composedSearchScore(
  query: string,
  item: Pick<LocalSearchItem, 'name' | 'path' | 'kind' | 'score'>,
  options: { appFirstEnabled?: boolean } = {}
) {
  const baseScore = baseSearchScore(query, item);
  const carryScore = providerCarryScore(item.score, baseScore > 0);

  if (baseScore === 0 && carryScore === 0) {
    return 0;
  }

  return Math.max(0, baseScore + carryScore + appIntentBonus(baseScore, item, options.appFirstEnabled ?? false) - bundleNoisePenalty(item));
}
