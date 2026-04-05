# Test Plan: System App Recall And Native Settings Icons

## Unit

- [ ] `electron/search.ts`
  - `/System/Applications` is included in fallback roots and preference logic.
  - exact-name system apps are not zeroed out or buried by system penalties.
- [ ] `src/lib/search/scoring.test.ts`
  - `TextEdit.app` at `/System/Applications/TextEdit.app` outranks noisy text-related files for `text` and `textedit`.
- [ ] `src/lib/search/systemSettings*.test.*`
  - settings targets expose native icon source paths for representative panes.
  - missing pane icon source falls back to `System Settings.app`.

## Integration

- [ ] `src/lib/search/query.test.tsx`
  - `buildResults('textedit')` returns `TextEdit.app` with a `/System/Applications/...` path.
  - `buildResults('preview')`, `buildResults('notes')`, and `buildResults('safari')` use realistic system-app paths where applicable.
- [ ] Add a test that exercises the search bridge or main-process-backed ranking path with realistic `/System/Applications` entries so renderer mocks cannot hide the regression.

## UI

- [ ] `src/components/LauncherBar.test.tsx`
  - system settings commands render an image-backed native icon when an icon URL is available.
  - fallback rendering remains valid if the icon URL is unavailable.

## Manual Verification

- [ ] Typing `textedit` in the built app surfaces `TextEdit.app`.
- [ ] Typing `wifi` shows `Open Wi‑Fi Settings` with the native pane icon.
- [ ] Typing `privacy` shows `Open Privacy & Security Settings` with the native pane icon.
- [ ] Typing `preview` and `notes` surfaces the built-in Apple apps from `/System/Applications`.
