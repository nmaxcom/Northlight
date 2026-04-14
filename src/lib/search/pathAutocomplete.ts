import type { AliasEntry, PathAutocompleteCandidate, PathAutocompleteContext, PathAutocompleteState } from './types';

type FolderCandidateInput = {
  name: string;
  resolvedPath: string;
  replacementText: string;
  subtitle: string;
};

function hasPathPrefix(value: string) {
  return value.startsWith('/') || value === '~' || value.startsWith('~/');
}

function normalizePath(path: string) {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function joinPath(left: string, right: string) {
  return normalizePath(`${left.replace(/\/$/, '')}/${right.replace(/^\/+/, '')}`);
}

function dirnamePath(path: string) {
  const normalized = normalizePath(path);
  if (normalized === '/') {
    return '/';
  }

  const parts = normalized.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}` : '/';
}

export function detectPathAutocompleteContext(input: string, caret = input.length): PathAutocompleteContext | null {
  const boundedCaret = Math.max(0, Math.min(caret, input.length));
  const beforeCaret = input.slice(0, boundedCaret);

  for (let index = beforeCaret.length - 1; index >= 0; index -= 1) {
    if (beforeCaret.slice(index, index + 3).toLowerCase() !== 'in:') {
      continue;
    }

    if (index > 0 && !/\s/.test(beforeCaret[index - 1])) {
      continue;
    }

    const rawReference = beforeCaret.slice(index + 3);
    if (!rawReference) {
      return {
        mode: 'scope',
        replaceStart: index + 3,
        replaceEnd: boundedCaret,
        rawReference
      };
    }

    if (hasPathPrefix(rawReference) || !rawReference.includes(' ')) {
      return {
        mode: 'scope',
        replaceStart: index + 3,
        replaceEnd: boundedCaret,
        rawReference
      };
    }

    return null;
  }

  const leadingWhitespaceLength = beforeCaret.match(/^\s*/)?.[0].length ?? 0;
  const trimmedLeading = beforeCaret.slice(leadingWhitespaceLength);
  if ((trimmedLeading.startsWith('/') || trimmedLeading.startsWith('~')) && !trimmedLeading.includes(' ')) {
    return {
      mode: 'path',
      replaceStart: leadingWhitespaceLength,
      replaceEnd: boundedCaret,
      rawReference: trimmedLeading
    };
  }

  return null;
}

export function applyPathAutocompleteCandidate(input: string, context: PathAutocompleteContext, candidate: PathAutocompleteCandidate) {
  return `${input.slice(0, context.replaceStart)}${candidate.replacementText}${input.slice(context.replaceEnd)}`;
}

export function pathAutocompleteSuffix(input: string, context: PathAutocompleteContext | null, candidate: PathAutocompleteCandidate | null) {
  if (!context || !candidate) {
    return '';
  }

  const current = input.slice(context.replaceStart, context.replaceEnd);
  if (!candidate.replacementText.toLowerCase().startsWith(current.toLowerCase())) {
    return '';
  }

  return candidate.replacementText.slice(current.length);
}

function normalizeAliasTrigger(trigger: string) {
  return trigger.trim();
}

function sanitizeAliasKey(trigger: string) {
  return trigger.trim().toLowerCase();
}

export function expandHomePath(path: string, homePath: string) {
  if (path === '~') {
    return homePath;
  }

  if (path.startsWith('~/')) {
    return joinPath(homePath, path.slice(2));
  }

  return normalizePath(path);
}

function collapseHomePath(path: string, homePath: string) {
  if (path === homePath) {
    return '~';
  }

  if (path.startsWith(`${homePath}/`)) {
    return `~${path.slice(homePath.length)}`;
  }

  return path;
}

function buildAliasCandidates(rawReference: string, aliases: AliasEntry[]): PathAutocompleteCandidate[] {
  const normalizedReference = rawReference.trim().toLowerCase();
  if (rawReference.includes('/')) {
    return [];
  }

  return aliases
    .filter((alias) => alias.targetType === 'path')
    .filter((alias) => normalizeAliasTrigger(alias.trigger).toLowerCase().startsWith(normalizedReference))
    .map((alias) => ({
      id: `alias:${alias.id}`,
      kind: 'alias' as const,
      label: alias.trigger,
      subtitle: alias.note?.trim() || alias.target,
      replacementText: alias.trigger,
      resolvedPath: alias.target
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildFolderCandidates(rawReference: string, folderPaths: string[], homePath: string): FolderCandidateInput[] {
  if (!hasPathPrefix(rawReference)) {
    return [];
  }

  if (rawReference === '~') {
    return [
      {
        name: '~',
        resolvedPath: homePath,
        replacementText: '~/',
        subtitle: homePath
      }
    ];
  }

  const expandedReference = normalizePath(expandHomePath(rawReference, homePath));
  const endsWithSlash = rawReference.endsWith('/');
  const parentPath = endsWithSlash ? expandedReference : dirnamePath(expandedReference);
  const partialSegment = endsWithSlash ? '' : expandedReference.slice(parentPath.length + (parentPath === '/' ? 0 : 1));
  const shouldCollapseHome = rawReference === '~' || rawReference.startsWith('~/');
  const parentDisplay = shouldCollapseHome ? collapseHomePath(parentPath, homePath) : parentPath;
  const normalizedPartial = partialSegment.toLowerCase();

  const matchingFolders = folderPaths
    .filter((candidatePath) => dirnamePath(candidatePath) === parentPath)
    .filter((candidatePath) => candidatePath.split('/').at(-1)?.toLowerCase().startsWith(normalizedPartial))
    .sort((left, right) => left.localeCompare(right))
    .map((candidatePath) => {
      const name = candidatePath.split('/').at(-1) ?? candidatePath;
      return {
        name,
        resolvedPath: candidatePath,
        replacementText: `${parentDisplay === '/' ? '/' : `${parentDisplay}/`}${name}/`,
        subtitle: candidatePath
      };
    });

  return matchingFolders;
}

function buildFolderPathSet(folderPaths: string[]) {
  return new Set(folderPaths.map((path) => normalizePath(path)));
}

function sortCandidates(candidates: PathAutocompleteCandidate[]) {
  return [...candidates].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'alias' ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });
}

export function buildPathAutocompleteState(
  input: string,
  caret: number,
  aliases: AliasEntry[],
  folderPaths: string[],
  homePath: string
): PathAutocompleteState {
  const context = detectPathAutocompleteContext(input, caret);
  if (!context) {
    return {
      context: null,
      candidates: [],
      resolvedFolderPath: null
    };
  }

  const normalizedFolders = Array.from(buildFolderPathSet(folderPaths));
  const aliasCandidates = context.mode === 'scope' ? buildAliasCandidates(context.rawReference, aliases) : [];
  const folderCandidates = buildFolderCandidates(context.rawReference, normalizedFolders, homePath).map((candidate) => ({
    id: `folder:${candidate.resolvedPath}`,
    kind: 'folder' as const,
    label: candidate.name,
    subtitle: candidate.subtitle,
    replacementText: candidate.replacementText,
    resolvedPath: candidate.resolvedPath
  }));
  const candidates = sortCandidates([...aliasCandidates, ...folderCandidates]);

  const normalizedReference = sanitizeAliasKey(context.rawReference);
  const exactAlias = aliases.find(
    (alias) => alias.targetType === 'path' && sanitizeAliasKey(alias.trigger) === normalizedReference
  );
  const exactFolderPath = hasPathPrefix(context.rawReference)
    ? normalizePath(expandHomePath(context.rawReference.endsWith('/') ? context.rawReference.slice(0, -1) : context.rawReference, homePath))
    : null;
  const resolvedFolderPath = exactAlias?.target
    ?? (exactFolderPath && buildFolderPathSet(normalizedFolders).has(exactFolderPath) ? exactFolderPath : null);

  return {
    context,
    candidates,
    resolvedFolderPath
  };
}

export function buildFixtureFolderPaths(paths: string[], homePath: string) {
  const folders = new Set<string>();

  for (const path of paths) {
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split('/').filter(Boolean);
    let current = '';
    for (let index = 0; index < parts.length - 1; index += 1) {
      current = `${current}/${parts[index]}`;
      folders.add(current || '/');
    }
    if (!normalizedPath.includes('.')) {
      folders.add(normalizedPath);
    }
  }

  folders.add('/Applications');
  folders.add('/System');
  folders.add('/System/Applications');
  folders.add(homePath);
  return Array.from(folders);
}
