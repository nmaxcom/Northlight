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
- In scope: duration conversions such as `90 min to h`
- In scope: data-size conversions such as `2048 mb to gb`
- In scope: volume conversions such as `500ml to cup`
- In scope: compact early-detection suggestions such as `40F`, `20USD`, `90min`, and `2048MB`

## Out of Scope

- Network-fetched live FX rates
- Natural-language date arithmetic beyond defined supported patterns
- AI-generated math explanations

## User Stories

- As a user, I can ask for a percentage calculation and copy the result.
- As a user, I can convert a time between named zones.
- As a user, I can convert a currency amount using a known rate table.
- As a user, I can type a compact quantity like `40F` or `20USD` and see an obvious conversion before finishing the full expression.
- As a user, I can quickly convert durations, storage sizes, and kitchen-style volume units without changing tools.

## Interaction Notes

- Deterministic calculation results should appear immediately when parsable.
- Calculation results keep the existing single-result action pattern with copy-on-enter.
- Unsupported formats fall through to normal search behavior.
- Compact one-token quantities should emit suggested conversion results when the intent is clear and high-confidence.
- Suggested results should prefer obvious adjacent units such as `°F -> °C`, `USD -> EUR/GBP/JPY`, `MB -> GB/KB`, and `ml -> fl oz/cup`.

## Acceptance Criteria

- [ ] Queries like `15% of 240` return a deterministic result.
- [ ] Queries like `2pm CET in Tokyo` return a deterministic time-zone result.
- [ ] Queries like `45 usd to eur` return a deterministic currency result from a local rate table.
- [ ] Unit conversions continue to work and share the same result model.
- [ ] Queries like `90 min to h`, `2048 mb to gb`, and `500ml to cup` return deterministic conversion results.
- [ ] Compact inputs like `40F`, `20USD`, `90min`, and `2048MB` surface high-confidence suggested conversions before the expression is complete.
- [ ] Flexible aliases such as `9km/h to mi/h` resolve correctly and display friendly output labels.

## Failure Cases

- If a deterministic query cannot be parsed, no calculation result is shown and local search still runs normally.
- If a compact token is too ambiguous to classify confidently, Northlight should not invent a conversion suggestion.

## Performance Expectations

- Calculation parsing and rendering should remain synchronous for supported patterns.

## Notes

- Currency support should be clearly labeled as deterministic local rates, not live market data.
