# Test Plan: Launcher Theme Switcher

## Status

- Approved

## Linked Spec

- `specs/approved/launcher-theme-switcher.spec.md`

## Coverage Strategy

- Unit: theme id normalization and fallback to the original theme.
- Integration: launcher settings persistence and renderer application of the selected theme.
- E2E: click the launcher header theme control, switch themes, and confirm persistence after reopening.

## Test Cases

- [ ] Default settings resolve to the original launcher theme.
- [ ] An invalid persisted theme id falls back to the original theme.
- [ ] Clicking the launcher header theme switcher updates the active theme without clearing the current query or results.
- [ ] Reopening the launcher restores the previously selected theme.
- [ ] Shared-renderer launcher mockups can be rendered with the duplicated editable theme selected.

## Fixtures or Mocks

- Persisted launcher settings fixture containing both a valid and invalid theme id.

## Pass Criteria

- `npm run test:unit` passes.
- Manual launcher verification confirms the click target is reachable and the theme switches immediately.
- Manual design-route verification confirms the launcher mockup reflects the selected editable theme.

## Risks

- Header space is constrained, so the theme switcher may compete with status badges if it is not designed compactly.
- If theme tokens are scattered instead of centralized, visual parity between the original and duplicated theme may drift.
