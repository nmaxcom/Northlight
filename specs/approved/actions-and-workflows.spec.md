# Feature Spec: Actions, Finder Workflows, And Launcher Surface

## Status

- Approved

## Problem

The launcher has actions, but they are still too hidden and too weak to carry real workflows. Finder-integrated file handling, visible action affordances, and a serious actions panel are needed for the launcher to feel complete.

## User Value

- The next available action is obvious.
- Users can stay inside Northlight longer before switching to Finder or another app.
- The actions panel becomes a core workflow surface instead of a secondary detail.

## Scope

- In scope:
- Make action affordances more visible in the main surface and bottom bar.
- Upgrade the actions panel into a clearer, richer command surface.
- Add stronger Finder/file-system actions where appropriate.
- Keep the launcher integrated with Finder-reveal/open flows instead of custom folder drilldown.

## Out of Scope

- Arbitrary shell command execution.
- Third-party workflow extensions.

## User Stories

- As a user, I can understand at a glance what `Enter` will do.
- As a user, I can open the actions panel and treat it like a second-level command menu.
- As a user, I can execute Finder-oriented actions without leaving the launcher blindly.

## Interaction Notes

- Trigger: result selection and `Cmd+K`.
- Primary result behavior: visible in the bottom bar and reflected in the best match.
- Secondary actions: grouped clearly, filterable, keyboard-first.
- Empty states: if no result is selected, the bottom bar explains how to start.
- Error states: failing actions surface a lightweight error toast/feedback state.

## Acceptance Criteria

- [ ] The bottom bar and/or result surface make the primary action clearer than before.
- [ ] The actions panel supports grouped or more legible actions without losing keyboard filtering.
- [ ] Finder-related actions are present where appropriate and hide the launcher before running.
- [ ] Action execution produces brief success/error feedback.

## Failure Cases

- Missing files become disabled or erroring actions instead of crashing the panel.
- If Finder actions fail, the user gets lightweight feedback and the launcher remains usable.

## Performance Expectations

- Opening the actions panel remains instant from the current selection.
- Visible action hints should not trigger extra async work on every render.

## Notes

- This spec intentionally keeps Finder as the canonical file browser instead of reintroducing folder drilldown.
