# Search Diagnostics Tracing

## Why

Northlight still shows intermittent CPU churn after query results appear. We need an internal diagnostics layer that can prove which subsystem keeps working after typing stops, instead of continuing to guess between renderer loops, background indexing, previews, icons, or clipboard polling.

## Scope

- In scope:
- Add an opt-in diagnostics mode for development sessions.
- Record structured trace events for renderer, IPC, search, watcher, preview, icon, status, and clipboard work.
- Keep a rolling in-memory trace buffer in the main process.
- Expose trace state, trace event ingestion, trace dump retrieval, and idle-window summaries through the preload bridge.
- Instrument the local search pipeline, preview/icon work, renderer result lifecycle, and watcher invalidation.
- Add a temporary debug dump action that developers can trigger from the launcher.

- Out of scope:
- Shipping a permanent user-facing diagnostics UI.
- Changing search ranking or preview behavior unless the trace implementation requires a tiny mechanical fix.
- Remote telemetry, persistence, or analytics upload.

## User Stories

- As a developer, I can enable tracing for one app session without permanently spamming logs.
- As a developer, I can inspect a recent trace dump and see whether repeated work is coming from search, watchers, previews, icons, status refreshes, or clipboard polling.
- As a developer, I can stop typing, request an idle summary, and quickly understand what still happened during that quiet period.

## Behavior

- Diagnostics tracing is disabled by default and can be enabled for development sessions through an environment variable or the exposed debug API.
- Every app launch gets a trace session id so events from one run can be grouped.
- Trace events are stored in a fixed-size ring buffer in the main process.
- Trace events capture structured metadata instead of raw free-form logs, including request ids, query hash and length, local filter summary, result counts, cache state, scope path hash, and durations when relevant.
- The renderer emits trace events for query changes, immediate result passes, async result lifecycles, status refreshes, preview requests, icon batch requests, and cancellations.
- The main process emits trace events for IPC handlers, search cache hits and misses, fallback index search, targeted path search, refresh scheduling, refresh execution, watcher accept and ignore decisions, preview generation, icon generation, and clipboard polling.
- A trace dump returns the current trace state plus recent events in timestamp order.
- An idle summary aggregates the work that occurred after the last query change, so developers can see which subsystems remained active after typing stopped.

## Failure Cases

- If tracing is disabled, diagnostic calls must become cheap no-ops.
- If a trace event cannot be serialized cleanly, Northlight must keep functioning and store a reduced event payload instead of throwing.
- If the renderer requests a trace dump while tracing is disabled, Northlight returns an empty but well-formed diagnostics payload.
- If preview or icon work is canceled or superseded, the trace must mark that outcome instead of pretending it completed successfully.

## Acceptance Criteria

- [ ] A dev session can enable diagnostics tracing without changing normal packaged behavior.
- [ ] The main process keeps a rolling trace buffer and exposes it through IPC.
- [ ] Search-local requests record cache behavior, result counts, durations, and request ids.
- [ ] Watcher scheduling and ignore decisions are visible in the trace output.
- [ ] Preview and icon requests record cache hits, cache misses, completion, and cancellation/obsolescence.
- [ ] The renderer records result, status, preview, and icon request lifecycles with correlatable request ids.
- [ ] An idle summary shows which events still happened after the user stopped typing.
