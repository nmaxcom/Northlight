import { IconApps, IconCalculator, IconFolder, IconFileText } from '@tabler/icons-react';
import { buildCopyActionDescriptor, buildLocalActionDescriptors, buildOpenSettingsActionDescriptor, resolveActionDescriptor } from './actions';
import { buildDeterministicResult } from './calculations';
import { parseIntentQuery } from './intentParser';
import { launcherRuntime } from './runtime';
import { normalizeSearchText } from './scoring';
import { buildSystemSettingsCommandResults } from './systemSettings';
import type { AliasEntry, ClipboardEntry, LauncherResult, LocalSearchItem, SnippetEntry } from './types';

export type QueryContext = {
  scopePath?: string | null;
  traceRequestId?: string;
};

function iconForKind(kind: LocalSearchItem['kind'] | 'snippet' | 'clipboard' | 'command') {
  if (kind === 'folder') {
    return <IconFolder size={18} stroke={1.7} />;
  }

  if (kind === 'app') {
    return <IconApps size={18} stroke={1.7} />;
  }

  if (kind === 'snippet' || kind === 'clipboard' || kind === 'command') {
    return <IconCalculator size={18} stroke={1.7} />;
  }

  return <IconFileText size={18} stroke={1.7} />;
}

function scopedSubtitle(path: string, scopePath?: string | null) {
  if (!scopePath || !path.startsWith(scopePath)) {
    return path;
  }

  const relativePath = path.slice(scopePath.length).replace(/^\/+/, '');
  return relativePath ? `${scopePath} / ${relativePath}` : scopePath;
}

function buildLocalResult(item: LocalSearchItem, context: QueryContext = {}): LauncherResult {
  const actions = buildLocalActionDescriptors(item).map(resolveActionDescriptor);

  return {
    id: item.id,
    title: item.name,
    subtitle: scopedSubtitle(item.path, context.scopePath),
    kind: item.kind,
    score: item.score,
    path: item.path,
    value: item.kind === 'app' ? 'Application' : item.kind === 'folder' ? 'Folder' : 'File',
    icon: iconForKind(item.kind),
    preview: {
      title: item.name,
      subtitle: item.path,
      sections: [
        { label: 'Type', value: item.kind === 'app' ? 'Application' : item.kind === 'folder' ? 'Folder' : 'File' },
        { label: 'Path', value: item.path }
      ]
    },
    source: 'local',
    actions
  };
}

function buildLocalResults(items: LocalSearchItem[], context: QueryContext = {}) {
  return items.map((item) => buildLocalResult(item, context));
}

function buildCalculationResults(query: string): LauncherResult[] {
  return buildDeterministicResult(query).map((result) => ({
    ...result,
    icon: <IconCalculator size={18} stroke={1.7} />,
    preview: {
      title: result.title,
      subtitle: result.subtitle,
      body: result.value,
      sections: [
        { label: 'Type', value: 'Calculation' },
        { label: 'Result', value: result.value ?? result.title }
      ]
    },
    source: 'conversion',
      actions: [
        resolveActionDescriptor(buildCopyActionDescriptor('copy-result', 'Copy Result', result.value ?? result.title, 'Enter', 'Copied result')),
        resolveActionDescriptor(
          buildCopyActionDescriptor('copy-full-expression', 'Copy Full Expression', result.title, 'Cmd+Shift+C', 'Copied full expression')
        )
      ]
    }));
}

function queryMatches(value: string, query: string) {
  const normalizedValue = normalizeSearchText(value);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return false;
  }

  return normalizedValue.includes(normalizedQuery);
}

function specialMatchScore(query: string, ...values: string[]) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return 0;
  }

  let bestScore = 0;

  for (const value of values) {
    const normalizedValue = normalizeSearchText(value);

    if (!normalizedValue) {
      continue;
    }

    if (normalizedValue === normalizedQuery) {
      bestScore = Math.max(bestScore, 176);
      continue;
    }

    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 108);
      continue;
    }

    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 82);
    }
  }

  return bestScore;
}

