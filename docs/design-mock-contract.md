# Design Mock Contract

## Launcher mock

- `design/launcher-current-view.html` is the primary launcher design mock.
- The primary launcher design mock must remain interactive when opened as standalone `file://` HTML.
- Hovering different results must update both:
  - the selected row highlight
  - the preview pane content
- The main launcher mock must preserve representative preview behavior for:
  - app results with media preview
  - folder results with metadata preview
  - folder results with listing preview
  - file results with text preview

## Source of truth

- The launcher design mock must stay derived from the real `LauncherBar` component and its mock state.
- Do not replace the main launcher mock with a hand-built static imitation.
- Additional static or scenario pages are acceptable as references, but they are not a substitute for the interactive main mock.

## Regression rule

- If a change makes `design/launcher-current-view.html` behave like a frozen screenshot instead of a hover-reactive launcher, that is a regression and must be fixed before considering the task complete.
