# Test Plan: Launcher Uniform Results And Input Semantics

## Status

- Draft

## Linked Spec

- `specs/drafts/launcher-uniform-results-and-input-semantics.spec.md`

## Coverage Strategy

- Unit:
  - result action descriptor coverage without trash actions in routine action surfaces
  - ranking coverage for `textedit` and similar direct app queries
  - command icon fallback coverage for settings commands
- Integration:
  - `buildResults()` coverage for `textedit` and macOS settings commands
  - result-list composition without a dedicated `Best Match` split
  - stale-state reset behavior for empty-query reopen flows
- E2E:
  - not required for this slice if renderer/unit coverage proves keyboard semantics and result composition

## Test Cases

- [ ] Query `textedit` returns `TextEdit.app` when available in candidates.
- [ ] Query `text` still favors `TextEdit.app` over noisy support files when appropriate.
- [ ] The launcher renders a single uniform result list without a `Best Match` card.
- [ ] `Cmd+Backspace` clears the search input instead of invoking destructive result actions.
- [ ] `Cmd+Backspace` clears the actions filter when actions mode is active.
- [ ] `Move To Trash` does not appear in the actions panel.
- [ ] Reopening or resetting to empty query does not retain stale non-empty result lists.
- [ ] Immediate typing feedback remains coherent while async local results resolve.
- [ ] macOS settings commands show command rows with settings-oriented icons.

## Fixtures or Mocks

- Mock local search results containing:
  - `TextEdit.app`
  - noisy `Text.*` files under `/Applications/...` and `~/Library/...`
  - representative local app/file mixtures for typing-latency and stale-state tests
- Mock launcher bridge callbacks for hide, open, and settings icon retrieval where needed.

## Pass Criteria

- `npm run verify` passes.
- Manual spot checks confirm:
  - no `Best Match` card
  - `Cmd+Backspace` clears text
  - empty reopen does not show stale results
  - settings commands show appropriate icons

## Risks

- Search responsiveness changes can accidentally reintroduce stale results or flicker.
- Removing the first-result split can affect selection math if not covered carefully.
