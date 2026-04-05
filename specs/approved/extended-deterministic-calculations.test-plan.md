# Test Plan: Extended Deterministic Calculations

## Status

- Approved

## Linked Spec

- `specs/approved/extended-deterministic-calculations.spec.md`

## Coverage Strategy

- Unit: parsing and formatting for percentage, timezone, currency, and unit queries
- Unit: compact early-suggestion parsing for temperatures, currencies, durations, data sizes, and volumes
- Integration: merged result ordering with local search
- E2E: browser preview verifies at least one example of each supported deterministic class

## Test Cases

- [ ] `15% of 240` returns `36`
- [ ] `2pm CET in Tokyo` returns a deterministic converted time
- [ ] `45 usd to eur` returns a deterministic currency result
- [ ] Existing unit conversion queries still work
- [ ] `9km/h to mi/h` resolves with friendly `mi/h` output
- [ ] `90 min to h`, `2048 mb to gb`, and `500ml to cup` return deterministic results
- [ ] `40F` emits a suggested Celsius conversion without needing `to C`
- [ ] `20USD` emits suggested EUR/GBP/JPY conversions without needing `to`
- [ ] Common compact units across length, mass, area, temperature, speed, duration, data size, volume, and currency all produce at least one high-confidence quick conversion

## Fixtures or Mocks

- Local FX rate table
- Deterministic timezone parsing expectations using named zones
- Explicit quick-conversion matrix covering all supported compact unit families

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Time-zone formatting can become brittle if locale output is not normalized
