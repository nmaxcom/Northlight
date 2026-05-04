# Settings Window And Design Fidelity

## User-Visible Behavior

- `Cmd+,` opens the dedicated Northlight settings window with visible settings content, not a blank surface.
- If settings data fails to load, the settings window shows an explicit error state instead of staying empty or stuck on an invisible failure.
- Electron logs settings-window load success, load failure, renderer console errors, and renderer process exits with a clear `settings-window` label.
- `design/settings-current-view.html` mounts the same shipping settings component as the Electron `?view=settings` route.
- Settings design HTML uses the real settings window content size of `980×760`.

## Non-Goals

- Redesigning Settings layout or visual style.
- Changing settings persistence semantics.
- Changing the launcher open shortcut or launcher layout.

## Failure Cases

- Settings IPC fails or rejects.
- Renderer load fails in development or packaged output.
- Settings renderer process crashes.
- Local design bundles are missing or stale.

## Acceptance Criteria

- Settings window creation attaches `did-finish-load`, `did-fail-load`, renderer console, and render-process-gone diagnostics.
- `SettingsViewV2` renders an explicit error message if any required initial settings load fails.
- `design/settings-current-view.html` and its bundle derive from `SettingsViewV2`.
- A Playwright design test verifies the settings design page renders at `980×760` and contains real settings UI.
- User guide documents the reliable settings design page.

## Test Plan

- `npm run build:design`
- `npm run typecheck`
- `npx electron-vite build --config electron.vite.config.ts`
- `npx playwright test tests/e2e/settings-design.spec.ts`
- `npx playwright test tests/e2e/electron-settings-window.spec.ts`
