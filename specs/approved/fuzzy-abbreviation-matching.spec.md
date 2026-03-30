# Feature Spec: Fuzzy Abbreviation Matching

## Status

- Approved

## Problem

Users do not type exact names in a launcher. They use prefixes, abbreviations, initials, and slightly imperfect strings like `btt` or `fig`.

## User Value

- Short and imperfect queries still reach the intended top result quickly.

## Scope

- In scope: fuzzy basename matching for files, folders, and apps
- In scope: abbreviation and initial-based matching
- In scope: app-name normalization that strips `.app`

## Out of Scope

- Spell-correction suggestions UI
- Deep typo tolerance across path segments
- Fuzzy content search inside files

## User Stories

- As a user, I can type `btt` and match `BetterTouchTool.app`.
- As a user, I can type `fig` and match `Figma.app`.
- As a user, I can type a slightly incomplete name and still see the likely result.

## Interaction Notes

- Exact and prefix matches still outrank fuzzy matches.
- Fuzzy matches must be strong enough to feel useful but not so broad that they swamp exact results.

## Acceptance Criteria

- [ ] Abbreviation queries can match multi-word and camel-like names.
- [ ] `.app` suffixes do not block app matches.
- [ ] Fuzzy matches rank below exact and prefix matches but above weak path-only matches.
- [ ] Fuzzy scoring applies consistently in both cached and async search paths.

## Failure Cases

- If no fuzzy match crosses the threshold, the launcher shows normal empty-state behavior.

## Performance Expectations

- Fuzzy scoring must stay cheap enough to run across the in-memory local index.

## Notes

- The fuzzy implementation should remain deterministic and testable.
