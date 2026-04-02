import type { LocalIntentFilter, LocalSearchItem, SearchIntent, SearchScopeToken, SearchTimeToken } from './types';

export type ParsedIntentQuery = {
  rawQuery: string;
  searchText: string;
  intent: SearchIntent | null;
  localFilter: LocalIntentFilter | null;
  matchedTokens: string[];
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'heic', 'heif'];
const TOKEN_FILTERS: Record<string, LocalIntentFilter> = {
  app: { kind: 'app' },
  apps: { kind: 'app' },
  file: { kind: 'file' },
  files: { kind: 'file' },
  folder: { kind: 'folder' },
  folders: { kind: 'folder' },
  dir: { kind: 'folder' },
  dirs: { kind: 'folder' },
  directory: { kind: 'folder' },
  directories: { kind: 'folder' },
  img: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  image: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  images: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  photo: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  photos: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  pic: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  pics: { kind: 'file', extensions: IMAGE_EXTENSIONS },
  jpg: { kind: 'file', extensions: ['jpg', 'jpeg'] },
  jpeg: { kind: 'file', extensions: ['jpg', 'jpeg'] },
  png: { kind: 'file', extensions: ['png'] },
  gif: { kind: 'file', extensions: ['gif'] },
  webp: { kind: 'file', extensions: ['webp'] },
  svg: { kind: 'file', extensions: ['svg'] },
  avif: { kind: 'file', extensions: ['avif'] },
  bmp: { kind: 'file', extensions: ['bmp'] },
  tif: { kind: 'file', extensions: ['tif', 'tiff'] },
  tiff: { kind: 'file', extensions: ['tif', 'tiff'] },
  heic: { kind: 'file', extensions: ['heic', 'heif'] },
  heif: { kind: 'file', extensions: ['heic', 'heif'] },
  pdf: { kind: 'file', extensions: ['pdf'] },
  md: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
  markdown: { kind: 'file', extensions: ['md', 'markdown', 'mdx'] },
  txt: { kind: 'file', extensions: ['txt'] },
  text: { kind: 'file', extensions: ['txt'] },
  json: { kind: 'file', extensions: ['json', 'jsonc'] },
  yaml: { kind: 'file', extensions: ['yaml', 'yml'] },
  yml: { kind: 'file', extensions: ['yaml', 'yml'] },
  toml: { kind: 'file', extensions: ['toml'] }
};
const SCOPE_TOKENS: Record<string, SearchScopeToken> = {
  'in:downloads': 'downloads',
  'in:documents': 'documents',
  'in:desktop': 'desktop',
  'in:library': 'library',
  'in:home': 'home'
};
const TIME_TOKENS: Record<string, SearchTimeToken> = {
  today: 'today',
  yesterday: 'yesterday',
  recent: 'recent'
};

function mergeIntentFilters(current: LocalIntentFilter | null, next: LocalIntentFilter) {
  if (!current) {
    return {
      kind: next.kind,
      extensions: next.extensions ? [...next.extensions] : undefined
    };
  }

  if (current.kind && next.kind && current.kind !== next.kind) {
    return null;
  }

  const kind = current.kind ?? next.kind;
  const currentExtensions = current.extensions ? new Set(current.extensions) : null;
  const nextExtensions = next.extensions ? new Set(next.extensions) : null;

  if (currentExtensions && nextExtensions) {
    const intersection = current.extensions!.filter((extension) => nextExtensions.has(extension));
    if (intersection.length === 0) {
      return null;
    }

    return {
      kind,
      extensions: intersection
    };
  }

  return {
    kind,
    extensions: current.extensions ? [...current.extensions] : next.extensions ? [...next.extensions] : undefined
  };
}

export function localIntentFilterKey(filter: LocalIntentFilter | null | undefined) {
  if (!filter) {
    return 'all';
  }

  const extensions = filter.extensions?.slice().sort().join(',') ?? '';
  return `${filter.kind ?? 'any'}::${extensions}`;
}

