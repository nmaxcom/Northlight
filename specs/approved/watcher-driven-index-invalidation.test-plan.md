# Watcher-Driven Index Invalidation Test Plan

## Spec

- `specs/approved/watcher-driven-index-invalidation.spec.md`

## Coverage

- Unit: settings normalization for watcher preference, renderer cache invalidation hook.
- Integration: search refresh and stale-path pruning after a move.
- E2E: settings window shows watcher toggle and persists it.

## Checks

- [ ] Default settings include filesystem watching enabled.
- [ ] Saving settings can disable and re-enable filesystem watchers.
- [ ] A moved path no longer appears after invalidation and refresh.
- [ ] Renderer-side cached results clear when index invalidation is broadcast.
