# Test Plan: Preview, Quick Look, Clipboard, And Snippets

## Status

- Approved

## Linked Spec

- `specs/approved/preview-utility-content.spec.md`

## Coverage Strategy

- Unit: preview model selection, clipboard/snippet result building.
- Integration: runtime persistence for snippets and clipboard history.
- E2E: preview pane behavior, `Space` toggle, clipboard/snippet actions.

## Test Cases

- [ ] Selecting a result updates the preview pane.
- [ ] Pressing `Space` toggles preview state for the current result.
- [ ] Clipboard history results appear and copy with `Enter`.
- [ ] Snippet results appear and copy with `Enter`.
- [ ] Preview fallback renders for items without rich metadata.

## Fixtures or Mocks

- Clipboard history fixture.
- Snippet fixture.
- Preview metadata fixture for file/folder/app/conversion results.

## Pass Criteria

- `npm run verify`
- `npm run test:e2e`
- Visual confirmation of preview pane and quick-look behavior in Electron.

## Risks

- Clipboard monitoring is platform-sensitive and needs graceful fallback coverage.
