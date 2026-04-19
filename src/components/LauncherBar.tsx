import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  LauncherAction,
  PathAutocompleteState,
  LauncherPreview,
  LauncherResult,
  LauncherSettings,
  LauncherStatus,
  LauncherTraceEvent,
  ResultKind
} from '../lib/search/types';
import { parseIntentQuery } from '../lib/search/intentParser';
import { applyPathAutocompleteCandidate, pathAutocompleteSuffix } from '../lib/search/pathAutocomplete';
import { buildHotResults, buildImmediateResults, buildResults } from '../lib/search/query';
import { launcherRuntime } from '../lib/search/runtime';
import { getLauncherTheme, getLauncherThemeStyle, getNextLauncherThemeId } from '../launcherTheme';
import classes from './LauncherBar.module.css';

const shortcutLabelMap: Record<string, string> = {
  Cmd: '⌘',
  Ctrl: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Enter: 'Enter',
  Backspace: 'Delete',
  Right: '→'
};

type FeedbackState = {
  tone: 'success' | 'error';
  message: string;
} | null;

export type LauncherBarMockState = {
  query: string;
  results: LauncherResult[];
  selectedIndex?: number;
  pointerActive?: boolean;
  isDevToolsPinned?: boolean;
  isResolving?: boolean;
  isActionsOpen?: boolean;
  actionQuery?: string;
  actionSelectedIndex?: number;
  preview?: LauncherPreview | null;
  feedback?: FeedbackState;
  settings: LauncherSettings;
  status: LauncherStatus;
  iconUrls?: Record<string, string | null>;
};

function renderShortcut(hint: string, prefix = '') {
  if (!hint.trim()) {
    return null;
  }

  return hint.split('+').map((part) => (
    <span key={`${prefix}${hint}-${part}`} className={classes.kbd} data-launcher-role="kbd">
      {shortcutLabelMap[part] ?? part}
    </span>
  ));
}

function actionMatches(action: LauncherAction, query: string) {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return true;
  }

  return `${action.label} ${action.hint} ${action.group ?? ''}`.toLowerCase().includes(trimmed);
}

function iconGlyph(kind: ResultKind) {
  if (kind === 'folder') {
    return '⌂';
  }

  if (kind === 'app') {
    return '⌘';
  }

  if (kind === 'conversion') {
    return '=';
  }

  if (kind === 'clipboard') {
    return '⎘';
  }

  if (kind === 'snippet') {
    return '¶';
  }

  if (kind === 'command' || kind === 'alias') {
    return '→';
  }

  return '▤';
}

function kindLabel(result: LauncherResult) {
  if (result.value) {
    return result.value;
  }

  switch (result.kind) {
    case 'folder':
      return 'Folder';
    case 'app':
      return 'Application';
    case 'conversion':
      return 'Calculation';
    case 'clipboard':
      return 'Clipboard';
    case 'snippet':
      return 'Snippet';
    case 'command':
      return 'Command';
    case 'alias':
      return 'Alias';
    default:
      return 'File';
  }
}

function kindClass(kind: ResultKind) {
  switch (kind) {
    case 'folder':
      return classes.iconFolder;
    case 'app':
      return classes.iconApp;
    case 'conversion':
      return classes.iconConversion;
    case 'clipboard':
      return classes.iconClipboard;
    case 'snippet':
      return classes.iconSnippet;
    case 'command':
      return classes.iconCommand;
    case 'alias':
      return classes.iconAlias;
    default:
      return classes.iconFile;
  }
}

function buildPreviewFallback(result: LauncherResult): LauncherPreview {
  return (
    result.preview ?? {
      title: result.title,
      subtitle: result.subtitle,
      body: result.value,
      sections: [{ label: 'Type', value: kindLabel(result) }]
    }
  );
}

function serializeMockResultInteractionPayload(result: LauncherResult) {
  return JSON.stringify({
    preview: buildPreviewFallback(result),
    primaryAction: result.actions[0]
      ? {
          label: result.actions[0].label,
          hint: result.actions[0].hint
        }
      : null
  });
}

function groupActions(actions: LauncherAction[]) {
  const grouped = new Map<string, LauncherAction[]>();

  for (const action of actions) {
    const key = action.group ?? 'Actions';
    grouped.set(key, [...(grouped.get(key) ?? []), action]);
  }

  return Array.from(grouped.entries()).map(([label, items]) => ({ label, items }));
}

function defaultPathAliasName(path: string) {
  return (path.split('/').at(-1) ?? '')
    .replace(/\s+/g, '')
    .trim();
}

