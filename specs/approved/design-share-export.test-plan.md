# Test Plan: Shareable Self-Contained Current Design Export

## Status

- Approved

## Linked Spec

- `specs/approved/design-share-export.spec.md`

## Coverage Strategy

- Integration: export script emits one self-contained HTML file in the expected location.
- E2E: Playwright opens the exported file via `file://` and confirms the launcher renders at the correct dimensions.

## Test Cases

- [ ] `npm run export:design` emits one share HTML file for the current launcher design.
- [ ] The exported launcher HTML opens via `file://` without additional local asset files.
- [ ] The exported launcher preserves `1120×760`.
- [ ] The existing local renderer-backed launcher design page still works after export support is added.

## Pass Criteria

- `npm run typecheck`
- Relevant export script checks pass.
- Playwright validates the exported file over `file://`.

## Risks

- Inlining JS/CSS may break relative asset assumptions.
- Export artifacts can become stale if users forget to regenerate them after design changes.
