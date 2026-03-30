# Test Plan: Actions Panel

## Status

- Approved

## Linked Spec

- `specs/approved/actions-panel.spec.md`

## Coverage Strategy

- Unit: action filtering helper
- Integration: opening, filtering, navigating, and closing the panel in the launcher
- E2E: browser preview validates `Cmd+K`, visible action list, and filtered execution flow

## Test Cases

- [ ] `Cmd+K` opens the actions panel for a selected result
- [ ] Typing filters actions in the panel
- [ ] Arrow keys move within the filtered actions list
- [ ] `Enter` executes the highlighted action
- [ ] `Esc` closes the panel and returns focus to the search input

## Fixtures or Mocks

- Mock launcher bridge methods for action execution
- Fixture results with multiple actions

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Keyboard routing between the main result list and the actions panel can regress if not tested directly
