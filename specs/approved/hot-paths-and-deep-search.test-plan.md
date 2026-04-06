# Test Plan: Hot Paths And Deep Search

## Unit

- [ ] search configuration tests for hot-path defaults:
  - `/Applications`
  - `/System/Applications`
  - `~/Desktop`
  - `~/Documents`
  - `~/Downloads`
- [ ] settings tests for promoting a custom folder into the hot tier
- [ ] ranking tests that prefer hot-tier app/file matches over clipboard/snippet noise

## Integration

- [ ] query tests showing immediate/high-priority recall for:
  - apps
  - system settings commands
  - deterministic calculations
  - visible personal files
- [ ] query tests showing that deep-tier paths can still contribute results without dominating early rows

## Settings UI

- [ ] `SettingsView` tests for:
  - marking a scope as hot/immediate
  - preserving the setting across saves
  - clear labeling of the fast-path behavior

## Component

- [ ] `LauncherBar` tests for:
  - stable early rows from hot-tier results
  - no clipboard-first flash when a hot-tier app/file result is expected
  - deep-tier results arriving later without replacing clearly better hot-tier top results

## E2E

- [ ] a query for a common app resolves immediately from the hot tier
- [ ] a query for a file in a visible personal folder resolves immediately or near-immediately
- [ ] a query that would only match deeper system/library content can resolve later without harming the initial rows

## Manual Verification

- [ ] confirm apps in `/Applications` and `/System/Applications` feel immediate
- [ ] confirm a PDF on `~/Desktop` feels immediate
- [ ] promote a custom work folder in settings and confirm results from that folder feel immediate too
- [ ] confirm broader `~/Library` or hidden-path matches may arrive later without degrading the first visible result
