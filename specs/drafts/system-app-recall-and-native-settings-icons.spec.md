# System App Recall And Native Settings Icons

## Summary

Northlight currently fails a critical launcher expectation on modern macOS: queries for built-in Apple apps such as `textedit` can return no result even when the app is present on the machine. The current tests missed this because they modeled Apple apps under `/Applications` instead of their real modern location under `/System/Applications`.

Northlight also renders macOS settings commands with placeholder vector icons instead of the native-looking pane icons users expect from Spotlight- or Raycast-class launchers.

## Problem

- Built-in Apple apps located in `/System/Applications` are not reliably indexed, ranked, or surfaced.
- Search tests validate a mocked path layout that does not match the real machine layout for Apple system apps.
- macOS settings results use generic Tabler icons instead of the system icon assets associated with the corresponding settings panes or extensions.

## Scope

- In scope: include `/System/Applications` in default searchable/indexed locations for launcher app discovery.
- In scope: ensure built-in Apple apps from `/System/Applications` are eligible to rank as top app results for exact and prefix app-name queries such as `textedit`, `preview`, `notes`, and `safari`.
- In scope: adjust ranking penalties and preferences so system apps are not suppressed below relevance for clear app-intent queries.
- In scope: update tests so app recall expectations use realistic system-app paths and exercise the main-process-backed local search path, not just renderer-side fixture assumptions.
- In scope: attach native macOS icon assets to system settings command results using real system bundle/icon sources where available.
- In scope: verify representative settings panes such as `Wi‑Fi`, `Privacy & Security`, `Bluetooth`, `Keyboard`, and `Displays` show native-looking pane icons instead of generic placeholders.

## Out Of Scope

- Out of scope: a full redesign of search ranking beyond the system-app recall regression.
- Out of scope: native pane icons for every possible settings destination if the OS does not expose a usable icon source.
- Out of scope: changing launcher visual styling beyond what is necessary to show the correct icons.

## User-Visible Behavior

- Typing `textedit` should surface `TextEdit.app` from `/System/Applications/TextEdit.app` as a top result.
- Typing other common Apple app names such as `preview`, `notes`, `safari`, `calendar`, or `calculator` should surface the matching built-in app when installed.
- macOS settings command results should display native pane icons rather than generic line icons.
- The generic `System Settings` command may fall back to the `System Settings.app` icon if no pane-specific icon source exists.

## Failure Cases

- If `/System/Applications` is unavailable or unreadable, search must continue without crashing and should still return other valid results.
- If a pane-specific icon asset cannot be resolved, the launcher must fall back to the `System Settings.app` icon rather than a broken image or empty icon slot.
- If the OS changes internal extension paths, settings commands must still open correctly even if the icon falls back.

## Acceptance Criteria

- [ ] `textedit` returns `TextEdit.app` from `/System/Applications/TextEdit.app` in automated tests.
- [ ] Representative built-in app queries such as `preview`, `notes`, and `safari` return their system-app bundles from `/System/Applications`.
- [ ] At least one test exercises the main search/index ranking path with `/System/Applications` entries instead of only renderer-local fixtures.
- [ ] Settings commands for `wifi` and `privacy` resolve icon assets from native macOS bundle paths or a documented fallback path.
- [ ] When pane-specific icon resolution fails, the launcher still renders a valid fallback icon from `System Settings.app`.
- [ ] Documentation reflects that Northlight searches built-in Apple apps from `/System/Applications`.
