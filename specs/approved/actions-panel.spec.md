# Feature Spec: Actions Panel

## Status

- Approved

## Problem

Launcher actions are currently visible only as footer chips. Users need a dedicated, searchable action surface similar to mature launchers so they can discover and execute all available actions on the selected result.

## User Value

- Users can quickly inspect and run every action for the current result.
- Users can filter actions by typing instead of memorizing every shortcut.

## Scope

- In scope: opening the actions panel with `Cmd+K`
- In scope: listing the current result's actions with visible shortcuts
- In scope: filtering actions by typing inside the panel
- In scope: keyboard navigation and execution within the panel

## Out of Scope

- Global actions unrelated to the selected result
- Nested action groups
- User-defined action aliases

## User Stories

- As a user, I can press `Cmd+K` and inspect all actions for the selected result.
- As a user, I can type inside the actions panel to filter actions.
- As a user, I can execute the highlighted action with `Enter`.

## Interaction Notes

- The actions panel opens in context of the current selected result.
- Filtering is text-based on action label and shortcut text.
- `Esc` closes the panel and returns focus to the main query input.

## Acceptance Criteria

- [ ] `Cmd+K` opens an actions panel for the selected result.
- [ ] The panel lists the selected result's actions and their shortcuts.
- [ ] Typing while the panel is open filters the actions list.
- [ ] `Enter` executes the selected action from the panel.
- [ ] `Esc` closes the panel and restores the launcher to normal selection mode.

## Failure Cases

- If no result is selected, `Cmd+K` does nothing visibly disruptive and the launcher remains usable.

## Performance Expectations

- Opening and filtering the panel should feel immediate for the small local action set.

## Notes

- The panel should feel like part of the launcher, not a separate modal app.
