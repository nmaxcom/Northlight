# Test Plan: Settings Window And Preferences

## Status

- Approved

## Linked Spec

- `specs/approved/settings-and-preferences.spec.md`

## Coverage Strategy

- Unit: settings validation, alias/snippet/scope parsing.
- Integration: preload/main-process settings persistence and hydration.
- E2E: settings window open, edit, save, relaunch-like persistence behavior.

## Test Cases

- [ ] Settings window opens from a launcher action or shortcut.
- [ ] Alias, snippet, and scope entries can be added and validated.
- [ ] Preview and clipboard toggles persist and affect launcher behavior.
- [ ] Settings survive a reload via persisted native storage.

## Fixtures or Mocks

- Temporary settings store file.
- Invalid-path and duplicate-alias fixtures.

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`
- Manual Electron check that settings window opens and applies changes.

## Risks

- Native persistence and multi-window coordination are easy to regress without integration coverage.
