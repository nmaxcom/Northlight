# Test Plan: Shareable Self-Contained Design Exports

## Status

- Approved

## Linked Spec

- `specs/approved/design-share-export.spec.md`

## Coverage Strategy

- Integration: export script emits self-contained HTML files in the expected location.
- E2E: Playwright opens the exported files via `file://` and confirms launcher/settings render at the correct dimensions.

## Test Cases

- [ ] `npm run export:design` emits launcher and settings share HTML files.
- [ ] Exported launcher HTML opens via `file://` without additional local asset files.
- [ ] Exported settings HTML opens via `file://` without additional local asset files.
- [ ] Exported launcher preserves `1120×760`.
- [ ] Exported settings preserves `980×760`.
- [ ] Existing local renderer-backed design pages still work after export support is added.

## Pass Criteria

- `npm run typecheck`
- Relevant export script checks pass.
- Playwright validates the exported files over `file://`.

## Risks

- Inlining JS/CSS may break relative asset assumptions.
- Export artifacts can become stale if users forget to regenerate them after design changes.
