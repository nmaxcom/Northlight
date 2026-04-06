# Test Plan: Search Latency Instrumentation And Performance Reporting

## Unit

- [ ] scope cost classification tests:
  - low-cost visible scopes
  - medium-cost custom scopes
  - high-cost/noisy scopes such as `~/Library`, home-wide, or `/`
- [ ] metric aggregation tests for:
  - hot-tier timing summaries
  - deep-tier timing summaries
  - top-result replacement counters
  - clipboard-first flash counters
- [ ] persistence tests for recent performance snapshots

## Integration

- [ ] search pipeline tests that record hot and deep timings for a query lifecycle
- [ ] tests that distinguish first-visible timing from final deep completion
- [ ] tests that verify a strong hot result does not register as unstable if deep search only appends weaker items
- [ ] tests that verify a top-result replacement is counted when the first row actually changes

## Settings UI

- [ ] `SettingsView` tests for:
  - `Fast Path` explanation text
  - scope cost labels
  - warning copy for oversized or noisy scopes
  - rendering of recent hot/deep timing summaries

## Component

- [ ] `LauncherBar` tests for recording first-visible and final-complete search milestones
- [ ] tests for top-result replacement tracking
- [ ] tests for clipboard/snippet-first flash detection

## E2E

- [ ] query for a macOS settings command records as immediate-tier behavior
- [ ] query for a common app records as hot-tier behavior
- [ ] query for a visible personal file records as hot-tier or fast-tier behavior when the containing folder is marked `Fast Path`
- [ ] query for a deep-only path records a later deep-tier completion without being mislabeled as immediate
- [ ] settings surface shows non-empty performance reporting after exercise queries

## Manual Verification

- [ ] compare a clearly immediate query such as `wifi`
- [ ] compare a hot app query such as `textedit`
- [ ] compare a promoted custom folder query
- [ ] compare a deep-only query from `~/Library` or a broad home scope
- [ ] confirm settings communicates the difference between these classes in a way a non-technical user can understand
