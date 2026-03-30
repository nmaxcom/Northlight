import type { LocalSearchItem } from './types';

function stripFileDecorations(value: string) {
  return value.replace(/\.app$/i, '').replace(/\.[^.]+$/i, '');
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
