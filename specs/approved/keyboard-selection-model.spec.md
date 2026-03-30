# Feature Spec: Keyboard Navigation And Selection Model

## Status

- Approved

## Problem

The launcher needs predictable keyboard behavior so users can stay in flow without touching the mouse.

## User Value

- Users can move through results, understand what is selected, and trigger actions reliably.

## Scope

- In scope: arrow-key result movement
- In scope: selection reset on query change
- In scope: Enter, Command+Enter, Command+Shift+C, and Escape behavior
- In scope: visible selected-row styling and footer hints

## Out of Scope

- Multi-column navigation
- Vim bindings
- User-configurable keymaps

## User Stories

- As a user, I can move up and down the result list with the keyboard.
- As a user, I can trigger the right action for the currently selected result.
- As a user, I can dismiss the launcher with Escape.

## Interaction Notes

- Down and up arrows wrap within the current result list.
- Query changes reset selection to the first result.
- Escape hides the launcher when available.

## Acceptance Criteria

- [ ] Arrow keys change the selected result.
- [ ] Selection wraps from bottom to top and top to bottom.
- [ ] Query changes reset selection to the first visible result.
- [ ] Enter and modifier shortcuts act on the selected result.

## Failure Cases

- If no result is selected, action keys do nothing.

## Performance Expectations

- Selection updates should feel immediate and not cause focus loss from the input.

## Notes

- Footer hints mirror the currently selected result actions.