export function LauncherBar({ mockState }: { mockState?: LauncherBarMockState }) {
  const isMock = Boolean(mockState);
  const [query, setQuery] = useState(mockState?.query ?? '');
  const [results, setResults] = useState<LauncherResult[]>(() => mockState?.results ?? buildImmediateResults(''));
  const [selectedIndex, setSelectedIndex] = useState(mockState?.selectedIndex ?? 0);
  const [isResolving, setIsResolving] = useState(Boolean(mockState?.isResolving));
  const [isActionsOpen, setIsActionsOpen] = useState(Boolean(mockState?.isActionsOpen));
  const [actionQuery, setActionQuery] = useState(mockState?.actionQuery ?? '');
  const [actionSelectedIndex, setActionSelectedIndex] = useState(mockState?.actionSelectedIndex ?? 0);
  const [preview, setPreview] = useState<LauncherPreview | null>(mockState?.preview ?? null);
  const [feedback, setFeedback] = useState<FeedbackState>(mockState?.feedback ?? null);
  const [settings, setSettings] = useState<LauncherSettings>(mockState?.settings ?? launcherRuntime.getSettingsSnapshot());
  const [pathAutocomplete, setPathAutocomplete] = useState<PathAutocompleteState>({
    context: null,
    candidates: [],
    resolvedFolderPath: null
  });
  const [pathCompletionIndex, setPathCompletionIndex] = useState(0);
  const [pathAutocompleteDismissedQuery, setPathAutocompleteDismissedQuery] = useState<string | null>(null);
  const [pathAliasName, setPathAliasName] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(mockState?.settings.quickLookStartsOpen ?? settings.quickLookStartsOpen);
  const [isPointerActive, setIsPointerActive] = useState(Boolean(mockState?.pointerActive));
  const [isDevToolsPinned, setIsDevToolsPinned] = useState(Boolean(mockState?.isDevToolsPinned));
  const [status, setStatus] = useState<LauncherStatus>({
    appVersion: mockState?.status.appVersion ?? '0.8.9',
    indexEntryCount: mockState?.status.indexEntryCount ?? 0,
    indexReady: mockState?.status.indexReady ?? false,
    isRestoring: mockState?.status.isRestoring ?? true,
    isRefreshing: mockState?.status.isRefreshing ?? false,
    searchMode: mockState?.status.searchMode ?? 'hybrid',
    catalogState: mockState?.status.catalogState ?? 'restoring'
  });
  const [iconUrls, setIconUrls] = useState<Record<string, string | null>>(mockState?.iconUrls ?? {});
  const [iconRetryTick, setIconRetryTick] = useState(0);
  const activeRefiners = useMemo(() => parseIntentQuery(query).intent?.matchedTokens ?? [], [query]);
  const activeTheme = useMemo(() => getLauncherTheme(settings.launcherThemeId), [settings.launcherThemeId]);
  const selectedResult = results[selectedIndex];
  const resolvedFolderPath = pathAutocomplete.resolvedFolderPath;
  const activePathCompletion = pathAutocomplete.candidates[pathCompletionIndex] ?? null;
  const pathSuggestionSuffix = pathAutocompleteSuffix(query, pathAutocomplete.context, activePathCompletion);
  const filteredActions = useMemo(
    () => (selectedResult?.actions ?? []).filter((action) => actionMatches(action, actionQuery)),
    [actionQuery, selectedResult]
  );
  const groupedActions = useMemo(() => groupActions(filteredActions), [filteredActions]);
  const selectedAction = filteredActions[actionSelectedIndex];
  const primaryAction = isActionsOpen ? selectedAction : selectedResult?.actions[0];
  const canOpenActions = Boolean(selectedResult || resolvedFolderPath);
  const previewVisible = settings.previewEnabled && isPreviewOpen;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const actionInputRef = useRef<HTMLInputElement | null>(null);
  const pathAliasInputRef = useRef<HTMLInputElement | null>(null);
  const pathCompletionPanelRef = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  const hotSearchRequestRef = useRef(0);
  const traceRequestSequenceRef = useRef(0);
  const visibleResultsCountRef = useRef(results.length);
  const previewRequestRef = useRef(0);
  const previewTargetRef = useRef<string | null>(null);
  const lastStableQueryRef = useRef('');
  const searchMetricsRef = useRef<{
    query: string;
    startedAt: number;
    firstVisibleMs: number | null;
    firstUsefulMs: number | null;
    hotCompleteMs: number | null;
    deepCompleteMs: number | null;
    hotResultCount: number;
    deepResultCount: number;
    topReplacementCount: number;
    firstTopResultId: string | null;
    lastTopResultId: string | null;
    initialTopWasClipboard: boolean;
  } | null>(null);
  const idleSummaryTimerRef = useRef<number | null>(null);
  const pointerSelectionEnabledRef = useRef(false);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const pointerResetPositionRef = useRef<{ x: number; y: number } | null>(null);
  const iconRetryCountsRef = useRef<Record<string, number>>({});
  const iconRetryTimerRef = useRef<number | null>(null);

  const nextTraceRequestId = useCallback((prefix: string) => {
    traceRequestSequenceRef.current += 1;
    return `${prefix}-${traceRequestSequenceRef.current}`;
  }, []);

  const traceEvent = useCallback((event: LauncherTraceEvent) => {
    return launcherRuntime.traceEvent({
      timestamp: Date.now(),
      ...event
    });
  }, []);

  const iconClassName = useCallback(
    (result: LauncherResult, extra = '') => {
      const hasImageIcon = Boolean(result.iconUrl || (result.iconPath && iconUrls[result.iconPath]) || (result.path && iconUrls[result.path]));
      return [
        classes.resultIcon,
        hasImageIcon ? classes.resultIconImageBacked : kindClass(result.kind),
        extra
      ]
        .filter(Boolean)
        .join(' ');
    },
    [iconUrls]
  );

  const focusActiveInput = useCallback(() => {
    const target =
      isActionsOpen && resolvedFolderPath && !selectedResult
        ? pathAliasInputRef.current
        : isActionsOpen
          ? actionInputRef.current
          : inputRef.current;
    target?.focus({ preventScroll: true });
  }, [isActionsOpen, resolvedFolderPath, selectedResult]);

  const resetPointerSelection = useCallback(() => {
    pointerSelectionEnabledRef.current = false;
    pointerResetPositionRef.current = lastPointerPositionRef.current;
    setIsPointerActive(false);
  }, []);

  const enablePointerSelection = useCallback((x: number, y: number) => {
    const lastPosition = lastPointerPositionRef.current;
    lastPointerPositionRef.current = { x, y };

    const resetPosition = pointerResetPositionRef.current;
    if (resetPosition && resetPosition.x === x && resetPosition.y === y) {
      return false;
    }

    if (lastPosition && lastPosition.x === x && lastPosition.y === y) {
      return false;
    }

    pointerSelectionEnabledRef.current = true;
    setIsPointerActive(true);
    return true;
  }, []);

  const updateSelectedIndexFromPointer = useCallback(
    (nextIndex: number) => {
      if (!pointerSelectionEnabledRef.current) {
        return;
      }

      setSelectedIndex(nextIndex);
    },
    []
  );

  const updateActionSelectedIndexFromPointer = useCallback(
    (nextIndex: number) => {
      if (!pointerSelectionEnabledRef.current) {
        return;
      }

      setActionSelectedIndex(nextIndex);
    },
    []
  );

  const openActions = useCallback(() => {
    if (!selectedResult && !resolvedFolderPath) {
      return;
    }

    setIsActionsOpen(true);
    setActionQuery('');
    setActionSelectedIndex(0);
  }, [resolvedFolderPath, selectedResult]);

  const closeActions = useCallback(() => {
    setIsActionsOpen(false);
    setActionQuery('');
    setActionSelectedIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  const acceptPathCompletion = useCallback(() => {
    if (!pathAutocomplete.context || !activePathCompletion) {
      return false;
    }

    resetPointerSelection();
    setPathAutocompleteDismissedQuery(null);
    setQuery(applyPathAutocompleteCandidate(query, pathAutocomplete.context, activePathCompletion));
    return true;
  }, [activePathCompletion, pathAutocomplete.context, query, resetPointerSelection]);

  const dismissPathAutocomplete = useCallback(() => {
    const caret = inputRef.current?.selectionStart ?? query.length;
    setPathAutocomplete({
      context: null,
      candidates: [],
      resolvedFolderPath: null
    });
    setPathCompletionIndex(0);
    setPathAutocompleteDismissedQuery(`${query}::${caret}`);
  }, [query]);

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      resetPointerSelection();
      setPathAutocompleteDismissedQuery(null);
      setQuery(nextQuery);
      const trimmed = nextQuery.trim();
      searchMetricsRef.current = trimmed
        ? {
            query: trimmed,
            startedAt: Date.now(),
            firstVisibleMs: null,
            firstUsefulMs: null,
            hotCompleteMs: null,
            deepCompleteMs: null,
            hotResultCount: 0,
            deepResultCount: 0,
            topReplacementCount: 0,
            firstTopResultId: null,
            lastTopResultId: null,
            initialTopWasClipboard: false
          }
        : null;
    },
    [resetPointerSelection]
  );

  const showFeedback = useCallback((tone: 'success' | 'error', message: string) => {
    setFeedback({ tone, message });
    window.clearTimeout((showFeedback as typeof showFeedback & { timer?: number }).timer);
    (showFeedback as typeof showFeedback & { timer?: number }).timer = window.setTimeout(() => setFeedback(null), 1600);
  }, []);

  const dumpTrace = useCallback(async () => {
    const dumpFile = await launcherRuntime.writeTraceDump();

    if (dumpFile.path) {
      console.log(`[trace dump] saved ${dumpFile.eventCount} events to ${dumpFile.path}`);
      showFeedback('success', 'Trace saved');
      return;
    }

    showFeedback('error', 'Trace unavailable');
  }, [showFeedback]);

  const invokeAction = useCallback(
    async (action: LauncherAction | undefined) => {
      if (!action) {
        return;
      }

      if (isMock) {
        if (action.feedbackLabel) {
          showFeedback('success', action.feedbackLabel);
        }
        focusActiveInput();
        return;
      }

      try {
        await action.run();
        if (action.feedbackLabel) {
          showFeedback('success', action.feedbackLabel);
        }

        if (action.dismissOnRun) {
          setIsActionsOpen(false);
          setActionQuery('');
          await launcherRuntime.hide();
          return;
        }
      } catch {
        showFeedback('error', `Could not ${action.label.toLowerCase()}`);
      }

      focusActiveInput();
    },
    [focusActiveInput, isMock, showFeedback]
  );

  const savePathAlias = useCallback(async () => {
    if (!resolvedFolderPath) {
      showFeedback('error', 'Resolve a folder path first');
      return;
    }

    const nextTrigger = pathAliasName.trim();
    if (!nextTrigger || /\s/.test(nextTrigger)) {
      showFeedback('error', 'Alias names cannot contain spaces');
      return;
    }

    const currentSettings = launcherRuntime.getSettingsSnapshot();
    const hasConflict = currentSettings.aliases.some((alias) => alias.trigger.toLowerCase() === nextTrigger.toLowerCase());
    if (hasConflict) {
      showFeedback('error', 'Alias name already exists');
      return;
    }

    const nextSettings: LauncherSettings = {
      ...currentSettings,
      aliases: [
        ...currentSettings.aliases,
        {
          id: `alias-${Date.now()}`,
          trigger: nextTrigger,
          targetType: 'path',
          target: resolvedFolderPath,
          note: resolvedFolderPath
        }
      ]
    };

    try {
      const saved = await launcherRuntime.saveSettings(nextSettings);
      setSettings(saved);
      showFeedback('success', 'Saved path alias');
      closeActions();
    } catch {
      showFeedback('error', 'Could not save path alias');
    }
  }, [closeActions, pathAliasName, resolvedFolderPath, showFeedback]);

  useEffect(() => {
    const metrics = searchMetricsRef.current;
    if (!metrics || metrics.query !== query.trim() || results.length === 0) {
      return;
    }

    const elapsed = Date.now() - metrics.startedAt;
    const topResult = results[0];
    const usefulResult = results.find((result) => result.kind !== 'clipboard' && result.kind !== 'snippet');

    if (metrics.firstVisibleMs === null) {
      metrics.firstVisibleMs = elapsed;
      metrics.firstTopResultId = topResult?.id ?? null;
      metrics.lastTopResultId = topResult?.id ?? null;
      metrics.initialTopWasClipboard = topResult?.kind === 'clipboard' || topResult?.kind === 'snippet';
    } else if (topResult?.id && metrics.lastTopResultId && topResult.id !== metrics.lastTopResultId) {
      metrics.topReplacementCount += 1;
      metrics.lastTopResultId = topResult.id;
    } else if (topResult?.id && !metrics.lastTopResultId) {
      metrics.lastTopResultId = topResult.id;
    }

    if (metrics.firstUsefulMs === null && usefulResult) {
      metrics.firstUsefulMs = elapsed;
    }
  }, [query, results]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      void window.launcher?.ready();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isMock]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    let cancelled = false;

    void launcherRuntime.getTraceState(true).then((state) => {
      if (!cancelled && state.enabled) {
        void traceEvent({
          subsystem: 'renderer',
          event: 'mounted',
          details: {
            sessionId: state.sessionId
          }
        });
      }
    });

    void launcherRuntime.getSettings().then((nextSettings) => {
      if (!cancelled) {
        setSettings(nextSettings);
        setIsPreviewOpen(nextSettings.quickLookStartsOpen);
      }
    });

    void launcherRuntime.getClipboardHistory();
    void launcherRuntime.getDevToolsPinned().then((nextPinned) => {
      if (!cancelled) {
        setIsDevToolsPinned(nextPinned);
      }
    });

    const unsubscribe = launcherRuntime.onSettingsChanged((nextSettings) => {
      setSettings(nextSettings);
    });
    const unsubscribeDevToolsPinned = launcherRuntime.onDevToolsPinnedChanged((nextPinned) => {
      setIsDevToolsPinned(nextPinned);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeDevToolsPinned();
    };
  }, [isMock, traceEvent]);

  useEffect(() => {
    visibleResultsCountRef.current = results.length;
  }, [results.length]);

  useEffect(() => {
    let cancelled = false;
    const caret = inputRef.current?.selectionStart ?? query.length;
    const dismissalKey = `${query}::${caret}`;

    if (pathAutocompleteDismissedQuery === dismissalKey) {
      setPathAutocomplete({
        context: null,
        candidates: [],
        resolvedFolderPath: null
      });
      return;
    }

    void launcherRuntime.getPathAutocomplete(query, caret).then((nextState) => {
      if (cancelled) {
        return;
      }

      setPathAutocomplete(nextState);
      setPathCompletionIndex(0);
    });

    return () => {
      cancelled = true;
    };
  }, [pathAutocompleteDismissedQuery, query, settings.aliases]);

  useEffect(() => {
    if (!resolvedFolderPath) {
      setPathAliasName('');
      return;
    }

    setPathAliasName((current) => current || defaultPathAliasName(resolvedFolderPath));
  }, [resolvedFolderPath]);

  useEffect(() => {
    if (pathAutocomplete.candidates.length <= 1) {
      return;
    }

    const selectedRow = pathCompletionPanelRef.current?.querySelector<HTMLElement>('[data-path-completion-selected="true"]');
    selectedRow?.scrollIntoView({ block: 'nearest' });
  }, [pathAutocomplete.candidates.length, pathCompletionIndex]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    return launcherRuntime.onIndexChanged(() => {
      const traceRequestId = nextTraceRequestId('search-index');
      void traceEvent({
        subsystem: 'renderer',
        event: 'index-changed',
        requestId: traceRequestId,
        query
      });

      if (!query.trim()) {
        setResults(buildImmediateResults(''));
        setIsResolving(false);
        return;
      }

      if (visibleResultsCountRef.current === 0) {
        setIsResolving(true);
      }

      const requestId = ++searchRequestRef.current;
      void traceEvent({
        subsystem: 'search',
        event: 'start',
        requestId: traceRequestId,
        query,
        details: {
          reason: 'index-change'
        }
      });
      const startedAt = Date.now();
      void buildResults(query, { traceRequestId }).then((nextResults) => {
        if (requestId !== searchRequestRef.current) {
          void traceEvent({
            subsystem: 'search',
            event: 'cancel',
            requestId: traceRequestId,
            query,
            durationMs: Date.now() - startedAt,
            outcome: 'obsolete'
          });
          return;
        }

        setResults(nextResults);
        setIsResolving(false);
        void traceEvent({
          subsystem: 'search',
          event: 'complete',
          requestId: traceRequestId,
          query,
          durationMs: Date.now() - startedAt,
          resultCount: nextResults.length
        });
      });
    });
  }, [isMock, nextTraceRequestId, query, traceEvent]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const refreshStatus = (reason: 'mount' | 'poll' | 'index-change' = 'poll') => {
      const traceRequestId = nextTraceRequestId('status');
      const startedAt = Date.now();
      void traceEvent({
        subsystem: 'status',
        event: 'start',
        requestId: traceRequestId,
        details: {
          reason
        }
      });
      void launcherRuntime.getStatus(traceRequestId).then((nextStatus) => {
        if (cancelled) {
          void traceEvent({
            subsystem: 'status',
            event: 'cancel',
            requestId: traceRequestId,
            durationMs: Date.now() - startedAt,
            outcome: 'cancelled'
          });
          return;
        }

        setStatus(nextStatus);
        void traceEvent({
          subsystem: 'status',
          event: 'complete',
          requestId: traceRequestId,
          durationMs: Date.now() - startedAt,
          details: {
            refreshing: nextStatus.isRefreshing,
            restoring: nextStatus.isRestoring,
            ready: nextStatus.indexReady
          }
        });

        if (nextStatus.isRefreshing || nextStatus.isRestoring) {
          timer = window.setTimeout(() => refreshStatus('poll'), 1500);
        }
      });
    };

    refreshStatus('mount');
    const unsubscribe = launcherRuntime.onIndexChanged(() => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      refreshStatus('index-change');
    });

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [isMock, nextTraceRequestId, traceEvent]);

  useEffect(() => {
    focusActiveInput();
  }, [focusActiveInput]);

  useEffect(() => {
    resetPointerSelection();

    const handleFocus = () => {
      resetPointerSelection();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [resetPointerSelection]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    resetPointerSelection();
    setSelectedIndex(0);
  }, [isMock, query, resetPointerSelection]);

  useEffect(() => {
    if (results.length === 0) {
      if (selectedIndex !== 0) {
        setSelectedIndex(0);
      }
      return;
    }

    if (selectedIndex >= results.length) {
      setSelectedIndex(results.length - 1);
    }
  }, [results.length, selectedIndex]);

  useEffect(() => {
    resetPointerSelection();
    setActionSelectedIndex(0);
  }, [actionQuery, resetPointerSelection, selectedResult?.id]);

  useEffect(() => {
    resetPointerSelection();
  }, [filteredActions, resetPointerSelection, results]);

  useEffect(() => {
    const selectedElement = resultsRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, results]);

  useEffect(() => {
    if (!isActionsOpen) {
      return;
    }

    const selectedElement = actionsRef.current?.querySelector<HTMLElement>('[data-action-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [actionSelectedIndex, filteredActions, isActionsOpen]);

  useEffect(() => {
    if (isActionsOpen && !selectedResult) {
      if (!resolvedFolderPath) {
        closeActions();
      }
    }
  }, [closeActions, isActionsOpen, resolvedFolderPath, selectedResult]);

  useEffect(() => {
    if (!isActionsOpen || !resolvedFolderPath || selectedResult) {
      return;
    }

    window.requestAnimationFrame(() => {
      pathAliasInputRef.current?.focus({ preventScroll: true });
      pathAliasInputRef.current?.select();
    });
  }, [isActionsOpen, resolvedFolderPath, selectedResult]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    return launcherRuntime.onVisibilityChanged((visible) => {
      resetPointerSelection();
      if (!visible) {
        setQuery('');
        setResults([]);
        setSelectedIndex(0);
        setIsResolving(false);
        setIsActionsOpen(false);
        setActionQuery('');
        setActionSelectedIndex(0);
        setPreview(null);
        launcherRuntime.clearVisibleSearchState();
        return;
      }

      focusActiveInput();
    });
  }, [focusActiveInput, isMock, resetPointerSelection]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    const previousQuery = lastStableQueryRef.current;
    if (previousQuery === query) {
      void traceEvent({
        subsystem: 'renderer',
        event: 'query-repeat',
        query
      });
    } else {
      lastStableQueryRef.current = query;
      void traceEvent({
        subsystem: 'renderer',
        event: 'query-change',
        query
      });
    }

    if (idleSummaryTimerRef.current) {
      window.clearTimeout(idleSummaryTimerRef.current);
    }

    idleSummaryTimerRef.current = window.setTimeout(() => {
      void launcherRuntime.getIdleTraceSummary().then((summary) => {
        if (summary.totalEvents > 0) {
          console.log('[trace idle summary]', summary);
        }
      });
    }, 2500);

    const immediateResults = buildImmediateResults(query);
    void traceEvent({
      subsystem: 'search',
      event: 'immediate-results',
      query,
      resultCount: immediateResults.length,
      details: {
        empty: query.trim().length === 0
      }
    });

    if (!query.trim()) {
      setResults([]);
      setIsResolving(false);
      return;
    }

    setResults(immediateResults);
    setIsResolving(immediateResults.length === 0);
    return () => {
      if (idleSummaryTimerRef.current) {
        window.clearTimeout(idleSummaryTimerRef.current);
        idleSummaryTimerRef.current = null;
      }
    };
  }, [isMock, query, settings, traceEvent]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    let canceled = false;

    if (!query.trim()) {
      setIsResolving(false);
      return;
    }

    const traceRequestId = nextTraceRequestId('search-hot');
    const requestId = ++hotSearchRequestRef.current;
    const startedAt = Date.now();
    setIsResolving((current) => current || visibleResultsCountRef.current === 0);
    void traceEvent({
      subsystem: 'search',
      event: 'start',
      requestId: traceRequestId,
      query,
      details: {
        reason: 'query-change-hot'
      }
    });
    void buildHotResults(query, { traceRequestId }).then((nextResults) => {
      if (!canceled && requestId === hotSearchRequestRef.current) {
        const metrics = searchMetricsRef.current;
        if (metrics && metrics.query === query.trim()) {
          metrics.hotCompleteMs = Date.now() - metrics.startedAt;
          metrics.hotResultCount = nextResults.length;
        }
        if (nextResults.length > 0) {
          setResults(nextResults);
          setIsResolving(false);
        }
        void traceEvent({
          subsystem: 'search',
          event: 'complete',
          requestId: traceRequestId,
          query,
          durationMs: Date.now() - startedAt,
          resultCount: nextResults.length
        });
        return;
      }

      void traceEvent({
        subsystem: 'search',
        event: 'cancel',
        requestId: traceRequestId,
        query,
        durationMs: Date.now() - startedAt,
        outcome: 'obsolete'
      });
    });

    return () => {
      canceled = true;
    };
  }, [isMock, nextTraceRequestId, query, settings, traceEvent]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    let canceled = false;

    if (!query.trim()) {
      setIsResolving(false);
      return;
    }

    const traceRequestId = nextTraceRequestId('search-query');
    const requestId = ++searchRequestRef.current;
    const startedAt = Date.now();
    void traceEvent({
      subsystem: 'search',
      event: 'start',
      requestId: traceRequestId,
      query,
      details: {
        reason: 'query-change-deep'
      }
    });
    void buildResults(query, { traceRequestId }).then((nextResults) => {
      if (!canceled && requestId === searchRequestRef.current) {
        const metrics = searchMetricsRef.current;
        if (metrics && metrics.query === query.trim()) {
          metrics.deepCompleteMs = Date.now() - metrics.startedAt;
          metrics.deepResultCount = nextResults.length;
        }
        setResults(nextResults);
        setIsResolving(false);
        if (metrics && metrics.query === query.trim()) {
          void launcherRuntime.recordSearchPerformance({
            query: metrics.query,
            firstVisibleMs: metrics.firstVisibleMs,
            firstUsefulMs: metrics.firstUsefulMs,
            hotCompleteMs: metrics.hotCompleteMs,
            deepCompleteMs: metrics.deepCompleteMs,
            hotResultCount: metrics.hotResultCount,
            deepResultCount: metrics.deepResultCount,
            topReplacementCount: metrics.topReplacementCount,
            clipboardFirstFlash:
              metrics.initialTopWasClipboard &&
              Boolean(nextResults[0]) &&
              nextResults[0].kind !== 'clipboard' &&
              nextResults[0].kind !== 'snippet'
          });
        }
        void traceEvent({
          subsystem: 'search',
          event: 'complete',
          requestId: traceRequestId,
          query,
          durationMs: Date.now() - startedAt,
          resultCount: nextResults.length
        });
        return;
      }

      void traceEvent({
        subsystem: 'search',
        event: 'cancel',
        requestId: traceRequestId,
        query,
        durationMs: Date.now() - startedAt,
        outcome: 'obsolete'
      });
    });

    return () => {
      canceled = true;
    };
  }, [isMock, nextTraceRequestId, query, settings, traceEvent]);

  useEffect(() => {
    if (isMock) {
      if (!selectedResult || !previewVisible) {
        setPreview(null);
        return;
      }

      setPreview(buildPreviewFallback(selectedResult));
      return;
    }

    let cancelled = false;

    if (!selectedResult || !previewVisible) {
      setPreview(null);
      previewTargetRef.current = null;
      return;
    }

    const previewTarget =
      selectedResult.path && (selectedResult.kind === 'file' || selectedResult.kind === 'folder' || selectedResult.kind === 'app')
        ? `${selectedResult.kind}:${selectedResult.path}`
        : `inline:${selectedResult.id}`;
    const fallback = buildPreviewFallback(selectedResult);
    const shouldResetPreview = previewTargetRef.current !== previewTarget;

    if (shouldResetPreview) {
      setPreview(fallback);
      previewTargetRef.current = previewTarget;
    }

    if (selectedResult.path && (selectedResult.kind === 'file' || selectedResult.kind === 'folder' || selectedResult.kind === 'app')) {
      const traceRequestId = nextTraceRequestId('preview');
      const requestId = ++previewRequestRef.current;
      const startedAt = Date.now();
      void traceEvent({
        subsystem: 'preview',
        event: 'start',
        requestId: traceRequestId,
        path: selectedResult.path,
        kind: selectedResult.kind
      });
      void launcherRuntime.getPathPreview(selectedResult.path, selectedResult.kind, traceRequestId).then((nextPreview) => {
        if (!cancelled && requestId === previewRequestRef.current && nextPreview) {
          setPreview(nextPreview);
          if (selectedResult.kind === 'app' && nextPreview.mediaUrl) {
            setIconUrls((current) => (
              current[selectedResult.path] === nextPreview.mediaUrl
                ? current
                : {
                    ...current,
                    [selectedResult.path]: nextPreview.mediaUrl
                  }
            ));
            delete iconRetryCountsRef.current[selectedResult.path];
          }
          void traceEvent({
            subsystem: 'preview',
            event: 'complete',
            requestId: traceRequestId,
            path: selectedResult.path,
            kind: selectedResult.kind,
            durationMs: Date.now() - startedAt,
            outcome: 'applied'
          });
          return;
        }

        void traceEvent({
          subsystem: 'preview',
          event: 'cancel',
          requestId: traceRequestId,
          path: selectedResult.path,
          kind: selectedResult.kind,
          durationMs: Date.now() - startedAt,
          outcome: cancelled ? 'cancelled' : 'obsolete'
        });
      });
      return () => {
        cancelled = true;
      };
    }

    return () => {
      cancelled = true;
    };
  }, [isMock, nextTraceRequestId, previewVisible, selectedResult, traceEvent]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    const visibleIconPaths = new Set(
      results
        .filter((result) => !result.iconUrl)
        .map((result) => result.iconPath ?? result.path)
        .filter((path): path is string => Boolean(path))
    );

    for (const path of Object.keys(iconRetryCountsRef.current)) {
      if (!visibleIconPaths.has(path)) {
        delete iconRetryCountsRef.current[path];
      }
    }

    const iconPaths = Array.from(
      new Set(
        results
          .filter((result) => !result.iconUrl)
          .map((result) => result.iconPath ?? result.path)
          .filter((path): path is string => Boolean(path))
          .filter((path) => !iconUrls[path])
          .filter((path) => (iconRetryCountsRef.current[path] ?? 0) < 4)
      )
    );

    if (iconPaths.length === 0) {
      return;
    }

    let cancelled = false;
    const traceRequestId = nextTraceRequestId('icons');
    const startedAt = Date.now();

    void traceEvent({
      subsystem: 'icon',
      event: 'batch-start',
      requestId: traceRequestId,
      resultCount: iconPaths.length
    });

    void launcherRuntime.getPathIcons(iconPaths, traceRequestId).then((iconMap) => {
      if (cancelled) {
        void traceEvent({
          subsystem: 'icon',
          event: 'batch-cancel',
          requestId: traceRequestId,
          durationMs: Date.now() - startedAt,
          outcome: 'cancelled'
        });
        return;
      }

      setIconUrls((current) => {
        const next = { ...current };
        for (const [path, icon] of Object.entries(iconMap)) {
          if (icon) {
            next[path] = icon;
            delete iconRetryCountsRef.current[path];
          }
        }
        return next;
      });

      const unresolvedPaths = iconPaths.filter((path) => !iconMap[path]);
      if (unresolvedPaths.length > 0) {
        let shouldRetry = false;
        let retryDelay = Number.POSITIVE_INFINITY;

        for (const path of unresolvedPaths) {
          const attempt = (iconRetryCountsRef.current[path] ?? 0) + 1;
          iconRetryCountsRef.current[path] = attempt;
          if (attempt < 4) {
            shouldRetry = true;
            retryDelay = Math.min(retryDelay, attempt === 1 ? 150 : attempt === 2 ? 400 : 900);
          }
        }

        if (shouldRetry) {
          if (iconRetryTimerRef.current) {
            window.clearTimeout(iconRetryTimerRef.current);
          }
          iconRetryTimerRef.current = window.setTimeout(() => {
            iconRetryTimerRef.current = null;
            setIconRetryTick((current) => current + 1);
          }, retryDelay);
        }
      }

      void traceEvent({
        subsystem: 'icon',
        event: 'batch-complete',
        requestId: traceRequestId,
        durationMs: Date.now() - startedAt,
        resultCount: Object.keys(iconMap).length
      });
    });

    return () => {
      cancelled = true;
    };
  }, [iconRetryTick, iconUrls, isMock, nextTraceRequestId, results, traceEvent]);

  useEffect(
    () => () => {
      if (iconRetryTimerRef.current) {
        window.clearTimeout(iconRetryTimerRef.current);
      }
    },
    []
  );

  const toggleLauncherTheme = useCallback(() => {
    setSettings((current) => {
      const nextSettings = {
        ...current,
        launcherThemeId: getNextLauncherThemeId(current.launcherThemeId)
      };

      if (!isMock) {
        void launcherRuntime.saveSettings(nextSettings).then(setSettings).catch(() => undefined);
      }

      return nextSettings;
    });
    focusActiveInput();
  }, [focusActiveInput, isMock]);

  const toggleDevToolsPinned = useCallback(() => {
    if (isMock) {
      setIsDevToolsPinned((current) => !current);
      focusActiveInput();
      return;
    }

    void launcherRuntime
      .toggleDevToolsPinned()
      .then((nextPinned) => {
        setIsDevToolsPinned(nextPinned);
        focusActiveInput();
      })
      .catch(() => undefined);
  }, [focusActiveInput, isMock]);

  useEffect(() => {
    if (isMock) {
      return;
    }

    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (!isActionsOpen && document.activeElement === inputRef.current && acceptPathCompletion()) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        focusActiveInput();
        return;
      }

      if (event.key === ',' && event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        await launcherRuntime.openSettings();
        return;
      }

      if (event.key === 'Backspace' && event.metaKey && !event.altKey && !event.shiftKey) {
        if (document.activeElement === actionInputRef.current) {
          event.preventDefault();
          setActionQuery('');
          return;
        }

        if (document.activeElement === inputRef.current) {
          event.preventDefault();
          setQuery('');
          setResults([]);
          setSelectedIndex(0);
          setIsResolving(false);
          return;
        }
      }

      if (event.key.toLowerCase() === 'k' && event.metaKey && !event.altKey && !event.shiftKey) {
        if (!canOpenActions) {
          return;
        }

        event.preventDefault();
        if (isActionsOpen) {
          closeActions();
        } else {
          openActions();
        }
        return;
      }

      if (event.key.toLowerCase() === 'd' && event.metaKey && event.shiftKey && !event.altKey) {
        event.preventDefault();
        await dumpTrace();
        return;
      }

      if (isActionsOpen) {
        if (document.activeElement === pathAliasInputRef.current) {
          if (event.key === 'Enter' && !event.metaKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            await savePathAlias();
            return;
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            closeActions();
            return;
          }
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActionSelectedIndex((current) => (filteredActions.length ? (current + 1) % filteredActions.length : 0));
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActionSelectedIndex((current) => (filteredActions.length ? (current - 1 + filteredActions.length) % filteredActions.length : 0));
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          closeActions();
          return;
        }

        if (event.key === 'Enter' && !event.metaKey && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          await invokeAction(selectedAction);
          return;
        }
      }

      if (!isActionsOpen && pathAutocomplete.candidates.length > 1 && document.activeElement === inputRef.current) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setPathCompletionIndex((current) => (current + 1) % pathAutocomplete.candidates.length);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setPathCompletionIndex((current) => (current - 1 + pathAutocomplete.candidates.length) % pathAutocomplete.candidates.length);
          return;
        }
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (results.length ? (current + 1) % results.length : 0));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => (results.length ? (current - 1 + results.length) % results.length : 0));
        return;
      }

      if (event.key === 'Escape') {
        if (!isActionsOpen && document.activeElement === inputRef.current && (pathAutocomplete.context || pathAutocomplete.candidates.length > 0)) {
          event.preventDefault();
          dismissPathAutocomplete();
          return;
        }

        if (isActionsOpen) {
          event.preventDefault();
          closeActions();
          return;
        }

        if (query.trim()) {
          event.preventDefault();
          setQuery('');
          setResults(buildImmediateResults(''));
          setIsResolving(false);
          return;
        }

        event.preventDefault();
        await launcherRuntime.hide();
        return;
      }

      if (!selectedResult) {
        return;
      }

      const action = selectedResult.actions.find((candidate) => {
        if (candidate.hint === 'Enter') {
          return event.key === 'Enter' && !event.metaKey && !event.altKey && !event.shiftKey;
        }

        if (candidate.hint === 'Cmd+Enter') {
          return event.key === 'Enter' && event.metaKey;
        }

        if (candidate.hint === 'Cmd+Shift+C') {
          return event.key.toLowerCase() === 'c' && event.metaKey && event.shiftKey;
        }

        if (candidate.hint === 'Alt+Enter') {
          return event.key === 'Enter' && event.altKey;
        }

        if (candidate.hint === 'Cmd+Shift+N') {
          return event.key.toLowerCase() === 'n' && event.metaKey && event.shiftKey;
        }

        if (candidate.hint === 'Right') {
          return event.key === 'ArrowRight' && !event.metaKey && !event.altKey && !event.shiftKey;
        }

        if (candidate.hint === 'Cmd+,') {
          return event.key === ',' && event.metaKey;
        }

        return false;
      });

      if (action) {
        event.preventDefault();
        await invokeAction(action);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    closeActions,
    canOpenActions,
    acceptPathCompletion,
    dismissPathAutocomplete,
    dumpTrace,
    filteredActions.length,
    focusActiveInput,
    invokeAction,
    isMock,
    isActionsOpen,
    openActions,
    pathAutocomplete.candidates.length,
    pathAutocomplete.context,
    query,
    results.length,
    savePathAlias,
    selectedAction,
    selectedResult,
  ]);

  return (
    <div
      className={classes.window}
      data-launcher-role="window"
      data-launcher-theme={activeTheme.id}
      data-pointer-active={isPointerActive ? 'true' : 'false'}
      data-devtools-pinned={isDevToolsPinned ? 'true' : 'false'}
      style={getLauncherThemeStyle(activeTheme.id)}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement;
        const activeInput =
          isActionsOpen && resolvedFolderPath && !selectedResult
            ? pathAliasInputRef.current
            : isActionsOpen
              ? actionInputRef.current
              : inputRef.current;

        if (target === activeInput) {
          return;
        }

        event.preventDefault();
        window.requestAnimationFrame(() => {
          target.blur?.();
          activeInput?.focus({ preventScroll: true });
        });
      }}
      onMouseDownCapture={(event) => {
        const target = event.target as HTMLElement;

        if (
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[data-launcher-selectable="true"]')
        ) {
          return;
        }

        event.preventDefault();
        focusActiveInput();
      }}
    >
      <section className={classes.shell} data-launcher-role="shell">
        <header className={classes.header} data-launcher-role="header">
          <div className={classes.headerLeft} data-launcher-role="header-left">
            <div className={classes.brand} data-launcher-role="brand">Northlight</div>
            <button
              type="button"
              className={classes.themeSwitch}
              data-launcher-role="theme-switch"
              aria-label={`Switch launcher theme. Current theme ${activeTheme.label}`}
              onMouseDown={(event) => {
                event.preventDefault();
                focusActiveInput();
              }}
              onClick={toggleLauncherTheme}
            >
              <span className={classes.themeSwitchLabel} data-launcher-role="theme-switch-label">Theme</span>
              <span className={classes.themeSwitchValue} data-launcher-role="theme-switch-value">{activeTheme.label}</span>
            </button>
            <button
              type="button"
              className={`${classes.themeSwitch} ${isDevToolsPinned ? classes.themeSwitchActive : ''}`}
              data-launcher-role="devtools-toggle"
              aria-label={`Toggle launcher inspect mode. Inspect mode ${isDevToolsPinned ? 'on' : 'off'}`}
              aria-pressed={isDevToolsPinned}
              onMouseDown={(event) => {
                event.preventDefault();
                focusActiveInput();
              }}
              onClick={toggleDevToolsPinned}
            >
              <span className={classes.themeSwitchLabel} data-launcher-role="devtools-toggle-label">Inspect</span>
              <span className={classes.themeSwitchValue} data-launcher-role="devtools-toggle-value">{isDevToolsPinned ? 'On' : 'Off'}</span>
            </button>
          </div>
          <div className={classes.status} data-launcher-role="status">
            <div
              className={`${classes.badge} ${classes.versionBadge}`}
              data-launcher-role="status-badge"
              data-launcher-badge="version"
            >
              v{status.appVersion}
            </div>
            <div className={classes.badge} data-launcher-role="status-badge">{status.indexEntryCount.toLocaleString()} indexed</div>
            <div className={`${classes.badge} ${classes.readyBadge}`} data-launcher-role="status-ready-badge">
              {status.isRestoring ? 'Restoring' : status.isRefreshing ? 'Refreshing' : status.indexReady ? 'Ready' : 'Cold'}
            </div>
          </div>
        </header>

        <section className={classes.search} data-launcher-role="search">
          <div className={classes.searchIcon} data-launcher-role="search-icon">⌕</div>
          <div className={classes.searchCenter} data-launcher-role="search-center">
            <div className={classes.searchInputWrap} data-launcher-role="search-input-wrap">
              {pathSuggestionSuffix ? (
                <div className={classes.searchSuggestion} data-launcher-role="path-suggestion" aria-hidden="true">
                  <span className={classes.searchSuggestionTyped}>{query}</span>
                  <span>{pathSuggestionSuffix}</span>
                </div>
              ) : null}
              <input
                aria-label="Launcher query"
                ref={inputRef}
                className={`${classes.searchInput} ${activeRefiners.length > 0 ? classes.searchInputWithRefiners : ''}`}
                data-launcher-role="search-input"
                data-has-refiners={activeRefiners.length > 0 ? 'true' : 'false'}
                type="text"
                value={query}
                size={activeRefiners.length > 0 ? Math.max(query.length, 1) : undefined}
                placeholder="Search files, folders, apps, or type 30mph to kmh"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => handleQueryChange(event.currentTarget.value)}
              />
            </div>
            {activeRefiners.length > 0 ? (
              <span className={classes.refinerBar} data-launcher-role="refiner-bar" aria-hidden="true">
                {activeRefiners.map((token, index) => (
                  <span key={`${token}-${index}`} className={classes.refinerChip} data-launcher-role="refiner-chip">
                    {token === '/' ? 'folder' : token}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
          <div className={classes.searchArrow} data-launcher-role="search-arrow">→</div>
        </section>

        <section className={`${classes.body} ${previewVisible ? classes.bodyWithPreview : ''}`} data-launcher-role="body">
          <div className={classes.resultsColumn} data-launcher-role="results-column">
            {pathAutocomplete.candidates.length > 1 ? (
              <section
                ref={pathCompletionPanelRef}
                className={classes.pathCompletionPanel}
                data-launcher-role="path-completion-list"
              >
                {pathAutocomplete.candidates.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={classes.pathCompletionRow}
                    data-launcher-role="path-completion-row"
                    data-path-completion-kind={candidate.kind}
                    data-path-completion-selected={index === pathCompletionIndex ? 'true' : 'false'}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      focusActiveInput();
                    }}
                    onMouseEnter={() => setPathCompletionIndex(index)}
                    onClick={() => {
                      setPathCompletionIndex(index);
                      acceptPathCompletion();
                    }}
                  >
                    <span className={classes.pathCompletionCopy}>
                      <span className={classes.pathCompletionLabel}>{candidate.label}</span>
                    </span>
                  </button>
                ))}
              </section>
            ) : null}
            <section
              className={classes.results}
              data-launcher-role="results"
              data-results-scroll="true"
              ref={resultsRef}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest('button')) {
                  return;
                }

                event.preventDefault();
                inputRef.current?.focus({ preventScroll: true });
              }}
            >
              {results.length === 0 ? (
                <section className={classes.emptyState} data-launcher-role="empty-state">
                  <div>
                    <h2>{query.trim() ? (isResolving ? 'Searching...' : 'No matching result') : 'Start typing to search'}</h2>
                    <p>
                      {query.trim()
                        ? isResolving
                          ? 'Hold for a moment while local results resolve.'
                          : 'Try a broader filename, alias, snippet trigger, folder name, app, or deterministic conversion.'
                        : 'Search apps, files, folders, snippets, clipboard history, calculations, and macOS settings from one field.'}
                    </p>
                  </div>
                </section>
              ) : (
                results.map((result, index) => {
                  const absoluteIndex = index;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      className={classes.result}
                      data-launcher-role="result"
                      data-result-id={result.id}
                      data-mock-interaction={isMock ? serializeMockResultInteractionPayload(result) : undefined}
                      data-selected={absoluteIndex === selectedIndex ? 'true' : 'false'}
                      tabIndex={-1}
                      onMouseDown={(event) => {
                        lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
                        pointerSelectionEnabledRef.current = true;
                        setIsPointerActive(true);
                        event.preventDefault();
                        focusActiveInput();
                      }}
                      onMouseMove={(event) => {
                        if (!enablePointerSelection(event.clientX, event.clientY)) {
                          return;
                        }

                        setSelectedIndex(absoluteIndex);
                      }}
                      onMouseEnter={() => updateSelectedIndexFromPointer(absoluteIndex)}
                      onClick={() => void invokeAction(result.actions[0])}
                    >
                      <div className={iconClassName(result)} data-launcher-role="result-icon" data-launcher-kind={result.kind}>
                        {result.iconUrl ? (
                          <img className={classes.resultIconImage} data-launcher-role="result-icon-image" src={result.iconUrl} alt="" />
                        ) : result.iconPath && iconUrls[result.iconPath] ? (
                          <img className={classes.resultIconImage} data-launcher-role="result-icon-image" src={iconUrls[result.iconPath] ?? ''} alt="" />
                        ) : result.path && iconUrls[result.path] ? (
                          <img className={classes.resultIconImage} data-launcher-role="result-icon-image" src={iconUrls[result.path] ?? ''} alt="" />
                        ) : (
                          result.icon ?? iconGlyph(result.kind)
                        )}
                      </div>
                      <div className={classes.resultCopy} data-launcher-role="result-copy">
                        <div className={classes.resultTitle} data-launcher-role="result-title">{result.title}</div>
                        <div className={classes.resultSubtitle} data-launcher-role="result-subtitle">{result.subtitle}</div>
                      </div>
                      <div className={classes.resultKind} data-launcher-role="result-kind">{kindLabel(result)}</div>
                    </button>
                  );
                })
              )}
            </section>
          </div>

          {previewVisible ? (
            <aside className={classes.previewPane} data-launcher-role="preview-pane">
              <div className={classes.previewHeader} data-launcher-role="preview-header">
                <div className={classes.previewEyebrow} data-launcher-role="preview-eyebrow">Preview</div>
              </div>
              {preview ? (
                <div className={classes.previewContent} data-launcher-role="preview-content">
                  <div className={classes.previewTitle} data-launcher-role="preview-title" data-launcher-selectable="true">{preview.title}</div>
                  <div className={classes.previewSubtitle} data-launcher-role="preview-subtitle" data-launcher-selectable="true">{preview.subtitle}</div>
                  {preview.mediaUrl ? (
                    <div className={classes.previewMediaFrame} data-launcher-role="preview-media-frame">
                      <img className={classes.previewMediaImage} data-launcher-role="preview-media-image" src={preview.mediaUrl} alt={preview.mediaAlt ?? ''} />
                    </div>
                  ) : null}
                  {preview.body ? <pre className={classes.previewBody} data-launcher-role="preview-body" data-launcher-selectable="true">{preview.body}</pre> : null}
                  <div className={classes.previewMeta} data-launcher-role="preview-meta">
                    {preview.sections.map((section) => (
                      <div key={`${section.label}-${section.value}`} className={classes.previewMetaRow} data-launcher-role="preview-meta-row">
                        <span className={classes.previewMetaLabel} data-launcher-role="preview-meta-label" data-launcher-selectable="true">{section.label}</span>
                        <span className={classes.previewMetaValue} data-launcher-role="preview-meta-value" data-launcher-selectable="true">{section.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={classes.previewPlaceholder} data-launcher-role="preview-placeholder">Select a result to inspect it here.</div>
              )}
            </aside>
          ) : null}
        </section>

        <footer className={classes.footer} data-launcher-role="footer">
          {isActionsOpen ? (
            <div className={classes.actionsPanel} data-launcher-role="actions-panel" data-actions-panel="true">
              <div className={classes.actionHeader} data-launcher-role="action-header">
                <div className={classes.actionHeaderTitle} data-launcher-role="action-header-title">{selectedResult?.title ?? 'Actions'}</div>
                <div className={classes.actionHeaderSubtitle} data-launcher-role="action-header-subtitle">
                  {selectedResult ? kindLabel(selectedResult) : resolvedFolderPath ?? 'Current input'}
                </div>
              </div>
              {resolvedFolderPath ? (
                <div className={classes.aliasBuilder} data-launcher-role="path-alias-builder">
                  <div className={classes.aliasBuilderCopy}>
                    <div className={classes.actionGroupLabel}>Save Path Alias</div>
                    <div className={classes.actionHeaderSubtitle}>{resolvedFolderPath}</div>
                  </div>
                  <div className={classes.aliasBuilderControls}>
                    <input
                      aria-label="Path alias name"
                      ref={pathAliasInputRef}
                      className={classes.aliasBuilderInput}
                      value={pathAliasName}
                      onChange={(event) => setPathAliasName(event.currentTarget.value.replace(/\s+/g, ''))}
                      placeholder="Northlight"
                    />
                    <button
                      type="button"
                      className={classes.aliasBuilderButton}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => void savePathAlias()}
                    >
                      Save Path Alias
                    </button>
                  </div>
                </div>
              ) : null}
              <div className={classes.actionList} data-launcher-role="action-list" ref={actionsRef}>
                {groupedActions.length === 0 ? (
                  <div className={classes.actionEmpty} data-launcher-role="action-empty">No matching actions</div>
                ) : (
                  groupedActions.map((group) => (
                    <section key={group.label} className={classes.actionGroup} data-launcher-role="action-group">
                      <div className={classes.actionGroupLabel} data-launcher-role="action-group-label">{group.label}</div>
                      {group.items.map((action) => {
                        const absoluteIndex = filteredActions.findIndex((candidate) => candidate.id === action.id);
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={classes.actionRow}
                            data-launcher-role="action-row"
                            data-action-selected={absoluteIndex === actionSelectedIndex ? 'true' : 'false'}
                            tabIndex={-1}
                            onMouseDown={(event) => {
                              lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
                              pointerSelectionEnabledRef.current = true;
                              setIsPointerActive(true);
                              event.preventDefault();
                              actionInputRef.current?.focus({ preventScroll: true });
                            }}
                            onMouseMove={(event) => {
                              if (!enablePointerSelection(event.clientX, event.clientY)) {
                                return;
                              }

                              setActionSelectedIndex(absoluteIndex);
                            }}
                            onMouseEnter={() => updateActionSelectedIndexFromPointer(absoluteIndex)}
                            onClick={() => void invokeAction(action)}
                          >
                            <span className={classes.actionCopy} data-launcher-role="action-copy">
                              <span className={classes.actionLabel} data-launcher-role="action-label">{action.label}</span>
                              {action.feedbackLabel ? <span className={classes.actionRowHint} data-launcher-role="action-row-hint">{action.feedbackLabel}</span> : null}
                            </span>
                            <span className={classes.actionShortcuts} data-launcher-role="action-shortcuts">{renderShortcut(action.hint, `panel-${action.id}`)}</span>
                          </button>
                        );
                      })}
                    </section>
                  ))
                )}
              </div>
              <div className={classes.actionSearch} data-launcher-role="action-search">
                <input
                  aria-label="Action filter"
                  ref={actionInputRef}
                  data-launcher-role="action-search-input"
                  type="text"
                  value={actionQuery}
                  placeholder="Search actions..."
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setActionQuery(event.currentTarget.value)}
                />
              </div>
            </div>
          ) : null}

          <div className={classes.footerLeft} data-launcher-role="footer-left">
            <span className={`${classes.footerText} ${classes.footerTextStrong}`} data-launcher-role="footer-primary-text">{primaryAction?.label ?? 'Start typing or use recent results'}</span>
            <span className={classes.actionShortcuts} data-launcher-role="action-shortcuts">
              {primaryAction ? renderShortcut(primaryAction.hint, `primary-${primaryAction.id}`) : <span className={classes.kbd}>Enter</span>}
            </span>
          </div>

          <div className={classes.footerRight} data-launcher-role="footer-right">
            <button
              type="button"
              className={classes.actionsTrigger}
              data-launcher-role="settings-trigger"
              onMouseDown={(event) => {
                event.preventDefault();
                focusActiveInput();
              }}
              onClick={() => void launcherRuntime.openSettings()}
            >
              <span className={`${classes.footerText} ${classes.footerTextStrong}`} data-launcher-role="footer-button-text">Settings</span>
              {renderShortcut('Cmd+,', 'settings-trigger')}
            </button>
            <button
              type="button"
              className={classes.actionsTrigger}
              data-launcher-role="actions-trigger"
              disabled={!canOpenActions}
              onMouseDown={(event) => {
                event.preventDefault();
                focusActiveInput();
              }}
              onClick={() => {
                if (isActionsOpen) {
                  closeActions();
                  return;
                }

                openActions();
              }}
            >
              <span className={`${classes.footerText} ${classes.footerTextStrong}`} data-launcher-role="footer-button-text">Actions</span>
              {renderShortcut('Cmd+K', 'actions-trigger')}
            </button>
          </div>
        </footer>

        {feedback ? <div className={`${classes.feedback} ${feedback.tone === 'error' ? classes.feedbackError : ''}`} data-launcher-role="feedback">{feedback.message}</div> : null}
      </section>
    </div>
  );
}