function inferPathKind(path: string): LocalSearchItem['kind'] {
  if (path.endsWith('.app')) {
    return 'app';
  }

  const name = path.split('/').at(-1) ?? path;
  return name.includes('.') ? 'file' : 'folder';
}

function buildSettingsCommandResult(query: string): LauncherResult[] {
  if (!['settings', 'preferences', 'prefs', 'config'].some((term) => queryMatches(term, query))) {
    return [];
  }

  return [
    {
      id: 'command:settings',
      title: 'Open Northlight Settings',
      subtitle: 'Configure aliases, scopes, preview, clipboard, snippets, and ranking',
      kind: 'command',
      score: 170,
      value: 'Command',
      icon: iconForKind('command'),
      source: 'command',
      preview: {
        title: 'Northlight Settings',
        subtitle: 'Launcher preferences',
        body: 'Aliases, scopes, preview, clipboard history, snippets, ranking, and utility-window behavior.',
        sections: [
          { label: 'Action', value: 'Open settings window' }
        ]
      },
      actions: [
        resolveActionDescriptor(buildOpenSettingsActionDescriptor())
      ]
    }
  ];
}

function withCommandIcons(results: LauncherResult[]) {
  return results.map((result) => ({
    ...result,
    icon: result.icon ?? iconForKind('command')
  }));
}

function buildSnippetResult(snippet: SnippetEntry, score: number): LauncherResult {
  return {
    id: `snippet:${snippet.id}`,
    title: snippet.trigger,
    subtitle: snippet.note || snippet.content.slice(0, 120),
    value: 'Snippet',
    kind: 'snippet',
    score,
    icon: iconForKind('snippet'),
    source: 'snippet',
    preview: {
      title: snippet.trigger,
      subtitle: snippet.note || 'Text snippet',
      body: snippet.content,
      sections: [
        { label: 'Type', value: 'Snippet' },
        { label: 'Length', value: `${snippet.content.length} chars` }
      ]
    },
    actions: [
      resolveActionDescriptor(buildCopyActionDescriptor('copy-snippet', 'Copy Snippet', snippet.content, 'Enter', 'Copied snippet'))
    ]
  };
}

function buildSnippetResults(query: string) {
  const settings = launcherRuntime.getSettingsSnapshot();
  if (!settings.snippetsEnabled) {
    return [];
  }

  return settings.snippets
    .map((snippet) => ({
      snippet,
      score: Math.max(
        specialMatchScore(query, snippet.trigger),
        specialMatchScore(query, snippet.note ?? ''),
        specialMatchScore(query, snippet.content)
      )
    }))
    .filter((entry) => entry.score > 0)
    .map((entry) => buildSnippetResult(entry.snippet, entry.score));
}

function buildClipboardResults(query: string) {
  const settings = launcherRuntime.getSettingsSnapshot();
  if (!settings.clipboardHistoryEnabled) {
    return [];
  }

  return launcherRuntime
    .getClipboardHistorySnapshot()
    .filter((entry) => queryMatches(entry.text, query))
    .map((entry, index) => buildClipboardResult(entry, 132 - index));
}

function buildClipboardResult(entry: ClipboardEntry, score: number): LauncherResult {
  return {
    id: `clipboard:${entry.id}`,
    title: entry.text.split('\n')[0].slice(0, 72),
    subtitle: new Date(entry.copiedAt).toLocaleString(),
    value: 'Clipboard',
    kind: 'clipboard',
    score,
    icon: iconForKind('clipboard'),
    source: 'clipboard',
    preview: {
      title: 'Clipboard item',
      subtitle: new Date(entry.copiedAt).toLocaleString(),
      body: entry.text,
      sections: [
        { label: 'Type', value: 'Clipboard' },
        { label: 'Length', value: `${entry.text.length} chars` }
      ]
    },
    actions: [
      resolveActionDescriptor(buildCopyActionDescriptor('copy-clipboard', 'Copy Clipboard Item', entry.text, 'Enter', 'Copied clipboard item'))
    ]
  };
}

