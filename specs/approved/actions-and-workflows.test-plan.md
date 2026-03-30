# Test Plan: Actions, Finder Workflows, And Launcher Surface

## Status

- Approved

## Linked Spec

- `specs/approved/actions-and-workflows.spec.md`

## Coverage Strategy

- Unit: action grouping, footer hint selection, feedback state.
- Integration: action execution + hide behavior.
- E2E: actions panel UX, feedback rendering, Finder-related actions.

## Test Cases

- [ ] Primary action is clearly reflected in the footer and selected result.
- [ ] `Cmd+K` opens the richer actions panel and filter still works.
- [ ] Running a Finder-related action dismisses the launcher first.
- [ ] Success/error feedback appears after action execution.

## Fixtures or Mocks

- Mock failing and successful launcher bridge actions.

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- More visible actions can create visual clutter if not kept compact.
