# Feature Spec: Compact Launcher, Immediate Icons, and Dev Autorestart

## Status

- Draft

## Problem

The launcher currently feels too large for first-open use, and some result icons appear late or only after pointer interaction. The development process also relies on a long-running `npm run dev` process that can stop reflecting larger main-process changes until it is restarted manually.

## User Value

- The launcher opens in a smaller, calmer state before the user has typed enough to show results.
- Result icons hydrate on the first render pass for visible results, without requiring pointer movement.
- `npm run dev` recovers from renderer or main-process rebuild stalls by restarting the Electron dev process.

## Scope

- In scope: introduce distinct launcher content dimensions for an initial state and a results state.
- In scope: keep design mock dimensions and Electron `BrowserWindow` content dimensions in the same named constants.
- In scope: remove or hide preview from the initial launcher state.
- In scope: make visible result icon requests start immediately when results are rendered.
- In scope: update `npm run dev` so it supervises `electron-vite dev --watch` and restarts it when relevant source files change or the child process exits unexpectedly.
- In scope: update `docs/user-guide.md` and app semver when the approved behavior ships.

## Out of Scope

- Redesigning settings.
- Changing result ranking, parser behavior, or file search scope.
- Replacing the current icon rendering helper with a new native dependency.
- Changing production app restart behavior.

## User Stories

- As a user, I can open Northlight and see a compact launcher without a large empty preview area.
- As a user, I can type a query and see result icons appear on the first result render rather than after hovering.
- As a developer, I can leave `npm run dev` running while making main-process or renderer changes and have it recover without manual restarts.

## Interaction Notes

- Initial state: compact shell with header, search field, and concise status/action footer; no preview pane.
- Results state: larger shell with result list and optional preview pane.
- Transition: when result-bearing query state begins, the main process resizes the content window to the approved results dimensions before or with the rendered results.
- Empty or clearing query: return to the approved initial dimensions.
- Pointer movement must not be required to trigger icon loading.

## Acceptance Criteria

- [ ] The approved initial-state mock reports the same content dimensions used by the Electron launcher initial state.
- [ ] The approved results-state mock reports the same content dimensions used by the Electron launcher results state.
- [ ] Opening Northlight with no query does not show a preview pane.
- [ ] Typing a query with local file/app results starts icon hydration for visible rows without pointer movement.
- [ ] Icons that fail once are retried without requiring hover, while avoiding unbounded retry loops.
- [ ] `npm run dev` restarts the Electron dev child when watched main-process, preload, renderer, package, or config files change.
- [ ] `npm run dev` restarts the Electron dev child if it exits unexpectedly.

## Failure Cases

- If native icon resolution fails, the launcher keeps the deterministic fallback glyph and records the failure in tracing.
- If resizing fails, the launcher remains usable at the previous content size.
- If the dev child repeatedly exits, the supervisor backs off rather than spinning in a tight loop.

## Performance Expectations

- Visible icon hydration is scheduled in the same render cycle as visible results, with no dependency on hover.
- The compact initial state should render without waiting for preview or icon work.
- Dev restarts should happen within 500 ms after a watched file change settles.

## Notes

- Mockup options are available in `design/launcher-compact-options.html`.
- The current production launcher content size is `1120x760`.
- Proposed dimensions should be approved before implementation moves to `electron/main.ts`, `src/components/LauncherBar.tsx`, and the dev script.
