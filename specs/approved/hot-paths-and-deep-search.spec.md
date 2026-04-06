# Hot Paths And Deep Search

## Summary

Northlight should not solve search churn by delaying everything. The right model is to make the most common launcher queries resolve immediately from a fast local layer, while broader and noisier locations continue to resolve in a slower background layer.

This slice introduces a split between:

- hot paths: locations and result classes that should feel near-instant
- deep search: broader, noisier, or heavier locations that may resolve slightly later

It also adds a settings control so the user can promote specific folders into the same fast-response tier as locations like `~/Desktop`.

## Problem

- Today, clipboard and recent selections often appear first because they are cheap to return.
- Meanwhile, common launcher targets such as apps or visible files can land later than they should.
- Broad scopes like `~/Library` or large home-directory trees should not dictate the latency of everyday queries.
- Users may have one or two important custom folders that deserve the same responsiveness as visible personal locations.

## Product Direction

Northlight should optimize for:

- immediate results for common, high-value launcher queries
- stable early results that already feel correct
- deeper results arriving later only when necessary

The goal is:

- 99% of daily launcher queries feel immediate
- the remaining 1% can resolve more slowly without degrading the first impression

## Scope

- In scope: define a hot-search tier for immediate app/file/path recall
- In scope: apps in `/Applications` and `/System/Applications` should belong to the hot tier
- In scope: direct macOS settings commands and deterministic calculations remain immediate
- In scope: visible personal locations such as `~/Desktop`, `~/Documents`, and `~/Downloads` should behave as hot paths by default
- In scope: frequently selected results remain immediate when applicable
- In scope: broader or noisier locations such as `~/Library`, hidden folders, and very large trees may continue resolving in a slower deep-search tier
- In scope: add a settings mechanism so the user can mark a custom folder as a hot path that should respond like `~/Desktop`
- In scope: ensure deep-search results expand the list without causing poor provisional matches to dominate the first rows

## Out Of Scope

- Out of scope: making every enabled scope respond with the same latency
- Out of scope: full filesystem indexing of the entire home directory as a hard requirement for immediacy
- Out of scope: removing access to `~/Library` or hidden/system locations entirely

## User-Visible Behavior

- Apps and macOS settings commands should appear immediately for common queries.
- Files in default visible personal locations should appear much faster than results buried in system/support paths.
- A user-designated hot folder should be treated like a first-class immediate search location.
- Deep/noisy locations can still contribute results, but they should not delay or destabilize the top rows for common queries.
- Clipboard and snippets should not outrank likely app/file answers simply because they are cheaper to fetch.

## Settings Behavior

- Settings should expose a way to promote specific folders into the hot tier.
- The user should be able to mark a custom path as “fast/immediate” or equivalent wording.
- Hot-path settings should be optional and additive; good defaults must still work without manual tuning.
- The UI should make the tradeoff clear: hot paths are optimized for fast everyday recall, deep paths are broader and may resolve later.

## Failure Cases

- Hot-path configuration must not make the launcher stall if the chosen folder becomes unavailable.
- A user should not need to manually classify every scope just to get acceptable launcher performance.
- Deep-search results must not override clearly better hot-path results after the user has already started acting on them.
- Promoting a giant folder to the hot tier should not silently degrade all typing responsiveness without any guardrails.

## Acceptance Criteria

- [ ] `/Applications` and `/System/Applications` behave as hot paths for app recall.
- [ ] `~/Desktop`, `~/Documents`, and `~/Downloads` behave as hot paths by default.
- [ ] macOS settings commands and deterministic calculations still appear immediately.
- [ ] A user can mark at least one custom folder in settings so it is treated as a hot path.
- [ ] Deep-search locations such as `~/Library` may resolve later without blocking hot-tier results.
- [ ] Common app/file queries no longer feel dominated by clipboard-first provisional results.
- [ ] Tests cover hot-tier defaults, promoted custom folders, and slower deep-tier behavior.

## Notes On Feasibility

- Expecting every enabled scope to feel instantaneous is not realistic once the user includes large or noisy locations.
- Expecting apps, settings, conversions, visible personal files, and promoted work folders to feel immediate is realistic and should be the standard.
