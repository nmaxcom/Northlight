# Test Plan: Incremental Background Indexing

## Status

- Approved

## Linked Spec

- `specs/approved/incremental-background-indexing.spec.md`

## Coverage Strategy

- Unit: persisted-index restore, merge, and overwrite guards
- Integration: search remains available while a refresh promise is in flight
- E2E: not required because behavior is primarily service-level and timing-sensitive

## Test Cases

- [ ] Valid persisted index is loaded before refresh completion
- [ ] Failed refresh preserves the previous valid index
- [ ] Successful refresh clears stale query caches
- [ ] Search can return results while a refresh is still running

## Fixtures or Mocks

- Temporary persisted index files
- Fake refresh routines returning success, failure, and empty outputs

## Pass Criteria

- `npm run verify`

## Risks

- Timing races between restore and refresh need explicit control in tests
