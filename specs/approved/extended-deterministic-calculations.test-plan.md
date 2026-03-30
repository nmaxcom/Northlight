# Test Plan: Extended Deterministic Calculations

## Status

- Approved

## Linked Spec

- `specs/approved/extended-deterministic-calculations.spec.md`

## Coverage Strategy

- Unit: parsing and formatting for percentage, timezone, currency, and unit queries
- Integration: merged result ordering with local search
- E2E: browser preview verifies at least one example of each supported deterministic class

## Test Cases

- [ ] `15% of 240` returns `36`
- [ ] `2pm CET in Tokyo` returns a deterministic converted time
- [ ] `45 usd to eur` returns a deterministic currency result
- [ ] Existing unit conversion queries still work

## Fixtures or Mocks

- Local FX rate table
- Deterministic timezone parsing expectations using named zones

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Time-zone formatting can become brittle if locale output is not normalized
