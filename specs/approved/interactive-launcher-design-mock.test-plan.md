# Test Plan: Interactive Launcher Design Mock

## Unit

- Verify mock-state helpers can provide preview content for app, folder, folder-listing, and file results.
- Verify the launcher mock does not reset the selected result in mock mode when pointer-driven selection changes.

## Integration

- Verify the exported standalone design HTML contains the interactive script/data needed for pointer-driven preview swaps.

## E2E

- Run `npm run design`.
- Open `file:///.../design/launcher-current-view.html` with Playwright.
- Hover different results and assert that:
  - the selected row changes
  - the preview title/body/meta changes accordingly
- Assert no console or page errors for the standalone launcher mock.

## Regression checks

- Keep the standalone launcher mock fitted to the fixed design frame.
- Keep `*.live.html` graceful when opened directly from `file://`.
