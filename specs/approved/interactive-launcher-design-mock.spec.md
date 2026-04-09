# Interactive Launcher Design Mock

## Goal

Keep the main launcher design mock realistic enough for design work by preserving the launcher's core interactive behavior:

- moving across results changes the active row
- the preview pane updates with the active result
- the exported standalone mock remains self-contained

## User-visible behavior

- `/design/launcher-current-view.html` is the primary launcher design mock.
- The primary launcher design mock must react to pointer hover over results.
- Hovering a result updates both:
  - the highlighted result row
  - the preview pane content
- The mock must include representative result types and previews for:
  - app result with media preview
  - folder result with metadata preview
  - folder result with listing preview
  - file result with text preview
- The standalone exported HTML must preserve this interaction without requiring Vite.

## Non-goals

- Reproducing the full production search pipeline.
- Adding live filesystem reads to the standalone mock.
- Replacing the main interactive mock with a gallery of static screenshots.

## Failure cases

- Hovering rows does not change the preview pane.
- The exported standalone HTML only shows one frozen preview state.
- The mock drifts into a hand-built imitation instead of using the launcher component/state model.
- Future changes reintroduce static-only behavior in the main launcher mock.

## Acceptance criteria

- The primary launcher mock exported at `/design/launcher-current-view.html` updates preview content on hover between at least app, folder, and file results.
- The exported standalone HTML works via `file://` with no console/page errors.
- The preview updates remain driven by the real `LauncherBar` interaction model plus mock state, not by a separate hardcoded DOM implementation.
- The intended contract for the launcher design mock is documented in a durable repo location for future agents.
