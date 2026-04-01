# Feature Spec: Native Window Size Parity

## Status

- Approved

## Problem

The design mockups for the launcher and settings do not reliably match the visible size of the real macOS windows, which makes visual iteration and spacing decisions inaccurate.

## User Value

- Designers can compare mockups against the real app without mentally compensating for scale differences.
- Launcher and settings layouts can be tuned against a stable, native-size reference.

## Scope

- In scope: make launcher and settings use explicit content-size dimensions as the source of truth on macOS.
- In scope: align the launcher and settings mockup documents to those same content dimensions.
- In scope: document the calibrated window sizes for design review.

## Out of Scope

- Redesigning launcher or settings layout.
- Adding window resizing controls or responsive behavior changes.
- Regenerating every design asset beyond the current launcher/settings mockup views.

## User Stories

- As a designer, I can open the launcher mockup and trust that it matches the real launcher size on macOS.
- As a designer, I can open the settings mockup and trust that it matches the real settings content size on macOS.

## Interaction Notes

- Trigger: open the real launcher or settings window on macOS, then compare it with the corresponding mockup page.
- Primary result behavior: the visible content frame in the mockup matches the native window content size used by Electron.
- Secondary actions: none.
- Empty states: none.
- Error states: if the OS cannot honor the requested bounds, the app remains usable and the documented size contract remains unchanged.

## Acceptance Criteria

- [ ] The launcher BrowserWindow uses the agreed content dimensions as its explicit size contract.
- [ ] The settings BrowserWindow uses the agreed content dimensions as its explicit size contract rather than relying on outer window bounds.
- [ ] `design/launcher-current-view.html` and `design/settings-current-view.html` state and render the same calibrated dimensions used by the real app.
- [ ] `docs/user-guide.md` mentions the calibrated native-size mockups for design comparison.

## Failure Cases

- If Electron or macOS applies different outer window chrome, the content area still targets the calibrated dimensions.
- If a mockup asset is replaced with a mismatched export, the HTML metadata must be updated before the slice is considered complete.

## Performance Expectations

- Window open time should remain unchanged in normal use because the change only adjusts window sizing semantics and mockup framing.

## Notes

- On macOS, Electron window `width` and `height` default to outer window bounds unless `useContentSize` is enabled.
