# Launcher Design Real State Pages

## User-visible behavior

- The design index exposes separate launcher pages for fresh open and populated results.
- Each launcher design page mounts the real `LauncherBar` React component from the app renderer bundle.
- The fresh-open page uses the compact Electron content size, `760x360`.
- The results page uses the full Electron content size, `1120x760`.
- The older static compact exploration page is not presented as a source-of-truth design target.

## Non-goals

- This does not redesign the launcher.
- This does not make the design pages call real Electron IPC.
- This does not remove old exploratory HTML files from disk.

## Failure cases

- If the bundle is missing, each page instructs the user to run `npm run build:design`.
- If design sizes drift, tests should fail against the frame dimensions.

## Acceptance criteria

- `npm run build:design` produces launcher bundles from `src/design/launcher-current-view.tsx`.
- `design/launcher-fresh-open-view.html` renders `data-launcher-compact="true"` at `760x360`.
- `design/launcher-results-view.html` renders populated results with preview at `1120x760`.
- Existing hover behavior still updates result selection and preview on the results page.
