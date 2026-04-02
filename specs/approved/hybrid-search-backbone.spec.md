# Feature Spec: Hybrid Search Backbone

## Status

- Approved

## Problem

Northlight still relies too heavily on a custom local catalog and targeted filesystem scans for file recall. That keeps search quality tied to refresh state and makes wide coverage expensive. The launcher also needs richer intent parsing and stronger, more explicit result actions without turning the input into a command line.

## User Value

- Users get broader macOS file, folder, and app recall without waiting for full local re-indexes.
- Users can refine a broad query with lightweight hints such as `img`, `pdf`, `in:library`, `in:/Users/me/Projects`, or `today`.
- Users can understand and run the most important action for each result faster.

## Scope

- In scope: a hybrid local search backbone that combines Spotlight recall with a persisted Northlight catalog
- In scope: provider-based local search orchestration in Electron
- In scope: catalog hydration, persistence, and selection-aware ranking signals
- In scope: second-level intents for type, scope, and time, including explicit `in:/absolute/path` and `in:~/path` refiners
- In scope: action descriptors that resolve into the visible launcher actions
- In scope: launcher and settings copy updates that explain hybrid coverage and catalog state

## Out Of Scope

- Full document content search
- Third-party plugin providers
- Arbitrary shell execution from the launcher
- A full visual query builder

## User Stories

- As a user, I can search broadly and still get strong file, folder, and app results even when my local catalog is still hydrating.
- As a user, I can add `in:downloads`, `in:library`, `in:/Users/me/Projects`, `today`, or `img` to tighten a search without learning a complex syntax.
- As a user, I can tell what `Enter` will do for the selected result and access stronger secondary actions when needed.
- As a user, I can understand from settings and status whether Northlight is using hybrid search coverage and whether the local catalog is ready.

## Interaction Notes

- Free-form search remains the default. Intents are optional refiners.
- Spotlight is the primary recall source for local file, folder, and app candidates on macOS.
- The Northlight catalog enriches ranking with local recency and acts as offline or degraded fallback.
- The launcher keeps deterministic providers such as commands, conversions, aliases, snippets, and clipboard items in the composed result set.
- Very broad scopes still influence catalog hydration and fallback scanning, but stable queries must not trigger full rebuild loops.

## Acceptance Criteria

- [ ] Electron local search uses a provider orchestrator instead of a single monolithic indexed-search path.
- [ ] A Spotlight-backed provider supplies local file, folder, and app candidates on macOS.
- [ ] The persisted local index is replaced or upgraded into a catalog with hydration state and selection-aware ranking metadata.
- [ ] Stable non-empty queries do not trigger full catalog rebuilds on each search pass.
- [ ] Intent parsing supports type refiners, `in:<scope>` refiners, explicit `in:/absolute/path` and `in:~/path` refiners, and time refiners such as `today`, `yesterday`, and `recent`.
- [ ] `recent` is defined as the last 7 days by modification time, while `today` and `yesterday` follow local calendar-day boundaries.
- [ ] Result actions are resolved from typed action descriptors rather than hand-built inline action arrays per result.
- [ ] The launcher status and settings copy reflect hybrid coverage and catalog state.

## Failure Cases

- If Spotlight lookup fails or times out, the launcher still returns deterministic results and can fall back to the local catalog plus narrow safe scans.
- If the catalog cannot be persisted, in-memory results still work for the current session.
- If an intent expression is ambiguous or conflicting, Northlight preserves the query as plain text instead of applying a broken filter.

## Performance Expectations

- Stable queries must not cause repeated background rebuilds.
- Spotlight-backed recall should feel immediate for top results.
- Catalog hydration can continue in the background, but it must not force visible result flashes or sustained CPU churn for a stable query.

## Notes

- This slice keeps macOS as the primary target and intentionally leans on Spotlight for broad recall.
