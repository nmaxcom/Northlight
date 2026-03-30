# Feature Spec: Deterministic Conversion Answers

## Status

- Approved

## Problem

Simple deterministic conversions should resolve inline without needing AI or an external service.

## User Value

- Users can type direct unit conversion expressions and get an instant answer in the result list.

## Scope

- In scope: unit conversions formatted as `<number><unit> to <unit>` and `<number><unit> in <unit>`
- In scope: common aliases such as `mph`, `kmh`, `c`, and `f`
- In scope: inline result formatting with a copy-result action

## Out of Scope

- Natural-language explanations
- Currency rates
- Multi-step formulas

## User Stories

- As a user, I can type `30mph to kmh` and see an inline conversion result.
- As a user, I can copy the converted value directly.

## Interaction Notes

- Valid deterministic conversions rank above local file results.
- Invalid conversions simply do not emit a conversion result.

## Acceptance Criteria

- [ ] Valid unit conversions produce a top-ranked conversion result.
- [ ] Result formatting is stable and trimmed to a concise decimal representation.
- [ ] Invalid or unsupported conversions do not throw and do not block local search.

## Failure Cases

- Unsupported units yield no conversion result.

## Performance Expectations

- Conversion parsing and formatting should be synchronous and immediate.

## Notes

- Initial supported unit families come from `convert-units`.
