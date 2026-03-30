# Test Plan: Adaptive Ranking

## Status

- Approved

## Linked Spec

- `specs/approved/adaptive-ranking.spec.md`

## Coverage Strategy

- Unit: recency/frequency score calculation and persistence helpers
- Integration: combined search ordering after recording selections
- E2E: not required in browser preview because the core behavior is deterministic and covered in unit/integration tests

## Test Cases

- [ ] Repeated selections increase the rank of a matching item
- [ ] A more recent selection outranks an older equally frequent item
- [ ] Ranking data survives a save/load cycle
- [ ] Missing ranking data falls back to plain search ordering

## Fixtures or Mocks

- In-memory ranking fixtures with deterministic timestamps
- Temporary ranking-store paths for persistence tests

## Pass Criteria

- `npm run verify`

## Risks

- Time-based ranking can become flaky without deterministic clocks