export function searchIntentKey(intent: SearchIntent | null | undefined) {
  if (!intent) {
    return 'all';
  }

  return [
    localIntentFilterKey(intent.localFilter),
    intent.scopeToken ?? 'any-scope',
    intent.scopePath?.toLowerCase() ?? 'any-path',
    intent.timeToken ?? 'any-time'
  ].join('::');
}

export function matchesLocalIntent(item: Pick<LocalSearchItem, 'kind' | 'path'>, filter: LocalIntentFilter | null | undefined) {
  if (!filter) {
    return true;
  }

  if (filter.kind && item.kind !== filter.kind) {
    return false;
  }

  if (!filter.extensions || filter.extensions.length === 0) {
    return true;
  }

  const extension = item.path.split('.').at(-1)?.toLowerCase() ?? '';
  return filter.extensions.includes(extension);
}

export function parseIntentQuery(query: string): ParsedIntentQuery {
  const rawQuery = query;
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      rawQuery,
      searchText: '',
      intent: null,
      localFilter: null,
      matchedTokens: []
    };
  }

  let working = trimmed;
  let localFilter: LocalIntentFilter | null = null;
  let scopeToken: SearchScopeToken | undefined;
  let scopePath: string | undefined;
  let timeToken: SearchTimeToken | undefined;
  const matchedTokens: string[] = [];

  if (working.endsWith('/') && !working.endsWith('//')) {
    const folderText = working.slice(0, -1).trim();
    if (folderText) {
      working = folderText;
      localFilter = { kind: 'folder' };
      matchedTokens.push('/');
    }
  }

  const tokens = working.split(/\s+/);
  while (tokens.length > 1) {
    const candidate = tokens.at(-1)?.toLowerCase();
    if (!candidate) {
      break;
    }

    const candidateScope = SCOPE_TOKENS[candidate];
    if (candidateScope) {
      if (scopeToken || scopePath) {
        return {
          rawQuery,
          searchText: trimmed,
          intent: null,
          localFilter: null,
          matchedTokens: []
        };
      }

      scopeToken = candidateScope;
      matchedTokens.unshift(tokens.pop()!);
      continue;
    }

    if (candidate.startsWith('in:') && candidate.length > 3) {
      const candidateScopePath = tokens.at(-1)!.slice(3);
      const looksLikePath = candidateScopePath.startsWith('/') || candidateScopePath.startsWith('~/');

      if (!looksLikePath || scopeToken || scopePath) {
        return {
          rawQuery,
          searchText: trimmed,
          intent: null,
          localFilter: null,
          matchedTokens: []
        };
      }

      scopePath = candidateScopePath;
      matchedTokens.unshift(tokens.pop()!);
      continue;
    }

    const candidateTime = TIME_TOKENS[candidate];
    if (candidateTime) {
      if (timeToken && timeToken !== candidateTime) {
        return {
          rawQuery,
          searchText: trimmed,
          intent: null,
          localFilter: null,
          matchedTokens: []
        };
      }

      timeToken = candidateTime;
      matchedTokens.unshift(tokens.pop()!);
      continue;
    }

    const candidateFilter = TOKEN_FILTERS[candidate];
    if (!candidateFilter) {
      break;
    }

    const merged = mergeIntentFilters(localFilter, candidateFilter);
    if (!merged) {
      return {
        rawQuery,
        searchText: trimmed,
        intent: null,
        localFilter: null,
        matchedTokens: []
      };
    }

    localFilter = merged;
    matchedTokens.unshift(tokens.pop()!);
  }

  const searchText = tokens.join(' ').trim();
  const intent = localFilter || scopeToken || scopePath || timeToken ? { localFilter, scopeToken, scopePath, timeToken, matchedTokens: [...matchedTokens] } : null;

  if (!searchText || !intent) {
    return {
      rawQuery,
      searchText: trimmed,
      intent: null,
      localFilter: null,
      matchedTokens: []
    };
  }

  return {
    rawQuery,
    searchText,
    intent,
    localFilter,
    matchedTokens
  };
}
