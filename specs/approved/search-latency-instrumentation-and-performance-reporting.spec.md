# Search Latency Instrumentation And Performance Reporting

## Summary

Northlight now has a `Fast Path` concept, but the product still lacks a user-facing and engineering-grade explanation of what that means in practice.

This slice adds:

- measurable latency instrumentation for the launcher search pipeline
- visible reporting in settings so users can understand the tradeoffs of `Fast Path`
- a reproducible way to validate what is immediate, what is fast, and what is deep

The goal is to replace guesswork with data.

## Problem

- `Fast Path` is currently a behavior toggle, but users cannot see what cost it introduces.
- There is no clear budget or warning for scopes that are too large or noisy to be good `Fast Path` candidates.
- We do not yet have a durable reporting surface for:
  - time to first visible result
  - time to first actionable result
  - hot-tier completion time
  - deep-tier completion time
  - top-result instability
- Without that instrumentation, product decisions about search layers remain speculative.

## Product Direction

Northlight should feel premium and understandable.

That means:

- users should understand why some scopes are immediate and others are delayed
- settings should expose practical tradeoffs, not internal jargon
- engineering should be able to evaluate latency regressions with repeatable measurements

## Scope

- In scope: instrument the search pipeline so `hot` and `deep` timings are measurable
- In scope: define search-performance metrics that reflect real launcher UX
- In scope: surface performance and cost signals inside settings
- In scope: report per-scope guidance for `Fast Path` suitability
- In scope: add a reproducible measurement flow for representative real-world queries
- In scope: expose enough data to make optimization decisions on verified behavior

## Out Of Scope

- Out of scope: shipping telemetry to a remote server
- Out of scope: background analytics collection beyond local launcher diagnostics
- Out of scope: auto-reclassifying scopes without user consent
- Out of scope: promising exact hard-real-time guarantees across all machines and disks

## User-Visible Behavior

- Settings should explain what `Fast Path` means in plain language.
- Settings should show the estimated search cost of each enabled scope.
- Settings should warn when a scope is likely too large or too noisy for `Fast Path`.
- Settings should include a `Search Performance` area summarizing recent hot/deep latency and stability.
- The performance reporting should make it obvious that a scope can remain searchable without needing to be immediate.

## Metrics To Capture

Northlight should measure, at minimum:

- time to first visible result
- time to first expected/actionable result
- hot-tier completion time
- deep-tier completion time
- result count per tier
- top-result replacements after initial render
- whether clipboard/snippet results occupied the first row before a stronger local result arrived

## Scope Cost Model

Each scope should expose a local cost classification such as:

- `Low`
- `Medium`
- `High`

This classification should be derived from measurable properties such as:

- estimated indexed item count
- scope breadth
- whether the scope is a known noisy/system-heavy location
- whether the scope is hidden, library-heavy, or whole-disk

The UI should present the implication in plain language, for example:

- `Good for Fast Path`
- `Fast Path may become slower here`
- `Better kept as deep search`

## Settings Behavior

- Settings should show a concise explanation of `Fast Path` versus `Deep`.
- Each scope row should expose:
  - current tier
  - cost classification
  - a short recommendation
- A dedicated `Search Performance` section should summarize recent measured latency.
- The UI should show enough context for the user to make an informed decision without needing to understand internal implementation details.

## Failure Cases

- Metrics must not require the user to enable heavyweight diagnostic tracing manually every time.
- Performance reporting must not noticeably slow normal launcher usage.
- Scope cost labels must not be arbitrary or misleading.
- The settings surface must not overwhelm the user with raw engineering data.

## Acceptance Criteria

- [ ] Northlight records local metrics for hot-tier and deep-tier latency.
- [ ] Settings explains `Fast Path` and `Deep` in user language.
- [ ] Settings shows a cost classification for each enabled scope.
- [ ] Settings shows at least one warning state for scopes that are poor `Fast Path` candidates.
- [ ] Settings includes a `Search Performance` summary with recent hot/deep timing data.
- [ ] A reproducible measurement flow exists for representative queries across immediate, fast, and deep categories.
- [ ] Tests cover scope-cost labeling, latency summary rendering, and measurement persistence/reporting behavior.

## Notes On Metrics

The key product question is not “how fast is one internal function.”

The key question is:

- how long until the user sees something useful
- how stable the top result remains
- whether `Fast Path` actually behaves like a premium immediate layer

Those are the numbers this slice should center.
