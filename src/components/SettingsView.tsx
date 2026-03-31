import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { shortcutTokens } from '../lib/shortcuts';
import type { AliasEntry, LauncherSettings, ScopeEntry, SnippetEntry } from '../lib/search/types';
import { launcherRuntime } from '../lib/search/runtime';
import classes from './SettingsView.module.css';

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
    enabled: true
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

export function SettingsView() {
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [effectiveShortcut, setEffectiveShortcut] = useState('');
  const [saveState, setSaveState] = useState('Loading settings...');
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
    void launcherRuntime.getEffectiveShortcut().then((nextShortcut) => {
      if (!cancelled) {
        setEffectiveShortcut(nextShortcut);
      }
    });

    const unsubscribe = launcherRuntime.onSettingsChanged((nextSettings) => {
      setSettings(cloneSettings(nextSettings));
      setSaveState('Updated from another window');
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

    const nextSettings = await launcherRuntime.saveSettings(settings);
    const nextEffectiveShortcut = await launcherRuntime.getEffectiveShortcut();
    setSettings(cloneSettings(nextSettings));
    setEffectiveShortcut(nextEffectiveShortcut);
    setSaveState('Saved');
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

  return (
    <main className={classes.page}>
      <div className={classes.shell}>
        <header className={classes.header}>
          <div>
            <div className={classes.title}>Northlight Settings</div>
            <div className={classes.subtitle}>
              Control ranking, preview, clipboard history, snippets, aliases, scopes, and launcher utility-window behavior in one place.
            </div>
          </div>
          <div className={classes.actions}>
            <button className={classes.secondaryButton} type="button" onClick={() => setSettings(cloneSettings(launcherRuntime.getSettingsSnapshot()))}>
              Revert
            </button>
            <button className={classes.button} type="button" onClick={() => void save()}>
              Save Settings
            </button>
          </div>
        </header>

        <div className={classes.content}>
          <nav className={classes.tabs} aria-label="Settings sections">
            {[
              ['overview', 'Overview'],
              ['content', 'Aliases & Snippets'],
              ['scopes', 'Scopes & Status']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${classes.tab} ${activeTab === id ? classes.tabActive : ''}`}
                onClick={() => setActiveTab(id as 'overview' | 'content' | 'scopes')}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className={`${classes.grid} ${activeTab === 'scopes' ? classes.gridWithSidebar : classes.gridSingle}`}>
            <div className={classes.leftColumn}>
              {activeTab === 'overview' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Search And Ranking</div>
                <div className={classes.cardSubtitle}>Tune best match behavior, app priority, preview defaults, and clipboard/snippet participation.</div>
                <div className={classes.toggleRow}>
                  {[
                    ['bestMatchEnabled', 'Best match section', 'Show the top result in a dominant slot.'],
                    ['appFirstEnabled', 'Prefer apps', 'Boost app candidates over similarly named files.'],
                    ['previewEnabled', 'Preview pane', 'Keep an inline preview panel available in the launcher.'],
                    ['quickLookStartsOpen', 'Preview open by default', 'Open the preview pane automatically when the launcher appears.'],
                    ['clipboardHistoryEnabled', 'Clipboard history', 'Track recent clipboard text and expose it in search.'],
                    ['snippetsEnabled', 'Snippets', 'Include saved text snippets in search results.']
                  ].map(([key, label, help]) => (
                    <label key={key} className={classes.toggle}>
                      <div className={classes.toggleText}>
                        <div className={classes.toggleLabel}>{label}</div>
                        <div className={classes.toggleHelp}>{help}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settings[key as keyof LauncherSettings])}
                        onChange={(event) =>
                          updateSettings((current) => ({
                            ...current,
                            [key]: event.currentTarget.checked
                          }))
                        }
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
                      onChange={(event) =>
                        updateSettings((current) => ({
                          ...current,
                          maxClipboardItems: Number(event.currentTarget.value) || current.maxClipboardItems
                        }))
                      }
                    />
                  </label>
                </div>
              </section>
              ) : null}

              {activeTab === 'overview' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Launcher Window</div>
                <div className={classes.cardSubtitle}>Control the global shortcut and native utility-window behavior.</div>
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
                  <div>
                    <div className={classes.cardTitle}>Aliases</div>
                    <div className={classes.cardSubtitle}>Short triggers for paths, snippets, or direct settings access.</div>
                  </div>
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
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, trigger: event.currentTarget.value } : entry
                                )
                              }))
                            }
                          />
                        </label>
                        <label className={classes.field}>
                          <span className={classes.label}>Target type</span>
                          <select
                            className={classes.select}
                            value={alias.targetType}
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, targetType: event.currentTarget.value as AliasEntry['targetType'] } : entry
                                )
                              }))
                            }
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
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, target: event.currentTarget.value } : entry
                                )
                              }))
                            }
                          />
                        </label>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Note</span>
                          <input
                            className={classes.input}
                            value={alias.note ?? ''}
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                aliases: current.aliases.map((entry) =>
                                  entry.id === alias.id ? { ...entry, note: event.currentTarget.value } : entry
                                )
                              }))
                            }
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
                  <div>
                    <div className={classes.cardTitle}>Snippets</div>
                    <div className={classes.cardSubtitle}>Reusable text blocks that appear as launcher results.</div>
                  </div>
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
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, trigger: event.currentTarget.value } : entry
                                )
                              }))
                            }
                          />
                        </label>
                        <label className={classes.field}>
                          <span className={classes.label}>Note</span>
                          <input
                            className={classes.input}
                            value={snippet.note ?? ''}
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, note: event.currentTarget.value } : entry
                                )
                              }))
                            }
                          />
                        </label>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Content</span>
                          <textarea
                            className={classes.textarea}
                            value={snippet.content}
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                snippets: current.snippets.map((entry) =>
                                  entry.id === snippet.id ? { ...entry, content: event.currentTarget.value } : entry
                                )
                              }))
                            }
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
                  <div>
                    <div className={classes.cardTitle}>Search Scopes</div>
                    <div className={classes.cardSubtitle}>Scopes decide which roots feed local indexing and targeted fallback search.</div>
                  </div>
                  <button
                    className={classes.scopeActionButton}
                    type="button"
                    onClick={() => {
                      setIsAddingScope(true);
                      setScopeFeedback(null);
                      window.requestAnimationFrame(() => newScopeInputRef.current?.focus());
                    }}
                  >
                    Add Scope
                  </button>
                </div>

                <div className={classes.scopeHero}>
                  <div className={classes.scopeHeroCopy}>
                    <div className={classes.scopeLead}>Choose which roots Northlight indexes.</div>
                    <div className={classes.scopeLeadText}>
                      Start narrow. Add `~/Library` when you need app support files and preferences. Add Home or `/` only when broader recall matters more than speed and result cleanliness.
                    </div>
                  </div>
                  <div className={classes.scopeMetrics}>
                    <div className={classes.scopeMetric}>
                      <span className={classes.scopeMetricLabel}>Enabled</span>
                      <span className={classes.scopeMetricValue}>{enabledScopes}</span>
                    </div>
                    <div className={classes.scopeMetric}>
                      <span className={classes.scopeMetricLabel}>Watchers</span>
                      <span className={classes.scopeMetricValue}>{settings.watchFsChangesEnabled ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </div>

                <div className={classes.scopeToolbar}>
                  <div className={classes.scopeToolbarLabel}>Quick Add</div>
                  <div className={classes.scopePresetRow}>
                    {scopePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${classes.scopePresetButton} ${preset.tone === 'danger' ? classes.scopePresetButtonDanger : preset.tone === 'warm' ? classes.scopePresetButtonWarm : ''}`}
                        onClick={() => addScopePath(preset.path)}
                      >
                        <span className={classes.scopePresetButtonLabel}>{preset.label}</span>
                        <span className={classes.scopePresetButtonCost}>{preset.cost}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={classes.scopePresetNotes}>
                  {scopePresets.map((preset) => (
                    <div key={preset.id} className={classes.scopePresetNoteRow}>
                      <span className={classes.scopePresetNoteLabel}>{preset.label}</span>
                      <span className={classes.scopePresetNoteText}>{preset.note}</span>
                    </div>
                  ))}
                </div>

                {isAddingScope ? (
                  <div className={classes.scopeComposer}>
                    <div className={classes.scopeComposerHeader}>
                      <div>
                        <div className={classes.scopeComposerTitle}>Add Custom Scope</div>
                        <div className={classes.scopeComposerHint}>Paste a folder path, then add it to the list.</div>
                      </div>
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
                  <label className={classes.toggle}>
                    <div className={classes.toggleText}>
                      <div className={classes.toggleLabel}>Watch filesystem changes</div>
                      <div className={classes.toggleHelp}>Listen for changes in enabled scopes and invalidate stale results faster.</div>
                    </div>
                    <input
                      type="checkbox"
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
                  {settings.scopes.map((scope, index) => (
                    <div key={scope.id} className={classes.scopeRow}>
                      <div className={classes.rowHeader}>
                        <div>
                          <div className={classes.rowTitle}>Scope {index + 1}</div>
                          <div className={classes.scopeCardMeta}>{scope.path === '/' ? 'Whole disk' : scope.path.includes('/Library') ? 'Library-heavy scope' : 'Custom scope'}</div>
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
                      <div className={classes.fieldGrid}>
                        <label className={classes.fieldFull}>
                          <span className={classes.label}>Path</span>
                          <input
                            data-scope-path="true"
                            className={classes.input}
                            value={scope.path}
                            onChange={(event) =>
                              updateSettings((current) => ({
                                ...current,
                                scopes: current.scopes.map((entry) =>
                                  entry.id === scope.id ? { ...entry, path: event.currentTarget.value } : entry
                                )
                              }))
                            }
                          />
                        </label>
                        <label className={classes.scopeToggle}>
                          <div className={classes.scopeToggleHeader}>
                            <div className={classes.toggleLabel}>Enabled</div>
                            <input
                              type="checkbox"
                              checked={scope.enabled}
                              onChange={(event) =>
                                updateSettings((current) => ({
                                  ...current,
                                  scopes: current.scopes.map((entry) =>
                                    entry.id === scope.id ? { ...entry, enabled: event.currentTarget.checked } : entry
                                  )
                                }))
                              }
                            />
                          </div>
                          <div className={classes.toggleHelp}>Disabled scopes stay saved but are ignored by search.</div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              ) : null}
            </div>

            <div className={classes.rightColumn}>
              {activeTab === 'scopes' ? (
              <section className={classes.card}>
                <div className={classes.cardTitle}>Status</div>
                <div className={classes.cardSubtitle}>Read-only state for this settings session.</div>
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
                <div className={classes.cardTitle}>Scope Guidance</div>
                <div className={classes.cardSubtitle}>A few rules that matter when you widen search coverage.</div>
                <ul className={classes.hintList}>
                  <li>`~/Library` is usually the highest-value expansion if you want app support files, settings, plugins, or preferences.</li>
                  <li>Disabled scopes stay in settings but stop feeding the local index until you enable them again.</li>
                  <li>Larger scopes take longer to index and tend to push more low-value files into results.</li>
                  <li>Watching filesystem changes helps stale results disappear faster, but it also makes broad scope sets busier.</li>
                  <li>The `/` scope is a power-user option. It broadens recall, but it is the slowest and noisiest choice.</li>
                </ul>
              </section>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