function buildAliasResult(alias: AliasEntry, score: number): LauncherResult | null {
  if (alias.targetType === 'settings') {
    return {
      id: `alias:${alias.id}`,
      title: alias.trigger,
      subtitle: alias.note || 'Open Northlight settings',
      value: 'Alias',
      kind: 'alias',
      score,
      icon: iconForKind('command'),
      source: 'alias',
      preview: {
        title: alias.trigger,
        subtitle: alias.note || 'Alias',
        body: 'Opens the Northlight settings window.',
        sections: [
          { label: 'Alias', value: alias.trigger },
          { label: 'Target', value: 'Settings' }
        ]
      },
      actions: [
        resolveActionDescriptor(buildOpenSettingsActionDescriptor())
      ]
    };
  }

  if (alias.targetType === 'snippet') {
    const snippet = launcherRuntime.getSettingsSnapshot().snippets.find((candidate) => candidate.id === alias.target || candidate.trigger === alias.target);
    if (!snippet) {
      return null;
    }

    const snippetResult = buildSnippetResult(snippet, score);
    return {
      ...snippetResult,
      id: `alias:${alias.id}`,
      title: alias.trigger,
      subtitle: alias.note || `Alias for ${snippet.trigger}`
    };
  }

  const kind = inferPathKind(alias.target);
  const item: LocalSearchItem = {
    id: alias.target,
    path: alias.target,
    name: alias.target.split('/').at(-1) ?? alias.target,
    kind,
    score
  };

  const local = buildLocalResult(item);
  return {
    ...local,
    id: `alias:${alias.id}`,
    title: alias.trigger,
    subtitle: alias.note || `Alias for ${item.name}`,
    kind: 'alias',
    value: 'Alias',
    score,
    source: 'alias',
    preview: {
      title: alias.trigger,
      subtitle: alias.note || 'Alias',
      body: alias.target,
      sections: [
        { label: 'Alias', value: alias.trigger },
        { label: 'Target', value: item.name }
      ]
    }
  };
}

function buildAliasResults(query: string) {
  return launcherRuntime
    .getSettingsSnapshot()
    .aliases.map((alias) => ({
      alias,
      score: Math.max(specialMatchScore(query, alias.trigger), specialMatchScore(query, alias.note ?? ''))
    }))
    .filter((entry) => entry.score > 0)
    .map((entry) => buildAliasResult(entry.alias, entry.score))
    .filter((entry): entry is LauncherResult => Boolean(entry));
}

export function buildConversionResult(query: string): LauncherResult[] {
  return buildCalculationResults(query);
}

export function buildImmediateResults(query: string, context: QueryContext = {}): LauncherResult[] {
  const parsedQuery = parseIntentQuery(query);
  const trimmed = parsedQuery.searchText.trim();

  if (!trimmed) {
    return [];
  }

  const localResults = buildLocalResults(launcherRuntime.getCachedLocal(trimmed, context.scopePath, parsedQuery.intent), context);
  if (parsedQuery.intent) {
    return localResults.sort((a, b) => b.score - a.score);
  }

  return [
    ...buildAliasResults(trimmed),
    ...withCommandIcons(buildSystemSettingsCommandResults(trimmed)),
    ...buildSettingsCommandResult(trimmed),
    ...buildCalculationResults(trimmed),
    ...buildSnippetResults(trimmed),
    ...buildClipboardResults(trimmed),
    ...localResults
  ].sort((a, b) => b.score - a.score);
}

export async function buildResults(query: string, context: QueryContext = {}): Promise<LauncherResult[]> {
  const parsedQuery = parseIntentQuery(query);
  const trimmed = parsedQuery.searchText.trim();

  if (!trimmed) {
    return [];
  }

  const localResults = buildLocalResults(
    await launcherRuntime.searchLocal(trimmed, context.scopePath, parsedQuery.intent, context.traceRequestId),
    context
  );

  if (parsedQuery.intent) {
    return localResults.sort((a, b) => b.score - a.score);
  }

  return [
    ...buildAliasResults(trimmed),
    ...withCommandIcons(buildSystemSettingsCommandResults(trimmed)),
    ...buildSettingsCommandResult(trimmed),
    ...buildCalculationResults(trimmed),
    ...buildSnippetResults(trimmed),
    ...buildClipboardResults(trimmed),
    ...localResults
  ].sort((a, b) => b.score - a.score);
}
