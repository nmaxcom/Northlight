# Search Diagnostics Tracing Test Plan

## Spec

- `specs/approved/search-diagnostics-tracing.spec.md`

## Coverage

- Unit: trace buffer truncation, filter serialization, value hashing, idle summary aggregation.
- Unit: renderer trace lifecycle helpers and cancellation markers.
- Integration: search diagnostics around cache hits, watcher scheduling, and runtime bridge state.
- Manual: run a traced dev session, stop typing, dump the trace, and inspect which subsystem still generates work.

## Checks

- [ ] The trace buffer drops oldest events when it exceeds its size limit.
- [ ] Query and path hashing stay stable without leaking raw values.
- [ ] Idle summaries aggregate repeated events and total durations correctly.
- [ ] Renderer trace helpers mark obsolete preview and icon requests as canceled instead of completed.
- [ ] Search-local calls expose cache hit and miss metadata in diagnostics.
- [ ] Trace dump and idle summary bridge calls return structured data even when tracing is disabled.
