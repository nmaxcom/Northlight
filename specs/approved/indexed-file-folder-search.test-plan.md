# Test Plan: Indexed File And Folder Search

## Status

- Approved

## Linked Spec

- `specs/approved/indexed-file-folder-search.spec.md`

## Coverage Strategy

- Unit: ranking and fixture-provider behavior
- Integration: combined result ordering in the launcher search engine
- E2E: preview search renders local results for known fixture queries

## Test Cases

- [ ] Empty and one-character queries return no local results
- [ ] Exact and prefix basename matches outrank looser matches
- [ ] File and folder fixture queries produce visible results in the UI

## Fixtures or Mocks

- Browser fixture search provider
- Spotlight IPC mocked in component tests by absence of preload bridge

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`

## Risks

- Real Spotlight ranking may differ slightly from fixture ranking; deterministic local re-ranking handles this.
