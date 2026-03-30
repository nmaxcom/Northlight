# Test Plan: Result Actions

## Status

- Approved

## Linked Spec

- `specs/approved/result-actions.spec.md`

## Coverage Strategy

- Unit: action model creation for local results and conversions
- Integration: selected-result footer updates with action hints
- E2E: action labels and keyboard hints appear for a local result and a conversion result

## Test Cases

- [ ] Local results expose open, reveal, and copy path
- [ ] Conversion results expose copy result
- [ ] Selected footer text changes with selected result kind

## Fixtures or Mocks

- Browser fallback runtime

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- OS integrations are not directly asserted in preview-mode e2e tests.
