# Test Plan: Local Design Pages Backed By Real Renderer Bundles

## Status

- Approved

## Linked Spec

- `specs/approved/design-local-bundle-pages.spec.md`

## Coverage Strategy

- Unit: minimal config/path coverage if helper logic is introduced.
- Integration: design build script emits expected local bundles/pages.
- E2E: Playwright opens the generated design pages over `file://` or equivalent local browser path and confirms launcher/settings render.

## Test Cases

- [ ] Local design build emits launcher and settings bundles/assets.
- [ ] `design/launcher-current-view.html` renders launcher UI from the real renderer build.
- [ ] `design/settings-current-view.html` renders settings UI from the real renderer build.
- [ ] Design pages preserve native viewport dimensions.
- [ ] HTTP design preview still works if retained.

## Pass Criteria

- `npm run typecheck`
- Relevant unit/integration tests pass.
- Playwright validates the generated design pages.

## Risks

- Asset paths may break under `file://` if bundle output is not made relative.
- Sourcemap or workspace behavior may change compared with the current dev-server flow.
