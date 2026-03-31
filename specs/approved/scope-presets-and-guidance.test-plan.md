# Test Plan: Scope Presets And Guidance

## Status

- Approved

## Linked Spec

- `specs/approved/scope-presets-and-guidance.spec.md`

## Coverage Strategy

- Unit:
  Settings view rendering and preset insertion behavior.
- Integration:
  Existing settings save coverage remains in place.
- E2E:
  None required for this slice beyond existing settings route smoke coverage.

## Test Cases

- [ ] Render scope guidance and preset buttons.
- [ ] Add `~/Library` from a preset.
- [ ] Open the custom scope composer without creating a blank scope row.
- [ ] Do not duplicate an existing preset path.
- [ ] Keep existing scope editing and save behavior intact.

## Fixtures or Mocks

- Settings snapshots with default scopes under a user home path.

## Pass Criteria

- `npm run test:unit` passes.

## Risks

- Home path inference may become brittle if no user-scoped defaults exist in settings.
