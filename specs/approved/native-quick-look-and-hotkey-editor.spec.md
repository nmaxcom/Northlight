# Feature Spec: Native Quick Look And Hotkey Editor

## Goal

Add a real macOS Quick Look action for local results and expose the launcher shortcut as an editable preference in settings.

## User-Visible Behavior

- Local files, folders, and apps expose a `Quick Look` action.
- `ArrowRight` triggers native Quick Look for the selected local result.
- Quick Look hides the launcher before showing the native preview surface.
- The settings window includes a launcher shortcut field.
- Saving a valid launcher shortcut re-registers the global shortcut immediately.
- The launcher header displays the current launcher shortcut instead of a hardcoded label.

## Non-Goals

- Editing arbitrary per-action shortcuts.
- Custom Quick Look shortcuts beyond the built-in `ArrowRight` result action.
- Packaging-level OS shortcut settings outside the app.

## Failure Cases

- If the selected result is not a local path, Quick Look does nothing.
- If Quick Look cannot be opened, the launcher shows an error feedback message and remains usable.
- If a shortcut cannot be registered, the app keeps the previous valid shortcut.

## Acceptance Criteria

- `ArrowRight` on a local result invokes native Quick Look.
- Quick Look is visible as an action in the actions panel for local results.
- The settings window shows and saves the launcher shortcut field.
- Reopening settings reflects the saved launcher shortcut.
- The launcher status area reflects the current shortcut text.
