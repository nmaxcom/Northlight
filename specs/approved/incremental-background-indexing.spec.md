# Feature Spec: Incremental Background Indexing

## Status

- Approved

## Problem

Cold-start index refreshes and full rebuilds make local search feel inconsistent. The launcher should keep a warmed index current in the background.

## User Value

- Search remains fast after startup.
- New and changed files appear without forcing a heavy synchronous rebuild during search.

## Scope

- In scope: background refresh of the persisted local index
- In scope: incremental updates for known roots by scanning and merging changes
- In scope: query-time use of the last good persisted index while refresh is running

## Out of Scope

- Real-time filesystem watcher coverage for every possible location
- Cloud-provider specific sync hooks
- Spotlight-only implementation requirements

## User Stories

- As a user, I can open the launcher immediately after startup and still search from the last good index.
- As a user, I can benefit from refreshed search data after background indexing completes.

## Interaction Notes

- Query-time search should use the current in-memory or persisted index immediately.
- Background refresh must not blank out existing results or persist an empty index over a valid one.

## Acceptance Criteria

- [ ] Startup restores the last valid persisted index before any rebuild completes.
- [ ] Background indexing refreshes the in-memory index without blocking search.
- [ ] Empty or failed refreshes do not overwrite a valid persisted index.
- [ ] Query caches are invalidated when a successful refresh completes.

## Failure Cases

- If a refresh fails, the launcher keeps the last valid index and continues serving search from it.

## Performance Expectations

- The launcher should remain searchable during refresh and avoid query-time filesystem crawls in the common path.

## Notes

- Incremental means merge/update behavior over a retained index, not a fresh synchronous crawl on each query.
