import { IconApps, IconCalculator, IconFolder, IconFileText } from '@tabler/icons-react';
import { buildDeterministicResult } from './calculations';
import { launcherRuntime } from './runtime';
import { normalizeSearchText } from './scoring';
import type { AliasEntry, ClipboardEntry, LauncherResult, LocalSearchItem, SnippetEntry } from './types';

export type QueryContext = {
  scopePath?: string | null;
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
  const actions = [
    {
      id: 'open',
      label: item.kind === 'app' ? 'Launch App' : item.kind === 'folder' ? 'Open Folder' : 'Open File',
      hint: 'Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: item.kind === 'app' ? 'Launched app' : item.kind === 'folder' ? 'Opened folder' : 'Opened file',
      run: async () => {
        launcherRuntime.recordSelection(item.path);
        await launcherRuntime.openPath(item.path);
      }
    },
    {
      id: 'reveal',
      label: item.kind === 'folder' ? 'Show Folder In Finder' : 'Reveal in Finder',
      hint: 'Cmd+Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: 'Revealed in Finder',
      run: async () => {
        launcherRuntime.recordSelection(item.path);
        await launcherRuntime.revealPath(item.path);
      }
    },
    {
      id: 'copy-path',
      label: 'Copy Path',
      hint: 'Cmd+Shift+C',
      group: 'Copy',
      dismissOnRun: true,
      feedbackLabel: 'Copied path',
      run: () => launcherRuntime.copyText(item.path)
    }
  ];

  if (item.kind === 'folder') {
    actions.push({
      id: 'open-terminal',
      label: 'Open In Terminal',
      hint: 'Alt+Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: 'Opened in Terminal',
      run: async () => {
        launcherRuntime.recordSelection(item.path);
        await launcherRuntime.openInTerminal(item.path);
      }
    });
  }

  if (item.kind === 'file') {
    actions.push({
      id: 'open-with-text-edit',
      label: 'Open With TextEdit',
      hint: 'Alt+Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: 'Opened in TextEdit',
      run: async () => {
        launcherRuntime.recordSelection(item.path);
        await launcherRuntime.openWithTextEdit(item.path);
      }
    });
  }

  actions.push({
    id: 'copy-name',
    label: 'Copy Name',
    hint: 'Cmd+Shift+N',
    group: 'Copy',
    dismissOnRun: true,
    feedbackLabel: 'Copied name',
    run: () => launcherRuntime.copyText(item.name)
  });

  actions.push({
    id: 'trash',
    label: 'Move To Trash',
    hint: 'Cmd+Backspace',
    group: 'Manage',
    dismissOnRun: true,
    feedbackLabel: 'Moved to Trash',
    run: () => launcherRuntime.trashPath(item.path)
  });

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
      {
        id: 'copy',
        label: 'Copy Result',
        hint: 'Enter',
        group: 'Copy',
        dismissOnRun: true,
        feedbackLabel: 'Copied result',
        run: () => launcherRuntime.copyText(result.value ?? result.title)
      },
      {
        id: 'copy-label',
        label: 'Copy Full Expression',
        hint: 'Cmd+Shift+C',
        group: 'Copy',
        dismissOnRun: true,
        feedbackLabel: 'Copied full expression',
        run: () => launcherRuntime.copyText(result.title)
      }
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
        {
          id: 'open-settings',
          label: 'Open Settings',
          hint: 'Enter',
          group: 'Open',
          feedbackLabel: 'Opened settings',
          run: () => launcherRuntime.openSettings()
        }
      ]
    }
  ];
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
      {
        id: `copy-snippet:${snippet.id}`,
        label: 'Copy Snippet',
        hint: 'Enter',
        group: 'Copy',
        dismissOnRun: true,
        feedbackLabel: 'Copied snippet',
        run: () => launcherRuntime.copyText(snippet.content)
      }
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
      {
        id: `copy-clipboard:${entry.id}`,
        label: 'Copy Clipboard Item',
        hint: 'Enter',
        group: 'Copy',
        dismissOnRun: true,
        feedbackLabel: 'Copied clipboard item',
        run: () => launcherRuntime.copyText(entry.text)
      }
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
        {
          id: `open-alias-settings:${alias.id}`,
          label: 'Open Settings',
          hint: 'Enter',
          group: 'Open',
          feedbackLabel: 'Opened settings',
          run: () => launcherRuntime.openSettings()
        }
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
  const trimmed = query.trim();

  if (!trimmed) {
    return buildLocalResults(launcherRuntime.getRecentLocalItems(), context).sort((a, b) => b.score - a.score);
  }

  const localResults = buildLocalResults(launcherRuntime.getCachedLocal(trimmed, context.scopePath), context);
  return [
    ...buildAliasResults(trimmed),
    ...buildSettingsCommandResult(trimmed),
    ...buildCalculationResults(trimmed),
    ...buildSnippetResults(trimmed),
    ...buildClipboardResults(trimmed),
    ...localResults
  ].sort((a, b) => b.score - a.score);
}

export async function buildResults(query: string, context: QueryContext = {}): Promise<LauncherResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return buildLocalResults(launcherRuntime.getRecentLocalItems(), context).sort((a, b) => b.score - a.score);
  }

  const localResults = buildLocalResults(await launcherRuntime.searchLocal(trimmed, context.scopePath), context);
  await launcherRuntime.getClipboardHistory();

  return [
    ...buildAliasResults(trimmed),
    ...buildSettingsCommandResult(trimmed),
    ...buildCalculationResults(trimmed),
    ...buildSnippetResults(trimmed),
    ...buildClipboardResults(trimmed),
    ...localResults
  ].sort((a, b) => b.score - a.score);
}
