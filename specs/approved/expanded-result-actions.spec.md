# Feature Spec: Expanded Result Actions

## Status

- Approved

## Problem

Users need more than open and reveal. A launcher becomes far more useful when common secondary actions are available without leaving the keyboard.

## User Value

- Users can act on a result immediately without switching apps or opening context menus elsewhere.

## Scope

- In scope: `Copy Name`, `Open In Terminal` for folders, and `Move To Trash`
- In scope: `Open With…` for files and apps using a deterministic fallback choice
- In scope: action rendering and keyboard hints in the footer

## Out of Scope

- Full app-picker UI for every installed application
- Destructive bulk actions
- Undo UI for trash operations

## User Stories

- As a user, I can copy only a file or folder name.
- As a user, I can open a folder in Terminal.
- As a user, I can move a local result to Trash.
- As a user, I can open a file with a secondary app.

## Interaction Notes

- Actions that hand off to Finder, Terminal, or another app dismiss the launcher.
- Actions must be type-aware and only appear when valid for the selected result kind.

## Acceptance Criteria

- [ ] Local file and folder results expose `Copy Name`.
- [ ] Folder results expose `Open In Terminal`.
- [ ] File, folder, and app results expose `Move To Trash`.
- [ ] File results expose an `Open With Default Editor` style secondary action.

## Failure Cases

- If a secondary action cannot be completed, the launcher stays stable and other actions continue to work.

## Performance Expectations

- Expanding the action list must not delay result rendering.

## Notes

- Trash must use recoverable deletion, not permanent removal.
