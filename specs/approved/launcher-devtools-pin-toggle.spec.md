# Feature Spec: Launcher DevTools Pin Toggle

## Status

- Approved

## Problem

Northlight can now open detached DevTools with a shortcut, but the launcher still auto-hides on blur and click-away. That makes CSS inspection awkward because interacting with DevTools or another app dismisses the launcher before the issue can be examined.

## User Value

- The launcher exposes an explicit inspect toggle in its own header.
- The same inspect mode can be toggled from the keyboard with `Cmd+Shift+J`.
- While inspect mode is active, the launcher stays visible so CSS issues can be inspected in the real Electron window.

## Scope

- In scope:
- Add a visible inspect toggle to the launcher header.
- Make the header toggle and `Cmd+Shift+J` drive the same launcher inspect mode.
- Open detached Chromium DevTools for the launcher when inspect mode turns on.
- Keep the launcher visible while inspect mode is on by suppressing blur and click-away dismissal.
- Reflect inspect mode state back into the launcher UI.

## Out of Scope

- Adding a separate inspect toggle to settings.
- Building a custom in-app inspector.
- Changing the launcher design mockup flow beyond showing the same toggle affordance.

## User Stories

- As a designer, I can click an inspect toggle in the launcher and keep the launcher open while I inspect CSS in DevTools.
- As a keyboard user, I can hit `Cmd+Shift+J` and get the same inspect mode without touching the mouse.

## Interaction Notes

- The inspect toggle should live in the launcher header near the existing theme control.
- Turning inspect mode on should open detached DevTools and leave the launcher visible.
- Turning inspect mode off should close launcher DevTools and restore normal hide-on-blur behavior.
- If the detached DevTools window is closed manually, the launcher should leave inspect mode automatically.

## Acceptance Criteria

- [ ] The launcher header shows an inspect toggle.
- [ ] Clicking the inspect toggle turns inspect mode on and off.
- [ ] `Cmd+Shift+J` toggles the same inspect mode state.
- [ ] When inspect mode is on, the launcher does not hide on blur or click-away.
- [ ] When inspect mode turns off, the launcher returns to normal blur/click-away dismissal.
- [ ] Closing detached DevTools manually also turns inspect mode off.
- [ ] The new toggle is documented in `docs/user-guide.md`.

## Failure Cases

- If DevTools cannot be opened, inspect mode should fail safely instead of leaving the launcher in a fake pinned state.
- If the launcher window is not available, the shortcut should do nothing instead of throwing.

## Performance Expectations

- Toggling inspect mode should feel immediate.
- The pinned state should not affect normal launcher search latency when it is off.
