# Settings Shell And Tabs Refresh Test Plan

## Unit

- Extend `SettingsView` tests to cover the persistent tab chrome outside the scrolled content area.
- Verify the active tab state still switches content correctly after the layout change.
- Verify button state classes or attributes reflect saving, disabled, and active states as expected.

## Integration

- Verify the settings renderer keeps all interactive controls in non-drag regions while the shell header exposes a drag region.
- Verify tab clicks still change sections without mutating settings unexpectedly.

## End-To-End

- Use Playwright to confirm the settings route renders persistent tabs outside the content scroll region.
- Use Playwright to verify tab switching works after scrolling section content.
- Use Playwright to verify updated button hover/pressed/focus states are present in the shared settings design route.
- If practical in the existing Electron e2e setup, verify the native settings header exposes a drag region without breaking control clicks.

## Manual

- Open the native settings window and drag it by the header.
- Confirm save buttons, tabs, toggles, and fields remain interactive and never initiate a drag.
- Scroll long sections and confirm the tab chrome remains visible.
- Open the shared settings mockup and confirm the same layout and interactions are present there.
