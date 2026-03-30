# Feature Spec: Result Actions

## Status

- Approved

## Problem

Search results are only useful if the launcher makes the right next action obvious and fast.

## User Value

- Users can open a result, reveal it in Finder, or copy its path without leaving the launcher flow.

## Scope

- In scope: primary action for files, folders, apps, and conversions
- In scope: secondary Finder reveal action for local path results
- In scope: copy-path action for local path results
- In scope: visible action hints in the UI

## Out of Scope

- Context menus
- Multi-step action panels
- Custom user-defined actions

## User Stories

- As a user, I can press Enter to trigger the default action on the selected result.
- As a user, I can reveal a selected local result in Finder.
- As a user, I can copy the path of a selected local result.

## Interaction Notes

- Enter triggers the primary action.
- Command+Enter triggers the secondary action when available.
- Command+Shift+C copies the path for selected local results.
- Actions are visible in the footer for the selected result.

## Acceptance Criteria

- [ ] Local path results expose open, reveal, and copy-path actions.
- [ ] Conversion results expose copy-result as the primary action.
- [ ] Keyboard hints are visible for the selected result.
- [ ] Browser fallback keeps action invocations safe and non-destructive.

## Failure Cases

- If an OS action fails, the launcher remains usable and no destructive fallback runs.

## Performance Expectations

- Triggering an action should not block the UI from remaining responsive.

## Notes

- Browser preview can no-op open and reveal actions while still exposing the action model.
