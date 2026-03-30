# Feature Spec: Utility Window Ergonomics

## Goal

Make the launcher behave more like a native utility window by allowing the user to drag it from the header and by keeping the moved position between launches.

## User-Visible Behavior

- The launcher header can be dragged to move the frameless window.
- Interactive header content must stay clickable and must not accidentally start dragging.
- If the user moves the launcher, the next time it appears it opens at the saved position instead of re-centering.
- If no saved position exists yet, the launcher opens centered as before.

## Non-Goals

- Free resizing.
- Edge snapping, magnetism, or multi-layout presets.
- Independent position memory per display.

## Failure Cases

- If the saved position is invalid or missing, the launcher falls back to centered placement.
- If the OS refuses to move or restore the window, the launcher remains usable and centered.

## Acceptance Criteria

- The window can be moved by dragging the header in the real Electron app.
- The search field, buttons, and other interactive controls remain interactive.
- Moving the launcher and reopening it restores the last saved position.
