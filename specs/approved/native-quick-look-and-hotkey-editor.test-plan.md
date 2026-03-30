# Test Plan: Native Quick Look And Hotkey Editor

## Unit

- Launcher keyboard coverage for `ArrowRight` on a local result invoking Quick Look.

## Integration

- Saving settings updates the shortcut value in persisted launcher settings.
- Shortcut registration falls back safely if invalid.

## E2E

- Settings route shows the launcher shortcut editor.
- Actions panel for a local result includes `Quick Look`.
- Manual native verification: `ArrowRight` opens Quick Look on macOS and hides the launcher.
