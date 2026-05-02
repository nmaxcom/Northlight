# Feature Spec: Immediate Icons and Dev Autorestart

## Status

- Approved

## Problem

Some result icons can appear late or stay on fallback glyphs until another interaction causes more icon work. Development sessions also rely on a long-running `npm run dev` child that can stop reflecting larger changes or exit, forcing manual restarts.

## User Value

- Result icons start loading as soon as visible results render, without requiring pointer movement.
- Temporary native icon failures can recover on the renderer's bounded retry path instead of being cached forever as missing.
- `npm run dev` keeps the Electron dev process alive during normal iteration and restarts it after relevant source/config changes.

## Scope

- In scope: visible result icon hydration starts immediately while typing.
- In scope: native icon lookup failures are retryable and do not permanently poison the icon cache.
- In scope: the Finder icon helper is prewarmed after app startup.
- In scope: `npm run dev` runs a local supervisor around `electron-vite dev --watch`.
- In scope: the supervisor restarts the child after watched file changes and unexpected child exits.

## Out of Scope

- Launcher resizing, compact idle mode, and any visual redesign.
- Changing ranking, parser behavior, or file search scope.
- Replacing the existing native icon helper with a new dependency.
- Changing production app restart behavior.

## User Stories

- As a user, I can type a query and see visible result icons hydrate on the first result pass.
- As a user, I do not need to move the mouse over rows to make icons appear.
- As a developer, I can leave `npm run dev` running and have it restart when Electron, renderer, package, or config files change.

## Interaction Notes

- Pointer movement is not a trigger for icon loading.
- Fallback glyphs remain visible while native icons are resolving.
- If an icon lookup fails, Northlight keeps the fallback glyph and the renderer may retry up to its bounded cap.
- The dev supervisor restarts after a short debounce so save bursts become one restart.

## Acceptance Criteria

- [ ] Typing a query with local file/app results starts icon hydration for visible rows without pointer movement.
- [ ] Failed icon results retry without being blocked by permanent `null` cache entries.
- [ ] Finder icon helper compilation is started proactively after the app is ready.
- [ ] `npm run dev` restarts the Electron dev child when watched main-process, preload, renderer, package, or config files change.
- [ ] `npm run dev` restarts the Electron dev child if it exits unexpectedly.
- [ ] Dev restarts back off enough to avoid a tight crash loop.

## Failure Cases

- If native icon resolution keeps failing, the launcher keeps deterministic fallback glyphs and records the failure in tracing.
- If the dev child exits repeatedly, the supervisor waits before restarting.
- If a file watcher cannot attach, the supervisor logs the watcher failure and keeps the dev child running.

## Performance Expectations

- Visible icon hydration is scheduled immediately after visible results render, with no typing idle gate.
- Dev restarts should happen within 500 ms after a watched file change settles.

## Notes

- Compact launcher sizing remains in the draft mockup/spec work and is intentionally not part of this approved slice.
