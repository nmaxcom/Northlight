# Feature Spec: Extended Deterministic Calculations

## Status

- Approved

## Problem

Simple unit conversion is useful, but a launcher becomes significantly more valuable when it also resolves everyday deterministic queries like percentages, time zones, and currencies.

## User Value

- Users can answer common numeric and time questions instantly without switching contexts.

## Scope

- In scope: percentages such as `15% of 240`
- In scope: time-zone conversions such as `2pm CET in Tokyo`
- In scope: currency conversions backed by a deterministic local rate table fixture
- In scope: continued support for unit conversions

## Out of Scope

- Network-fetched live FX rates
- Natural-language date arithmetic beyond defined supported patterns
- AI-generated math explanations

## User Stories

- As a user, I can ask for a percentage calculation and copy the result.
- As a user, I can convert a time between named zones.
- As a user, I can convert a currency amount using a known rate table.

## Interaction Notes

- Deterministic calculation results should appear immediately when parsable.
- Calculation results keep the existing single-result action pattern with copy-on-enter.
- Unsupported formats fall through to normal search behavior.

## Acceptance Criteria

- [ ] Queries like `15% of 240` return a deterministic result.
- [ ] Queries like `2pm CET in Tokyo` return a deterministic time-zone result.
- [ ] Queries like `45 usd to eur` return a deterministic currency result from a local rate table.
- [ ] Unit conversions continue to work and share the same result model.

## Failure Cases

- If a deterministic query cannot be parsed, no calculation result is shown and local search still runs normally.

## Performance Expectations

- Calculation parsing and rendering should remain synchronous for supported patterns.

## Notes

- Currency support should be clearly labeled as deterministic local rates, not live market data.
