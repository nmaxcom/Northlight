# Main-Process App Recall Audit

## Goal

Add a systematic recall suite for macOS apps that verifies the main-process search pipeline returns the same high-value app results the user should see in the launcher, using persisted launcher state and catalog snapshots instead of renderer-only fixtures.

## User-visible behavior

- Northlight should reliably surface direct app-name queries for common macOS apps from `/System/Applications` and configured application scopes.
- Silent app drops caused by catalog hydration, missing provider fields, scope handling, or main-process ranking should be caught before release.
- The shipped launcher should not depend on renderer fixture data to validate app recall quality.

## In scope

- Add main-process integration coverage around `electron/search.ts`.
- Use copied persisted `launcher-state.json` and `local-search-catalog.json` snapshots in temporary test directories.
- Validate direct recall for representative macOS apps from `/System/Applications`.
- Validate that hot search and deep search both preserve those app hits.
- Validate that configured application scopes from persisted settings are actually honored by the main-process search layer.
- Tighten test infrastructure so node/main-process tests can run without browser-only globals.

## Representative app set

The suite should cover a representative set of built-in macOS apps that exercise different common queries and names. At minimum:

- `Calendar.app`
- `TextEdit.app`
- `Preview.app`
- `Notes.app`
- `Safari.app`
- `System Settings.app`

Additional apps may be included if they are present in the persisted catalog snapshot and improve coverage without making the suite brittle.

## Out of scope

- Requiring app-specific hardcoded ranking tweaks in production code.
- Adding per-app product logic solely to satisfy tests.
- Broad fixture expansion in the renderer as a substitute for main-process coverage.
- UI visual changes unrelated to search correctness.

## Failure cases this slice must catch

- A persisted catalog entry exists for an app, but hot search returns no result.
- Deep search returns file noise while dropping the direct app hit.
- Provider results with missing optional fields such as `score` collapse ranking unexpectedly.
- Persisted application scopes are ignored or normalized differently in the main process.
- Tests pass only because renderer fixture data masks a main-process regression.

## Acceptance criteria

- A main-process integration suite exists and runs under `npm run test:unit`.
- The suite uses temporary copies of persisted launcher state/catalog snapshots rather than renderer mock fixtures.
- Direct queries for the representative app set return the corresponding app from main-process hot search when present in the catalog snapshot.
- The same representative app set is still present in deep search results.
- The suite fails red if catalog-backed app entries are silently dropped from main-process search output.
- The test environment can run node/main-process tests without relying on `window` globals.

## Risks

- Persisted snapshots can become stale or machine-specific if the test assumptions are too broad.
- Overfitting to one exact machine state would make the suite brittle.

## Mitigations

- Assert on app presence/recall properties, not on the entire result list.
- Limit the representative app set to stable system apps that should exist on the target macOS environment.
- Copy persisted files into temporary directories during tests so the real user data is never mutated.
