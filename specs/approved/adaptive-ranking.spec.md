# Feature Spec: Adaptive Ranking

## Status

- Approved

## Problem

Static text matching is not enough for a launcher. Users expect the result they repeatedly pick to rise to the top, even when other paths also match the query.

## User Value

- Frequently used files, folders, and apps become the default result faster.
- The launcher learns local habits without needing manual pinning.

## Scope

- In scope: local recency and frequency tracking for file, folder, and app results
- In scope: ranking boosts applied on top of text matching
- In scope: persistence of learned ranking data between launches

## Out of Scope

- Cloud sync of ranking data
- User-visible pinning or favorites UI
- AI-based ranking

## User Stories

- As a user, I can repeatedly open the same app for a short query and see it rise to the top.
- As a user, I can reopen a recently used file and have it outrank weaker textual matches.

## Interaction Notes

- Ranking data updates after successful primary actions.
- Recency and frequency both influence the final score.
- Learned boosts must never make unrelated non-matches appear.

## Acceptance Criteria

- [ ] Primary actions on local results persist ranking signals locally.
- [ ] Repeatedly chosen results outrank otherwise similar matches for the same query.
- [ ] Recently selected results receive a temporary boost above older selections.
- [ ] The learned ranking data is loaded on startup and survives relaunches.

## Failure Cases

- If ranking data cannot be read or written, search still works with plain textual ranking.

## Performance Expectations

- Learned ranking must add negligible overhead to query-time sorting.

## Notes

- The ranking store should stay local, compact, and deterministic.
