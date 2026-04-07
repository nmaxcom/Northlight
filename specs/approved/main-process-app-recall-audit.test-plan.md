# Main-Process App Recall Audit Test Plan

## Unit coverage

- `src/lib/search/scoring.test.ts`
  - Protect against missing provider scores causing exact app hits to collapse.

## Integration coverage

- `electron/search.integration.test.ts`
  - Copy persisted `launcher-state.json` into a temporary `userData` directory.
  - Copy persisted `local-search-catalog.json` into the same temporary `userData` directory.
  - Mock `electron.app.getPath('userData')` to point at the temporary directory.
  - Assert that `searchHotPaths()` returns representative macOS apps for direct queries.
  - Assert that `searchIndexedPaths()` also preserves those same apps.
  - Assert that the restored main-process catalog is actually loaded before evaluating recall.
  - Assert that configured application scopes from persisted settings are honored.

## E2E coverage

- `tests/e2e/system-app-recall.spec.ts`
  - Keep a focused real-launcher assertion that direct app-name queries such as `calendar` remain visible in the UI.

## Pass/fail criteria

- Pass if all representative app queries are present in the main-process hot and deep result sets when those apps exist in the copied catalog snapshot.
- Fail if any representative app is missing from hot search while still present in the copied catalog snapshot.
- Fail if a node/main-process test depends on browser globals to initialize.
- Fail if renderer-only fixture coverage is the only thing keeping an app-recall scenario green.
