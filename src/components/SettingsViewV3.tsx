import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { shortcutTokens } from '../lib/shortcuts';
import type {
  AliasEntry,
  LauncherSettings,
  ScopeEntry,
  ScopePerformanceInsight,
  SearchPerformanceSummary,
  SnippetEntry
} from '../lib/search/types';
import { launcherRuntime } from '../lib/search/runtime';
import classes from './SettingsViewV3.module.css';

type ValidationState = {
  aliasTriggers: Set<string>;
  snippetTriggers: Set<string>;
  hasErrors: boolean;
  messages: string[];
};

function shortcutFromEvent(event: KeyboardEvent<HTMLInputElement>) {
  const key = event.key;

  if (['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
    return null;
  }

  const parts: string[] = [];
  if (event.metaKey) {
    parts.push('CommandOrControl');
  } else if (event.ctrlKey) {
    parts.push('Control');
  }
  if (event.altKey) {
    parts.push('Alt');
  }
  if (event.shiftKey) {
    parts.push('Shift');
  }

  let mainKey = '';

  if (key === ' ') {
    mainKey = 'Space';
  } else if (key === 'Escape') {
    mainKey = 'Escape';
  } else if (key === 'Backspace') {
    mainKey = 'Backspace';
  } else if (key === 'Delete') {
    mainKey = 'Delete';
  } else if (key === 'Enter') {
    mainKey = 'Enter';
  } else if (key === ',') {
    mainKey = ',';
  } else if (key.length === 1) {
    mainKey = key.toUpperCase();
  } else {
    mainKey = key.charAt(0).toUpperCase() + key.slice(1);
  }

  if (!parts.length && !mainKey) {
    return null;
  }

  return [...parts, mainKey].filter(Boolean).join('+');
}

function cloneSettings(settings: LauncherSettings): LauncherSettings {
  return JSON.parse(JSON.stringify(settings)) as LauncherSettings;
}

function createAlias(): AliasEntry {
  return {
    id: `alias-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trigger: '',
    targetType: 'path',
    target: '',
    note: ''
  };
}

function createSnippet(): SnippetEntry {
  return {
    id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trigger: '',
    content: '',
    note: ''
  };
}

function createScope(): ScopeEntry {
  return {
    id: `scope-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    path: '',
    enabled: true,
    hot: false
  };
}

function inferHomePath(scopes: ScopeEntry[]) {
  const match = scopes
    .map((scope) => scope.path.match(/^\/Users\/[^/]+/))
    .find((candidate): candidate is RegExpMatchArray => Boolean(candidate));

  return match?.[0] ?? '/Users';
}

function validate(settings: LauncherSettings): ValidationState {
  const aliasTriggers = new Set<string>();
  const snippetTriggers = new Set<string>();
  const messages = new Set<string>();

  for (const alias of settings.aliases) {
    const trigger = alias.trigger.trim().toLowerCase();
    if (!trigger) {
      messages.add('All aliases need a trigger.');
      continue;
    }

    if (/\s/.test(alias.trigger.trim())) {
      messages.add(`Alias triggers cannot contain spaces: ${alias.trigger.trim()}`);
    }

    if (aliasTriggers.has(trigger)) {
      messages.add(`Duplicate alias trigger: ${trigger}`);
    }
    aliasTriggers.add(trigger);
  }

  for (const snippet of settings.snippets) {
    const trigger = snippet.trigger.trim().toLowerCase();
    if (!trigger || !snippet.content.trim()) {
      messages.add('All snippets need a trigger and content.');
      continue;
    }

    if (snippetTriggers.has(trigger) || aliasTriggers.has(trigger)) {
      messages.add(`Snippet trigger conflicts with an existing trigger: ${trigger}`);
    }
    snippetTriggers.add(trigger);
  }

  for (const scope of settings.scopes) {
    if (!scope.path.trim()) {
      messages.add('Scopes cannot be empty.');
    }
  }

  return {
    aliasTriggers,
    snippetTriggers,
    hasErrors: messages.size > 0,
    messages: Array.from(messages)
  };
}

export function SettingsViewV3() {
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [searchPerformance, setSearchPerformance] = useState<SearchPerformanceSummary | null>(null);
  const [scopeInsights, setScopeInsights] = useState<ScopePerformanceInsight[]>([]);
  const [effectiveShortcut, setEffectiveShortcut] = useState('');
  const [saveState, setSaveState] = useState('Loading settings...');
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturingShortcut, setIsCapturingShortcut] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'scopes'>('overview');
  const [isAddingScope, setIsAddingScope] = useState(false);
  const [newScopePath, setNewScopePath] = useState('');
  const [scopeFeedback, setScopeFeedback] = useState<string | null>(null);
  const scopeListRef = useRef<HTMLDivElement | null>(null);
  const newScopeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    void launcherRuntime.getSettings().then((nextSettings) => {
      if (!cancelled) {
        setSettings(cloneSettings(nextSettings));
        setSaveState('Ready');
      }
    });
    void launcherRuntime.getSearchPerformance().then((nextPerformance) => {
      if (!cancelled) {
        setSearchPerformance(nextPerformance.summary);
      }
    });
    void launcherRuntime.getScopeInsights().then((nextInsights) => {
      if (!cancelled) {
        setScopeInsights(nextInsights);
      }
    });
    void launcherRuntime.getEffectiveShortcut().then((nextShortcut) => {
      if (!cancelled) {
        setEffectiveShortcut(nextShortcut);
      }
    });

    const unsubscribe = launcherRuntime.onSettingsChanged((nextSettings) => {
      setSettings(cloneSettings(nextSettings));
      setSaveState('Updated from another window');
      void launcherRuntime.getScopeInsights().then((nextInsights) => {
        if (!cancelled) {
          setScopeInsights(nextInsights);
        }
      });
      void launcherRuntime.getSearchPerformance().then((nextPerformance) => {
        if (!cancelled) {
          setSearchPerformance(nextPerformance.summary);
        }
      });
      void launcherRuntime.getEffectiveShortcut().then((nextShortcut) => {
        if (!cancelled) {
          setEffectiveShortcut(nextShortcut);
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const validation = useMemo(() => (settings ? validate(settings) : { hasErrors: false, messages: [], aliasTriggers: new Set(), snippetTriggers: new Set() }), [settings]);

  if (!settings) {
    return <div className={classes.page}>Loading…</div>;
  }

  const updateSettings = (updater: (current: LauncherSettings) => LauncherSettings) => {
    setSettings((current) => (current ? updater(cloneSettings(current)) : current));
    setSaveState('Unsaved changes');
  };

  const revealNewestScope = () => {
    window.requestAnimationFrame(() => {
      const container = scopeListRef.current;
      const lastScope = container?.lastElementChild as HTMLElement | null;
      lastScope?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const pathField = lastScope?.querySelector<HTMLInputElement>('input[data-scope-path="true"]');
      pathField?.focus();
      pathField?.select();
    });
  };

  const showScopeFeedback = (message: string) => {
    setScopeFeedback(message);
    window.clearTimeout((showScopeFeedback as typeof showScopeFeedback & { timer?: number }).timer);
    (showScopeFeedback as typeof showScopeFeedback & { timer?: number }).timer = window.setTimeout(() => setScopeFeedback(null), 2400);
  };

  const save = async () => {
    if (validation.hasErrors) {
      setSaveState('Fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    setSaveState('Saving…');

    try {
      const nextSettings = await launcherRuntime.saveSettings(settings);
      const nextEffectiveShortcut = await launcherRuntime.getEffectiveShortcut();
      const nextInsights = await launcherRuntime.getScopeInsights();
      const nextPerformance = await launcherRuntime.getSearchPerformance();
      setSettings(cloneSettings(nextSettings));
      setEffectiveShortcut(nextEffectiveShortcut);
      setScopeInsights(nextInsights);
      setSearchPerformance(nextPerformance.summary);
      setSaveState('Saved');
    } finally {
      setIsSaving(false);
    }
  };

  const displayedShortcut = settings.launcherHotkey || effectiveShortcut;
  const displayTokens = shortcutTokens(displayedShortcut);
  const usesSessionFallback = !settings.launcherHotkey && Boolean(effectiveShortcut);
  const homePath = inferHomePath(settings.scopes);
  const scopePresets = [
    {
      id: 'library',
      label: 'Add ~/Library',
      path: `${homePath}/Library`,
      tone: 'balanced',
      note: 'Best next step for app data, preferences, and support files.',
      cost: 'Medium cost'
    },
    {
      id: 'home',
      label: 'Add Home',
      path: homePath,
      tone: 'warm',
      note: 'Broader personal search with more noise from Downloads, Library, and hidden files.',
      cost: 'High cost'
    },
    {
      id: 'root',
      label: 'Add /',
      path: '/',
      tone: 'danger',
      note: 'Widest coverage, but the slowest and noisiest option. Use only if you really want whole-disk search.',
      cost: 'Highest cost'
    }
  ] as const;

  const addScopePath = (path: string) => {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return false;
    }

    let added = false;
    updateSettings((current) => {
      if (current.scopes.some((scope) => scope.path === trimmedPath)) {
        return current;
      }

      added = true;

      return {
        ...current,
        scopes: [
          ...current.scopes,
          {
            ...createScope(),
            path: trimmedPath
          }
        ]
      };
    });

    if (added) {
      showScopeFeedback(`Added ${trimmedPath}. The new scope is shown at the bottom of the list.`);
      revealNewestScope();
      return true;
    }

    showScopeFeedback(`${trimmedPath} is already in your scope list.`);
    return false;
  };

  const addCustomScope = () => {
    if (!addScopePath(newScopePath)) {
      if (!newScopePath.trim()) {
        newScopeInputRef.current?.focus();
      }
      return;
    }

    setNewScopePath('');
    setIsAddingScope(false);
  };

  const enabledScopes = settings.scopes.filter((scope) => scope.enabled).length;
  const statusTone = validation.hasErrors ? 'error' : saveState === 'Saved' || saveState === 'Ready' ? 'ready' : 'pending';
  const hasUnsavedChanges = saveState === 'Unsaved changes';
  const insightById = new Map(scopeInsights.map((insight) => [insight.id, insight]));
  const formatMs = (value: number | null) => (typeof value === 'number' ? `${Math.round(value)} ms` : 'No data yet');
  const formatRate = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <main className={classes.page}>
      <div className={classes.shell}>
        <div className={classes.titlebar} data-settings-role="titlebar" aria-hidden="true" />
        <header className={classes.header} data-settings-role="header">
          <div className={classes.headerCopy} data-settings-role="header-copy">
            <div className={classes.title}>Settings</div>
          </div>
          <div className={classes.actions} data-settings-role="header-actions">
            <button className={classes.secondaryButton} data-settings-role="secondary-button" type="button" onClick={() => setSettings(cloneSettings(launcherRuntime.getSettingsSnapshot()))}>
              Revert
            </button>
            <button className={classes.button} data-settings-role="primary-button" type="button" disabled={isSaving || (!hasUnsavedChanges && !validation.hasErrors)} onClick={() => void save()}>
              {isSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </header>

        <div className={classes.body}>
          <nav className={classes.sidebarNav} data-settings-role="tabs" aria-label="Settings sections" role="tablist">
            {[
              ['overview', 'Overview'],
              ['content', 'Aliases & Snippets'],
              ['scopes', 'Scopes & Status']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${classes.tab} ${activeTab === id ? classes.tabActive : ''}`}
                data-settings-role="tab"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`settings-panel-${id}`}
                onClick={() => setActiveTab(id as 'overview' | 'content' | 'scopes')}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className={classes.content} data-settings-role="content">
          <div
            id={`settings-panel-${activeTab}`}
            className={`${classes.grid} ${activeTab === 'scopes' ? classes.gridWithSidebar : classes.gridSingle}`}
            data-settings-role="panel"
            role="tabpanel"
          >
            <div className={classes.leftColumn}>
              {activeTab === 'overview' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Search</div>
                <div className={classes.toggleRow}>
                  {[
                    ['appFirstEnabled', 'Prefer apps over files', 'Boost app candidates when names compete with files.'],
                    ['previewEnabled', 'Result preview', 'Show the preview pane in the launcher.'],
                    ['quickLookStartsOpen', 'Open preview by default', 'Expand preview when the launcher opens.'],
                    ['clipboardHistoryEnabled', 'Clipboard history', 'Index recent clipboard text for search.'],
                    ['snippetsEnabled', 'Text snippets', 'Include saved snippets in results.']
                  ].map(([key, label, help]) => (
                    <label key={key} className={classes.toggleCompact} title={help}>
                      <span className={classes.toggleLabel}>{label}</span>
                      <input
                        type="checkbox"
                        aria-label={`${label}. ${help}`}
                        checked={Boolean(settings[key as keyof LauncherSettings])}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          updateSettings((current) => ({
                            ...current,
                            [key]: checked
                          }));
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div className={classes.fieldGrid}>
                  <label className={classes.field}>
                    <span className={classes.label}>Clipboard items</span>
                    <input
                      className={classes.input}
                      type="number"
                      min={5}
                      max={50}
                      value={settings.maxClipboardItems}
                      onChange={(event) => {
                        const value = Number(event.currentTarget.value);
                        updateSettings((current) => ({
                          ...current,
                          maxClipboardItems: value || current.maxClipboardItems
                        }));
                      }}
                    />
                  </label>
                </div>
              </section>
              ) : null}

              {activeTab === 'overview' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Launcher</div>
                <div className={classes.fieldGrid}>
                  <label className={classes.field}>
                    <span className={classes.label}>Launcher shortcut</span>
                    <div className={classes.shortcutField}>
                      <button
                        aria-label="Launcher shortcut"
                        className={`${classes.shortcutButton} ${isCapturingShortcut ? classes.shortcutButtonCapturing : ''}`}
                        type="button"
                        onFocus={() => setIsCapturingShortcut(true)}
                        onBlur={() => setIsCapturingShortcut(false)}
                        onKeyDown={(event) => {
                          if (event.key === 'Tab') {
                            return;
                          }

                          event.preventDefault();

                          if (!event.metaKey && !event.ctrlKey && !event.altKey && ['Backspace', 'Delete'].includes(event.key)) {
                            updateSettings((current) => ({
                              ...current,
                              launcherHotkey: ''
                            }));
                            setIsCapturingShortcut(false);
                            event.currentTarget.blur();
                            return;
                          }

                          if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key === 'Escape') {
                            setIsCapturingShortcut(false);
                            event.currentTarget.blur();
                            return;
                          }

                          const nextShortcut = shortcutFromEvent(event);
                          if (!nextShortcut) {
                            return;
                          }

                          updateSettings((current) => ({
                            ...current,
                            launcherHotkey: nextShortcut
                          }));
                          setIsCapturingShortcut(false);
                          event.currentTarget.blur();
                        }}
                      >
                        {isCapturingShortcut ? (
                          <span className={classes.shortcutPlaceholder}>Press a shortcut…</span>
                        ) : displayTokens.length > 0 ? (
                          <span className={classes.shortcutTokens} aria-hidden="true">
                            {displayTokens.map((token) => (
                              <span key={token.id} className={classes.shortcutToken}>
                                <span className={classes.shortcutTokenSymbol}>{token.symbol ?? token.label}</span>
                                {token.symbol ? <span className={classes.shortcutTokenLabel}>{token.label}</span> : null}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className={classes.shortcutPlaceholder}>Disabled</span>
                        )}
                      </button>
                      <button
                        className={classes.secondaryButton}
                        type="button"
                        onClick={() =>
                          updateSettings((current) => ({
                            ...current,
                            launcherHotkey: ''
                          }))
                        }
                      >
                        Clear
                      </button>
                    </div>
                    {usesSessionFallback ? (
                      <span className={classes.shortcutHint}>Using the dev-session fallback shortcut until you save a new one.</span>
                    ) : null}
                  </label>
                </div>
              </section>
              ) : null}

              {activeTab === 'content' ? (
              <section className={classes.card}>
                <div className={classes.sectionHeader}>
                  <div className={classes.cardTitle}>Aliases</div>
                  <button
                    className={classes.secondaryButton}
                    type="button"
                    onClick={() =>
                      updateSettings((current) => ({
                        ...current,
                        aliases: [...current.aliases, createAlias()]
                      }))
                    }
                  >
                    Add Alias
                  </button>
                </div>
                <div className={classes.list}>
                  {settings.aliases.map((alias, index) => (
                    <div key={alias.id} className={classes.row}>
                      <div className={classes.rowHeader}>
                        <div className={classes.rowTitle}>Alias {index + 1}</div>
                        <button
                          className={classes.iconButton}
                          type="button"
                          onClick={() =>
                            updateSettings((current) => ({
                              ...current,
                              aliases: current.aliases.filter((entry) => entry.id !== alias.id)
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                      <div className={classes.fieldGrid}>
                        <label className={classes.field}>
                          <span className={classes.label}>Trigger</span>
                          <input
                            className={classes.input}
                            value={alias.trigger}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, trigger: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                        <label className={classes.field}>
                          <span className={classes.label}>Target type</span>
                          <select
                            className={classes.select}
                            value={alias.targetType}
                            onChange={(event) => {
                              const value = event.currentTarget.value as AliasEntry['targetType'];
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, targetType: value } : entry
                                )
                              }));
                            }}
                          >
                            <option value="path">Path</option>
                            <option value="snippet">Snippet</option>
                            <option value="settings">Settings</option>
                          </select>
                        </label>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Target</span>
                          <input
                            className={classes.input}
                            value={alias.target}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, target: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Note</span>
                          <input
                            className={classes.input}
                            value={alias.note ?? ''}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, note: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              ) : null}

              {activeTab === 'content' ? (
              <section className={classes.card}>
                <div className={classes.sectionHeader}>
                  <div className={classes.cardTitle}>Snippets</div>
                  <button
                    className={classes.secondaryButton}
                    type="button"
                    onClick={() =>
                      updateSettings((current) => ({
                        ...current,
                        snippets: [...current.snippets, createSnippet()]
                      }))
                    }
                  >
                    Add Snippet
                  </button>
                </div>
                <div className={classes.list}>
                  {settings.snippets.map((snippet, index) => (
                    <div key={snippet.id} className={classes.row}>
                      <div className={classes.rowHeader}>
                        <div className={classes.rowTitle}>Snippet {index + 1}</div>
                        <button
                          className={classes.iconButton}
                          type="button"
                          onClick={() =>
                            updateSettings((current) => ({
                              ...current,
                              snippets: current.snippets.filter((entry) => entry.id !== snippet.id)
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                      <div className={classes.fieldGrid}>
                        <label className={classes.field}>
                          <span className={classes.label}>Trigger</span>
                          <input
                            className={classes.input}
                            value={snippet.trigger}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, trigger: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                        <label className={classes.field}>
                          <span className={classes.label}>Note</span>
                          <input
                            className={classes.input}
                            value={snippet.note ?? ''}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, note: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Content</span>
                          <textarea
                            className={classes.textarea}
                            value={snippet.content}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, content: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              ) : null}

              {activeTab === 'scopes' ? (
              <section className={classes.card}>
                <div className={classes.sectionHeader}>
                  <div className={classes.scopeHeaderRow}>
                    <div className={classes.cardTitle}>Scopes</div>
                    <div className={classes.scopeMetrics}>
                      <div className={classes.scopeMetric}>
                        <span className={classes.scopeMetricLabel}>On</span>
                        <span className={classes.scopeMetricValue}>{enabledScopes}</span>
                      </div>
                      <div className={classes.scopeMetric}>
                        <span className={classes.scopeMetricLabel}>FS watch</span>
                        <span className={classes.scopeMetricValue}>{settings.watchFsChangesEnabled ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className={classes.scopeActionButton}
                    type="button"
                    aria-label="Add scope"
                    onClick={() => {
                      setIsAddingScope(true);
                      setScopeFeedback(null);
                      window.requestAnimationFrame(() => newScopeInputRef.current?.focus());
                    }}
                  >
                    Add
                  </button>
                </div>

                <div className={classes.scopeToolbar}>
                  <div className={classes.scopePresetRow}>
                    {scopePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={`${preset.note} ${preset.cost}.`}
                        className={`${classes.scopePresetButton} ${preset.tone === 'danger' ? classes.scopePresetButtonDanger : preset.tone === 'warm' ? classes.scopePresetButtonWarm : ''}`}
                        onClick={() => addScopePath(preset.path)}
                      >
                        <span className={classes.scopePresetButtonLabel}>
                          {preset.id === 'library' ? '~/Library' : preset.id === 'home' ? 'Home' : 'Entire disk'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {isAddingScope ? (
                  <div className={classes.scopeComposer}>
                    <div className={classes.scopeComposerHeader}>
                      <div className={classes.scopeComposerTitle}>Custom path</div>
                      <button className={classes.scopeComposerCancel} type="button" onClick={() => {
                        setIsAddingScope(false);
                        setNewScopePath('');
                      }}>
                        Cancel
                      </button>
                    </div>
                    <div className={classes.scopeComposerRow}>
                      <input
                        ref={newScopeInputRef}
                        className={classes.input}
                        placeholder="/Users/you/Library"
                        value={newScopePath}
                        onChange={(event) => setNewScopePath(event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addCustomScope();
                          }
                        }}
                      />
                      <button className={classes.scopeComposerAdd} type="button" onClick={addCustomScope}>
                        Add Path
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className={classes.toggleRow}>
                  <label
                    className={classes.toggleCompact}
                    title="Refresh search results sooner when files change under enabled scopes."
                  >
                    <span className={classes.toggleLabel}>Watch filesystem for changes</span>
                    <input
                      type="checkbox"
                      aria-label="Watch filesystem for changes. Refresh search results sooner when files change under enabled scopes."
                      checked={settings.watchFsChangesEnabled}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        updateSettings((current) => ({
                          ...current,
                          watchFsChangesEnabled: checked
                        }));
                      }}
                    />
                  </label>
                </div>

                {scopeFeedback ? <div className={classes.scopeFeedback}>{scopeFeedback}</div> : null}

                <div className={classes.scopeList} ref={scopeListRef}>
                  {settings.scopes.map((scope, index) => {
                    const insight = insightById.get(scope.id);
                    const costClass =
                      insight?.cost === 'high' ? classes.scopeCostHigh : insight?.cost === 'medium' ? classes.scopeCostMedium : classes.scopeCostLow;

                    return (
                    <div key={scope.id} className={classes.scopeRow}>
                      <div className={classes.rowHeader}>
                        <div className={classes.rowTitle} title={scope.path || 'Empty path'}>
                          {scope.path.trim() ? scope.path : `Scope ${index + 1}`}
                        </div>
                        <button
                          className={classes.iconButton}
                          type="button"
                          onClick={() =>
                            updateSettings((current) => ({
                              ...current,
                              scopes: current.scopes.filter((entry) => entry.id !== scope.id)
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                      <div className={`${classes.fieldGrid} ${classes.scopeRowGrid}`}>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Path</span>
                          <input
                            data-scope-path="true"
                            className={classes.input}
                            value={scope.path}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              updateSettings((current) => ({
                                ...current,
                                scopes: current.scopes.map((entry) =>
                                  entry.id === scope.id ? { ...entry, path: value } : entry
                                )
                              }));
                            }}
                          />
                        </label>
                        <div className={classes.scopeTogglePair}>
                          <label
                            className={classes.scopeToggleCompact}
                            title="Ignored by search while disabled; path stays saved."
                          >
                            <span className={classes.toggleLabel}>On</span>
                            <input
                              type="checkbox"
                              aria-label="Scope enabled. When off, this path is ignored by search but kept in the list."
                              checked={scope.enabled}
                              onChange={(event) => {
                                const checked = event.currentTarget.checked;
                                updateSettings((current) => ({
                                  ...current,
                                  scopes: current.scopes.map((entry) =>
                                    entry.id === scope.id ? { ...entry, enabled: checked } : entry
                                  )
                                }));
                              }}
                            />
                          </label>
                          <label
                            className={classes.scopeToggleCompact}
                            title="Search this path in the fast tier first (e.g. Desktop, Applications)."
                          >
                            <span className={classes.toggleLabel}>Fast</span>
                            <input
                              type="checkbox"
                              aria-label="Fast path. Search this scope in the low-latency tier before deep search finishes."
                              checked={scope.hot}
                              onChange={(event) => {
                                const checked = event.currentTarget.checked;
                                updateSettings((current) => ({
                                  ...current,
                                  scopes: current.scopes.map((entry) =>
                                    entry.id === scope.id ? { ...entry, hot: checked } : entry
                                  )
                                }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      {insight ? (
                        <div className={classes.scopeInsightRow} title={insight.recommendation}>
                          <span className={`${classes.scopeCostPill} ${costClass}`}>
                            {insight.cost.toUpperCase()}
                          </span>
                          <span className={classes.scopeInsightMeta}>
                            {insight.estimatedItems.toLocaleString()} items
                          </span>
                          <span className={classes.scopeInsightText}>{insight.recommendation}</span>
                        </div>
                      ) : null}
                    </div>
                  );})}
                </div>
              </section>
              ) : null}
            </div>

            <div className={classes.rightColumn}>
              {activeTab === 'scopes' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Status</div>
                <div className={classes.statusRow}>
                  <span className={`${classes.statusPill} ${statusTone === 'ready' ? classes.statusPillReady : statusTone === 'error' ? classes.statusPillError : classes.statusPillPending}`}>
                    {saveState}
                  </span>
                </div>
                {validation.hasErrors ? (
                  <ul className={classes.errorList}>
                    {validation.messages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
              ) : null}

              {activeTab === 'scopes' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Latency (local samples)</div>
                <div className={classes.performanceGrid}>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Samples</span>
                    <span className={classes.performanceValue}>{searchPerformance?.sampleCount ?? 0}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Hot Avg</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.hotAverageMs ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Hot P95</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.hotP95Ms ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Deep Avg</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.deepAverageMs ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Deep P95</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.deepP95Ms ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>First Visible</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.firstVisibleAverageMs ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>First Useful</span>
                    <span className={classes.performanceValue}>{formatMs(searchPerformance?.firstUsefulAverageMs ?? null)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Top Replacements</span>
                    <span className={classes.performanceValue}>{formatRate(searchPerformance?.topReplacementRate ?? 0)}</span>
                  </div>
                  <div className={classes.performanceMetric}>
                    <span className={classes.performanceLabel}>Clipboard Flashes</span>
                    <span className={classes.performanceValue}>{formatRate(searchPerformance?.clipboardFirstFlashRate ?? 0)}</span>
                  </div>
                </div>
              </section>
              ) : null}

              {activeTab === 'scopes' ? (
              <details className={classes.reference}>
                <summary>Scope reference</summary>
                <ul className={classes.hintList}>
                  <li>Fast path: low-latency tier before deep search finishes.</li>
                  <li>Use fast paths for apps, Desktop-like folders, and daily workspaces.</li>
                  <li>~/Library is the usual expansion for app support and preferences.</li>
                  <li>Disabled scopes stay saved but do not feed search.</li>
                  <li>Avoid fast path on huge trees unless you need that speed daily.</li>
                  <li>Broader scopes add hydrate time and noise.</li>
                  <li>FS watch refreshes stale results faster; broad scope sets stay busier.</li>
                  <li>Entire disk (/) is the widest, slowest option.</li>
                </ul>
              </details>
              ) : null}
            </div>
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}
