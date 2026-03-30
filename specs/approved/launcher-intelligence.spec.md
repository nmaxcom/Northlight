# Feature Spec: Launcher Intelligence And Ranking

## Status

- Approved

## Problem

The launcher still behaves like a fast file picker instead of a smart command surface. Users need stronger best-match behavior, app-first ranking, aliases, recents, configurable scopes, and richer visual signaling so the top result is usually the intended one.

## User Value

- Top matches become more trustworthy.
- Apps, aliases, and recent items resolve faster.
- Search can be tailored to personal folders instead of one hardcoded index shape.
- Result type is recognizable instantly from the icon treatment.

## Scope

- In scope:
- Color-code only the left icon tile by result kind.
- Add a best-match treatment for the top result without breaking list navigation.
- Strengthen ranking with persisted recency and frequency signals.
- Add manual aliases for apps, folders, files, snippets, and commands.
- Add stronger app-first ranking when apps are plausible matches.
- Add configurable search scopes that affect local indexing and fallback search.

## Out of Scope

- Third-party plugins.
- Full-text file contents indexing.
- Cloud sync of aliases or settings.

## User Stories

- As a user, I can type a short alias such as `btt` and resolve the intended item immediately.
- As a user, I see the best match separated clearly from the rest of the list.
- As a user, I can choose which folders Northlight searches.
- As a user, the icon tile gives me immediate type recognition.

## Interaction Notes

- Trigger: typing in the main launcher input.
- Primary result behavior: top match remains runnable with `Enter`.
- Secondary actions: actions stay available through the actions panel and keyboard shortcuts.
- Empty states: explain whether no results were found inside current scopes.
- Error states: invalid scopes or unreadable folders remain visible in settings and do not crash search.

## Acceptance Criteria

- [ ] The first result can render in a dedicated best-match presentation when results exist.
- [ ] Alias hits outrank fuzzy path matches and launch the target item or snippet directly.
- [ ] Persisted recency/frequency signals affect ranking across sessions.
- [ ] App candidates outrank similarly named low-value files when both are plausible.
- [ ] Search scopes are configurable and are respected by local search/indexing.
- [ ] Result icon tiles use stable kind-specific colors without tinting the whole row.

## Failure Cases

- If an alias points to a missing target, the launcher shows the alias as broken in settings and excludes it from normal results.
- If all configured scopes are unreadable, search falls back to the last good persisted index and reports cold/limited state.
- If recency data is unavailable, ranking falls back to deterministic scoring only.

## Performance Expectations

- Cached/immediate results should still appear synchronously when possible.
- Local indexed search should keep top-result latency close to the current baseline and avoid waiting on settings reads for every keystroke.

## Notes

- Recency/frequency persistence can share infrastructure with aliases and settings if kept narrow and typed.
