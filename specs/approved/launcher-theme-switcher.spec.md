# Feature Spec: Launcher Theme Switcher

## Status

- Approved

## Problem

Northlight only ships a single launcher visual theme today. That makes it hard to iterate on alternative art direction while preserving the original look as a stable baseline.

## User Value

- Designers can keep the original launcher theme intact while iterating on a second variant.
- Theme comparison becomes immediate inside the launcher instead of requiring code edits and rebuild context switches.
- The alternative theme can become the designated design sandbox for future visual changes.

## Scope

- In scope: preserve the current theme as an explicit named theme.
- In scope: duplicate the current theme into a second named theme that starts visually identical.
- In scope: let the user switch between the two launcher themes from a clickable control in the top area of the launcher.
- In scope: persist the selected launcher theme in launcher settings.
- In scope: make the active theme apply to launcher mockups that use the shared renderer.

## Out of Scope

- Arbitrary user-created themes.
- Theme switching inside the settings window for this slice.
- Per-result or per-component theme overrides.
- Light mode.

## User Stories

- As a designer, I can switch between the original launcher theme and a duplicated editable theme from the launcher header.
- As a designer, I can keep making changes against the duplicated theme without mutating the original baseline.

## Interaction Notes

- Trigger: click a compact theme switcher control in the top area of the launcher.
- Primary result behavior: the launcher swaps between the original theme and the duplicated editable theme immediately.
- Secondary actions: reopening the launcher keeps the last selected theme.
- Empty states: none.
- Error states: if the stored theme id is missing or invalid, Northlight falls back to the original theme.

## Acceptance Criteria

- [ ] The existing launcher look is preserved as a named original theme.
- [ ] A second named launcher theme exists and initially matches the original theme exactly.
- [ ] The launcher header exposes a clickable control that switches between the two themes without opening settings.
- [ ] The selected launcher theme persists in launcher settings and is restored on relaunch.
- [ ] The shared-renderer launcher mockup can render against the duplicated editable theme as the active selection.

## Failure Cases

- If persisted launcher settings contain an unknown theme id, Northlight loads the original theme instead of crashing.
- If the theme switcher cannot persist immediately, the launcher still updates in memory for the current session and remains usable.

## Performance Expectations

- Theme switching should feel immediate and stay within normal launcher interaction latency.
- Switching themes must not trigger a full data refresh or search reset.

## Notes

- The duplicated editable theme should have a stable name that clearly distinguishes it from the untouched original theme.
- The original theme should remain a fixed baseline so later design requests can target the duplicate safely.
