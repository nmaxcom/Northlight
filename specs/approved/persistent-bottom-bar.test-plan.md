# Test Plan: Persistent Bottom Bar

## Status

- Approved

## Linked Spec

- `specs/approved/persistent-bottom-bar.spec.md`

## Coverage Strategy

- Unit: bottom-bar copy and state selection helpers
- Integration: launcher footer rendering across empty, result, and actions-open states
- E2E: browser preview validates that the bar stays visible and updates with selection

## Test Cases

- [ ] Empty state renders idle guidance plus `Actions`
- [ ] Selected result renders the primary action label and shortcut
- [ ] `Cmd+K` trigger is always visible
- [ ] Arrow-key selection updates the bottom bar content

## Fixtures or Mocks

- Existing fixture results

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Footer styling can regress visually without breaking core functionality
