# Test Plan: Keyboard Navigation And Selection Model

## Status

- Approved

## Linked Spec

- `specs/approved/keyboard-selection-model.spec.md`

## Coverage Strategy

- Unit: none required beyond action model
- Integration: component tests for selection changes and reset behavior
- E2E: keyboard navigation changes the active row and shows updated footer hints

## Test Cases

- [ ] ArrowDown and ArrowUp move selection and wrap
- [ ] Typing a new query resets selection to the first result
- [ ] Footer hints follow the selected result

## Fixtures or Mocks

- Browser fallback runtime

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Modifier-key e2e coverage is weaker in preview mode than in Electron proper.
