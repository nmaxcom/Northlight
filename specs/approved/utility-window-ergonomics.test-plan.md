# Test Plan: Utility Window Ergonomics

## Unit

- None required beyond renderer regression coverage for header semantics.

## Integration

- Persist launcher position in the native settings store and restore it on show.

## E2E

- Smoke-check the launcher renders with the drag header structure present.
- Manual native verification: drag the launcher, hide it, reopen it, confirm position is restored.
