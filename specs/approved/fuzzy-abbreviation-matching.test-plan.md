# Test Plan: Fuzzy Abbreviation Matching

## Status

- Approved

## Linked Spec

- `specs/approved/fuzzy-abbreviation-matching.spec.md`

## Coverage Strategy

- Unit: fuzzy and abbreviation scoring helpers
- Integration: final search ordering for exact, prefix, fuzzy, and path-only matches
- E2E: browser fixture query proves at least one fuzzy result path in the UI

## Test Cases

- [ ] `btt` matches `BetterTouchTool.app`
- [ ] `fig` matches `Figma.app`
- [ ] Exact match outranks fuzzy match
- [ ] Weak path-only match stays below a valid fuzzy basename match

## Fixtures or Mocks

- Local fixtures including apps and mixed-strength matches

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Fuzzy rules can overmatch if thresholds are too loose
