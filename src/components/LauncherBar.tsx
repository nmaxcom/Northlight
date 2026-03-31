import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  LauncherAction,
  LauncherPreview,
  LauncherResult,
  LauncherSettings,
  LauncherStatus,
  ResultKind
} from '../lib/search/types';
import { buildImmediateResults, buildResults } from '../lib/search/query';
import { launcherRuntime } from '../lib/search/runtime';
import classes from './LauncherBar.module.css';

const shortcutLabelMap: Record<string, string> = {
  Cmd: 'Cmd',
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

function renderShortcut(hint: string, prefix = '') {
  if (!hint.trim()) {
    return null;
  }

  return hint.split('+').map((part) => (
    <span key={`${prefix}${hint}-${part}`} className={classes.kbd}>
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

function groupActions(actions: LauncherAction[]) {
  const grouped = new Map<string, LauncherAction[]>();

  for (const action of actions) {
    const key = action.group ?? 'Actions';
    grouped.set(key, [...(grouped.get(key) ?? []), action]);
  }

  return Array.from(grouped.entries()).map(([label, items]) => ({ label, items }));
}

export function LauncherBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LauncherResult[]>(() => buildImmediateResults(''));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [actionQuery, setActionQuery] = useState('');
  const [actionSelectedIndex, setActionSelectedIndex] = useState(0);
  const [preview, setPreview] = useState<LauncherPreview | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [settings, setSettings] = useState<LauncherSettings>(launcherRuntime.getSettingsSnapshot());
  const [isPreviewOpen, setIsPreviewOpen] = useState(settings.quickLookStartsOpen);
  const [status, setStatus] = useState<LauncherStatus>({
    appVersion: '0.7.0',
    indexEntryCount: 0,
    indexReady: false,
    isRestoring: true,
    isRefreshing: false
  });
  const [iconUrls, setIconUrls] = useState<Record<string, string | null>>({});

  const selectedResult = results[selectedIndex];
  const filteredActions = useMemo(
    () => (selectedResult?.actions ?? []).filter((action) => actionMatches(action, actionQuery)),
    [actionQuery, selectedResult]
  );
  const groupedActions = useMemo(() => groupActions(filteredActions), [filteredActions]);
  const selectedAction = filteredActions[actionSelectedIndex];
  const primaryAction = isActionsOpen ? selectedAction : selectedResult?.actions[0];
  const bestMatch = settings.bestMatchEnabled ? results[0] : null;
  const listResults = settings.bestMatchEnabled ? results.slice(1) : results;
  const previewVisible = settings.previewEnabled && isPreviewOpen;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const actionInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  const visibleResultsCountRef = useRef(results.length);
  const previewRequestRef = useRef(0);
  const previewTargetRef = useRef<string | null>(null);
  const iconClassName = useCallback(
    (result: LauncherResult, extra = '') => {
      const hasNativeIcon = Boolean(result.path && iconUrls[result.path]);
      return [classes.resultIcon, hasNativeIcon ? classes.resultIconAsset : kindClass(result.kind), extra]
        .filter(Boolean)
        .join(' ');
    },
    [iconUrls]
  );

  const focusActiveInput = useCallback(() => {
    const target = isActionsOpen ? actionInputRef.current : inputRef.current;
    target?.focus({ preventScroll: true });
  }, [isActionsOpen]);

  const openActions = useCallback(() => {
    if (!selectedResult) {
      return;
    }

    setIsActionsOpen(true);
    setActionQuery('');
    setActionSelectedIndex(0);
  }, [selectedResult]);

  const closeActions = useCallback(() => {
    setIsActionsOpen(false);
    setActionQuery('');
    setActionSelectedIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  const showFeedback = useCallback((tone: 'success' | 'error', message: string) => {
    setFeedback({ tone, message });
    window.clearTimeout((showFeedback as typeof showFeedback & { timer?: number }).timer);
    (showFeedback as typeof showFeedback & { timer?: number }).timer = window.setTimeout(() => setFeedback(null), 1600);
  }, []);

  const invokeAction = useCallback(
    async (action: LauncherAction | undefined) => {
      if (!action) {
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
    [focusActiveInput, showFeedback]
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void window.launcher?.ready();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void launcherRuntime.getSettings().then((nextSettings) => {
      if (!cancelled) {
        setSettings(nextSettings);
        setIsPreviewOpen(nextSettings.quickLookStartsOpen);
      }
    });

    void launcherRuntime.getClipboardHistory();

    const unsubscribe = launcherRuntime.onSettingsChanged((nextSettings) => {
      setSettings(nextSettings);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    visibleResultsCountRef.current = results.length;
  }, [results.length]);

  useEffect(() => {
    return launcherRuntime.onIndexChanged(() => {
      if (!query.trim()) {
        setResults(buildImmediateResults(''));
        setIsResolving(false);
        return;
      }

      if (visibleResultsCountRef.current === 0) {
        setIsResolving(true);
      }

      const requestId = ++searchRequestRef.current;
      void buildResults(query).then((nextResults) => {
        if (requestId !== searchRequestRef.current) {
          return;
        }

        setResults(nextResults);
        setIsResolving(false);
      });
    });
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const refreshStatus = () => {
      void launcherRuntime.getStatus().then((nextStatus) => {
        if (cancelled) {
          return;
        }

        setStatus(nextStatus);

        if (nextStatus.isRefreshing || nextStatus.isRestoring) {
          timer = window.setTimeout(refreshStatus, 1500);
        }
      });
    };

    refreshStatus();
    const unsubscribe = launcherRuntime.onIndexChanged(() => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      refreshStatus();
    });

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    focusActiveInput();
  }, [focusActiveInput]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    setActionSelectedIndex(0);
  }, [actionQuery, selectedResult?.id]);

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
      closeActions();
    }
  }, [closeActions, isActionsOpen, selectedResult]);

  useEffect(() => {
    const immediateResults = buildImmediateResults(query);

    if (!query.trim()) {
      setResults(immediateResults);
      setIsResolving(false);
      return;
    }

    if (immediateResults.length > 0) {
      setResults(immediateResults);
      setIsResolving(false);
      return;
    }

    setIsResolving((current) => current || visibleResultsCountRef.current === 0);
  }, [query, settings]);

  useEffect(() => {
    let canceled = false;

    if (!query.trim()) {
      setIsResolving(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setIsResolving((current) => current || visibleResultsCountRef.current === 0);
    void buildResults(query).then((nextResults) => {
      if (!canceled && requestId === searchRequestRef.current) {
        setResults(nextResults);
        setIsResolving(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, [query, settings]);

  useEffect(() => {
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
      const requestId = ++previewRequestRef.current;
      void launcherRuntime.getPathPreview(selectedResult.path, selectedResult.kind).then((nextPreview) => {
        if (!cancelled && requestId === previewRequestRef.current && nextPreview) {
          setPreview(nextPreview);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    return () => {
      cancelled = true;
    };
  }, [previewVisible, selectedResult]);

  useEffect(() => {
    const iconPaths = Array.from(
      new Set(
        results
          .filter((result) => Boolean(result.path) && (result.source === 'local' || result.source === 'alias'))
          .map((result) => result.path as string)
          .filter((path) => !(path in iconUrls))
      )
    );

    if (iconPaths.length === 0) {
      return;
    }

    let cancelled = false;

    void launcherRuntime.getPathIcons(iconPaths).then((iconMap) => {
      if (cancelled) {
        return;
      }

      setIconUrls((current) => {
        const next = { ...current };
        for (const [path, icon] of Object.entries(iconMap)) {
          next[path] = icon;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [iconUrls, results]);

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        focusActiveInput();
        return;
      }

      if (event.key === ',' && event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        await launcherRuntime.openSettings();
        return;
      }

      if (event.key.toLowerCase() === 'k' && event.metaKey && !event.altKey && !event.shiftKey) {
        if (!selectedResult) {
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

      if (isActionsOpen) {
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

        if (candidate.hint === 'Cmd+Backspace') {
          return event.key === 'Backspace' && event.metaKey;
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
    filteredActions.length,
    focusActiveInput,
    invokeAction,
    isActionsOpen,
    openActions,
    query,
    results.length,
    selectedAction,
    selectedResult,
  ]);

  return (
    <div
      className={classes.window}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement;
        const activeInput = isActionsOpen ? actionInputRef.current : inputRef.current;

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

        if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
          return;
        }

        event.preventDefault();
        focusActiveInput();
      }}
    >
      <section className={classes.shell}>
        <header className={classes.header}>
          <div className={classes.brand}>Northlight</div>
          <div className={classes.status}>
            <div className={classes.badge}>v{status.appVersion}</div>
            <div className={classes.badge}>{status.indexEntryCount.toLocaleString()} indexed</div>
            <div className={`${classes.badge} ${classes.readyBadge}`}>
              {status.isRestoring ? 'Restoring' : status.isRefreshing ? 'Refreshing' : status.indexReady ? 'Ready' : 'Cold'}
            </div>
          </div>
        </header>

        <section className={classes.search}>
          <div className={classes.searchIcon}>⌕</div>
          <input
            aria-label="Launcher query"
            ref={inputRef}
            className={classes.searchInput}
            type="text"
            value={query}
            placeholder="Search files, folders, apps, or type 30mph to kmh"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <div className={classes.searchArrow}>→</div>
        </section>

        <section className={`${classes.body} ${previewVisible ? classes.bodyWithPreview : ''}`}>
          <div className={classes.resultsColumn}>
            {bestMatch ? (
              <button
                type="button"
                className={`${classes.bestMatch} ${selectedIndex === 0 ? classes.bestMatchSelected : ''}`}
                data-selected={selectedIndex === 0 ? 'true' : 'false'}
                onMouseEnter={() => setSelectedIndex(0)}
                onClick={() => void invokeAction(bestMatch.actions[0])}
              >
                <div className={iconClassName(bestMatch, classes.bestMatchIcon)}>
                  {bestMatch.path && iconUrls[bestMatch.path] ? (
                    <img className={classes.resultIconImage} src={iconUrls[bestMatch.path] ?? ''} alt="" />
                  ) : (
                    iconGlyph(bestMatch.kind)
                  )}
                </div>
                <div className={classes.bestMatchCopy}>
                  <div className={classes.bestMatchEyebrow}>Best Match</div>
                  <div className={classes.bestMatchTitle}>{bestMatch.title}</div>
                  <div className={classes.bestMatchSubtitle}>{bestMatch.subtitle}</div>
                  <div className={classes.inlineActions}>
                    {bestMatch.actions.slice(0, 3).map((action) => (
                      <span key={action.id} className={classes.inlineActionChip}>
                        <span>{action.label}</span>
                        {action.hint ? <span className={classes.inlineActionHint}>{action.hint}</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={classes.resultKind}>{kindLabel(bestMatch)}</div>
              </button>
            ) : null}

            <section
              className={classes.results}
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
                <section className={classes.emptyState}>
                  <div>
                    <h2>{query.trim() ? (isResolving ? 'Searching...' : 'No matching result') : 'Start from recent context'}</h2>
                    <p>
                      {query.trim()
                        ? isResolving
                          ? 'Hold for a moment while local results resolve.'
                          : 'Try a broader filename, alias, snippet trigger, folder name, app, or deterministic conversion.'
                        : 'Recent launcher choices, clipboard items, and configured snippets can appear here as you build history.'}
                    </p>
                  </div>
                </section>
              ) : (
                listResults.map((result, index) => {
                  const absoluteIndex = settings.bestMatchEnabled ? index + 1 : index;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      className={classes.result}
                      data-selected={absoluteIndex === selectedIndex ? 'true' : 'false'}
                      tabIndex={-1}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        focusActiveInput();
                      }}
                      onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                      onClick={() => void invokeAction(result.actions[0])}
                    >
                      <div className={iconClassName(result)}>
                        {result.path && iconUrls[result.path] ? (
                          <img className={classes.resultIconImage} src={iconUrls[result.path] ?? ''} alt="" />
                        ) : (
                          iconGlyph(result.kind)
                        )}
                      </div>
                      <div className={classes.resultCopy}>
                        <div className={classes.resultTitle}>{result.title}</div>
                        <div className={classes.resultSubtitle}>{result.subtitle}</div>
                      </div>
                      <div className={classes.resultKind}>{kindLabel(result)}</div>
                    </button>
                  );
                })
              )}
            </section>
          </div>

          {previewVisible ? (
            <aside className={classes.previewPane}>
              <div className={classes.previewHeader}>
                <div className={classes.previewEyebrow}>Preview</div>
              </div>
              {preview ? (
                <div className={classes.previewContent}>
                  <div className={classes.previewTitle}>{preview.title}</div>
                  <div className={classes.previewSubtitle}>{preview.subtitle}</div>
                  {preview.mediaUrl ? (
                    <div className={classes.previewMediaFrame}>
                      <img className={classes.previewMediaImage} src={preview.mediaUrl} alt={preview.mediaAlt ?? ''} />
                    </div>
                  ) : null}
                  {preview.body ? <pre className={classes.previewBody}>{preview.body}</pre> : null}
                  <div className={classes.previewMeta}>
                    {preview.sections.map((section) => (
                      <div key={`${section.label}-${section.value}`} className={classes.previewMetaRow}>
                        <span className={classes.previewMetaLabel}>{section.label}</span>
                        <span className={classes.previewMetaValue}>{section.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={classes.previewPlaceholder}>Select a result to inspect it here.</div>
              )}
            </aside>
          ) : null}
        </section>

        <footer className={classes.footer}>
          {isActionsOpen ? (
            <div className={classes.actionsPanel} data-actions-panel="true">
              <div className={classes.actionHeader}>
                <div className={classes.actionHeaderTitle}>{selectedResult?.title ?? 'Actions'}</div>
                <div className={classes.actionHeaderSubtitle}>{selectedResult ? kindLabel(selectedResult) : 'Current result'}</div>
              </div>
              <div className={classes.actionList} ref={actionsRef}>
                {groupedActions.length === 0 ? (
                  <div className={classes.actionEmpty}>No matching actions</div>
                ) : (
                  groupedActions.map((group) => (
                    <section key={group.label} className={classes.actionGroup}>
                      <div className={classes.actionGroupLabel}>{group.label}</div>
                      {group.items.map((action) => {
                        const absoluteIndex = filteredActions.findIndex((candidate) => candidate.id === action.id);
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={classes.actionRow}
                            data-action-selected={absoluteIndex === actionSelectedIndex ? 'true' : 'false'}
                            tabIndex={-1}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              actionInputRef.current?.focus({ preventScroll: true });
                            }}
                            onMouseEnter={() => setActionSelectedIndex(absoluteIndex)}
                            onClick={() => void invokeAction(action)}
                          >
                            <span className={classes.actionCopy}>
                              <span className={classes.actionLabel}>{action.label}</span>
                              {action.feedbackLabel ? <span className={classes.actionRowHint}>{action.feedbackLabel}</span> : null}
                            </span>
                            <span className={classes.actionShortcuts}>{renderShortcut(action.hint, `panel-${action.id}`)}</span>
                          </button>
                        );
                      })}
                    </section>
                  ))
                )}
              </div>
              <div className={classes.actionSearch}>
                <input
                  aria-label="Action filter"
                  ref={actionInputRef}
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

          <div className={classes.footerLeft}>
            <span className={`${classes.footerText} ${classes.footerTextStrong}`}>{primaryAction?.label ?? 'Start typing or use recent results'}</span>
            <span className={classes.actionShortcuts}>
              {primaryAction ? renderShortcut(primaryAction.hint, `primary-${primaryAction.id}`) : <span className={classes.kbd}>Enter</span>}
            </span>
          </div>

          <div className={classes.footerRight}>
            <button
              type="button"
              className={classes.actionsTrigger}
              onMouseDown={(event) => {
                event.preventDefault();
                focusActiveInput();
              }}
              onClick={() => void launcherRuntime.openSettings()}
            >
              <span className={`${classes.footerText} ${classes.footerTextStrong}`}>Settings</span>
              {renderShortcut('Cmd+,', 'settings-trigger')}
            </button>
            <button
              type="button"
              className={classes.actionsTrigger}
              disabled={!selectedResult}
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
              <span className={`${classes.footerText} ${classes.footerTextStrong}`}>Actions</span>
              {renderShortcut('Cmd+K', 'actions-trigger')}
            </button>
          </div>
        </footer>

        {feedback ? <div className={`${classes.feedback} ${feedback.tone === 'error' ? classes.feedbackError : ''}`}>{feedback.message}</div> : null}
      </section>
    </div>
  );
}
