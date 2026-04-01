# Test Plan: Hybrid Search Backbone

## Status

- Approved

## Linked Spec

- `specs/approved/hybrid-search-backbone.spec.md`

## Coverage Strategy

- Unit: intent parsing, provider normalization, catalog ranking signals, action descriptor resolution
- Integration: provider orchestration, Spotlight fallback behavior, query composition, launcher result ordering
- E2E: local launcher flows with intents and stronger actions

## Unit Cases

- [ ] Intent parsing handles trailing type, scope, and time refiners across ambiguous and conflicting cases.
- [ ] Search intent keys stay stable across equivalent refiner combinations.
- [ ] Catalog ranking lifts selected and recent paths without overriding stronger exact matches incorrectly.
- [ ] Provider result normalization deduplicates the same path returned by multiple providers.
- [ ] Action descriptors resolve to the expected primary and secondary launcher actions by result kind.

## Integration Cases

- [ ] Spotlight-backed candidates and catalog candidates merge into one ranked local result set.
- [ ] If Spotlight errors or times out, catalog and targeted fallback search still return results without crashing.
- [ ] `chrome app`, `invoice pdf`, `config json in:library`, and `report today` pass structured intent into local search.
- [ ] Stable non-empty queries do not schedule catalog rebuilds or refresh loops.

## E2E Cases

- [ ] Typing `chrome` shows a primary launch action and stable result list.
- [ ] Typing `project/` narrows to folders.
- [ ] Typing `invoice pdf` narrows to PDFs.
- [ ] Typing `config json in:library` applies both type and scope hints.
- [ ] Opening the actions panel still works with the resolved action model.

## Pass Criteria

- `npm run verify`
- `npm run test:e2e` if the changed flows are covered in Playwright during this slice

## Risks

- Spotlight output can differ slightly across machines, so tests must mock provider output rather than assert raw system ordering.
- Scope and time refiners can become fragile if they are parsed too aggressively; ambiguous expressions must stay literal.
