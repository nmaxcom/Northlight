# Watcher-Driven Index Invalidation

## Why

Persisted local search must stop showing moved or deleted files after they change on disk. Background refresh alone is not enough if the launcher keeps serving stale in-memory results between rebuilds.

## Scope

- In scope:
- Watch enabled scope roots for filesystem changes on macOS.
- Debounce watcher events and trigger background index refresh.
- Clear stale search caches when watcher events land.
- Expose a settings toggle to enable or disable filesystem watchers.
- Persist the watcher preference across relaunches.

- Out of scope:
- Per-file live diffing inside the renderer.
- Cross-machine sync of watcher settings.
- Guaranteed recursive watching on non-macOS platforms.

## User Stories

- As a user, when I move or rename a folder inside an indexed scope, the old path should stop appearing quickly.
- As a user, I can disable filesystem watching if I want less background activity.
- As a user, I can trust that relaunching the launcher does not resurrect old paths from cache.

## Behavior

- The launcher starts filesystem watchers for enabled scopes when the watcher setting is enabled.
- Watcher events debounce into a background refresh rather than blocking the launcher.
- Watcher events clear transient search caches so stale immediate results do not linger in memory.
- If a cached result path no longer exists, it is pruned from the persisted index and omitted from results.
- The settings window exposes a clear toggle for filesystem watchers under scope/indexing controls.

## Failure Cases

- If a watcher cannot be attached to a scope, the launcher keeps working and falls back to background refresh behavior.
- If a watched path disappears entirely, the launcher removes stale entries and keeps watching remaining valid scopes.
- If watcher support is unavailable for a scope, search still works via persisted index plus targeted fallback scan.

## Acceptance Criteria

- [ ] Moving a folder inside an enabled watched scope removes the old path from subsequent launcher results.
- [ ] The new moved path becomes searchable after watcher-driven refresh completes.
- [ ] Disabling filesystem watchers in settings stops attaching watchers for scope roots.
- [ ] The watcher toggle persists across relaunches.
- [ ] Cache invalidation from watcher events prevents stale immediate results from lingering in the renderer.
