# Test Plan: Compact Launcher, Immediate Icons, and Dev Autorestart

## Status

- Draft

## Linked Spec

- `specs/drafts/launcher-compact-icons-and-dev-restart.spec.md`

## Coverage Strategy

- Unit: launcher state-to-layout mode, icon hydration scheduling, retry bounds, and dev supervisor restart decision helpers if extracted.
- Integration: Electron launcher window content bounds for initial and results states; icon IPC batch requests without pointer interaction.
- E2E: keyboard-first launcher flow, compact initial screenshot, results screenshot, and visible icon hydration before hover.

## Test Cases

- [ ] Initial launcher opens at the approved compact content size and hides preview.
- [ ] Typing a query resizes to the approved results content size and keeps keyboard selection stable.
- [ ] Clearing the query returns to the approved compact content size.
- [ ] Visible result icons request through `launcher:get-path-icons` without mouse movement.
- [ ] Failed icon results retry up to the approved cap and then keep fallback glyphs.
- [ ] `npm run dev` restarts its Electron child when `electron/main.ts` changes.
- [ ] `npm run dev` restarts its Electron child when the child exits unexpectedly.

## Fixtures or Mocks

- Mock launcher results with `path` and `iconPath` values.
- Mock runtime icon IPC that returns null first and an icon on retry.
- Dev supervisor tests should use a fake child process adapter rather than spawning real Electron in unit tests.

## Pass Criteria

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npx playwright test tests/e2e/launcher.spec.ts`
- Manual or screenshot verification that `design/launcher-compact-options.html` and Electron content dimensions match the approved values.

## Risks

- Native macOS icon resolution can be slow or inconsistent across machines, so integration tests should assert scheduling and fallback behavior without requiring specific icon artwork.
- Electron content resizing may interact with saved launcher position and multi-display placement.
