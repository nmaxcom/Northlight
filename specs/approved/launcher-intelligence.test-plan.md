# Test Plan: Launcher Intelligence And Ranking

## Status

- Approved

## Linked Spec

- `specs/approved/launcher-intelligence.spec.md`

## Coverage Strategy

- Unit: ranking, alias resolution, scope filtering, icon-color mapping.
- Integration: runtime/settings persistence and merged result ordering.
- E2E: visible best match, alias resolution, settings-driven scope updates.

## Test Cases

- [ ] Alias results outrank fuzzy file matches and run the intended target.
- [ ] App candidates outrank similar file/folder matches.
- [ ] Best match renders separately while list navigation still works.
- [ ] Result icon tiles expose stable kind classes/colors.
- [ ] Scope changes in settings affect subsequent search results.
- [ ] Recency/frequency changes persist across a reload.

## Fixtures or Mocks

- Mock local items including app/file/folder name collisions.
- Persisted settings fixture with aliases and custom scopes.
- Rank store fixture with recent launches.

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`
- Visual confirmation of best-match section and icon colors in Electron.

## Risks

- Ranking shifts are easy to overfit and need stable fixture coverage.
