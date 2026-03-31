# Feature Spec: Scope Presets And Guidance

## Status

- Approved

## Problem

The current scopes settings expose raw editable paths, but they do not help users understand what scopes do, what they cost, or how to expand coverage safely to high-value locations like `~/Library`.

## User Value

- Users can expand search coverage quickly with presets instead of typing full paths manually.
- Users get lightweight guidance about index size, result noise, and when a scope is likely to be expensive.
- The scopes screen becomes easier to scan and modify.

## Scope

- In scope:
- Rework the `Scopes & Status` layout so the scopes editor is the main panel and explanatory guidance sits alongside it.
- Add one-click scope presets for `~/Library`, home, and `/`.
- Replace the current `Add Scope` behavior with an explicit add-path composer instead of immediately creating an empty scope row.
- Prevent duplicate preset insertion when the scope already exists.
- Add brief, visible copy about indexing cost, result noise, and the risk of indexing `/`.
- Show lightweight feedback when a scope is added and make the new row easy to discover.

## Out of Scope

- Automatic scope-size estimation.
- Native folder pickers.
- Per-scope exclusion rules.

## User Stories

- As a user, I can add `~/Library` without typing the path manually.
- As a user, I can understand that adding `/` will increase noise and indexing cost before I save it.
- As a user, I can scan my enabled scopes more easily in settings.

## Interaction Notes

- Trigger:
  Open `Scopes & Status`.
- Primary result behavior:
  Preset buttons append scopes only when they are not already configured.
- Secondary actions:
  Users can still add arbitrary scopes manually and enable or disable them individually.
- Empty states:
  None.
- Error states:
  Validation continues to reject empty paths as before.

## Acceptance Criteria

- [ ] `Scopes & Status` explains what scopes do and what broadening them costs.
- [ ] A user can add `~/Library` with one click.
- [ ] A user can add home or `/` with one click.
- [ ] Clicking `Add Scope` does not create an empty invalid row before the user enters a path.
- [ ] Clicking a preset that already exists does not add a duplicate scope.
- [ ] The `/` preset is visually described as the highest-cost option.

## Failure Cases

- If the home directory cannot be inferred from current settings, the presets must fall back safely instead of generating an empty path.

## Performance Expectations

- UI changes must not affect launcher runtime behavior until the user saves settings.

## Notes

- Guidance should stay concise and actionable, not read like documentation dumped into settings.
