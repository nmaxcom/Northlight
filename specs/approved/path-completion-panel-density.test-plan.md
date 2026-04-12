# Test Plan: Path Completion Panel Density

## Unit

- [ ] no unit changes required beyond existing path completion logic coverage

## Component

- [ ] `LauncherBar` test covering a multi-candidate completion list rendered as one-line rows
- [ ] `LauncherBar` test covering active completion detail shown outside the rows
- [ ] `LauncherBar` test covering compact panel max-height styling and internal scroll configuration

## E2E

- [ ] trigger a multi-candidate path completion list in the launcher
- [ ] verify the completion rows do not render repeated `Folder` / `Alias` badges
- [ ] verify the active completion detail line appears separately from the row labels
- [ ] verify the completion rows are visually compact in the browser

## Manual Verification

- [ ] open a path with many candidate folders and confirm the launcher viewport remains intact
- [ ] confirm the completion panel scrolls instead of growing indefinitely
- [ ] confirm the compact presentation is still understandable when two folders share similar names
