# Test Plan: Deterministic Conversion Answers

## Status

- Approved

## Linked Spec

- `specs/approved/deterministic-conversions.spec.md`

## Coverage Strategy

- Unit: parser, alias handling, supported and unsupported cases
- Integration: conversion results rank above local search matches
- E2E: conversion query shows the expected answer

## Test Cases

- [ ] `30mph to kmh` returns `48.28 km/h`
- [ ] Unsupported units return no conversion result
- [ ] Conversion result ranks above local search matches

## Fixtures or Mocks

- None beyond the deterministic conversion library

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Library unit aliases may differ from user expectations; aliases are normalized in app code.
