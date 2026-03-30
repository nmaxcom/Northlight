# Test Plan: Expanded Result Actions

## Status

- Approved

## Linked Spec

- `specs/approved/expanded-result-actions.spec.md`

## Coverage Strategy

- Unit: action-list generation by result kind
- Integration: keyboard invocation and dismiss-on-run behavior for new actions
- E2E: browser preview verifies action labels surface for known fixture types

## Test Cases

- [ ] Folder results include `Open In Terminal`
- [ ] File and folder results include `Copy Name`
- [ ] Local results include `Move To Trash`
- [ ] New dismissing actions still hide the launcher after invocation

## Fixtures or Mocks

- Mock bridge methods for trash, terminal, and open-with actions

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Some OS-level actions are easier to validate through mock invocation than deep end-to-end automation
