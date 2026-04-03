# Feature Spec: Launcher Uniform Results And Input Semantics

## Status

- Draft

## Problem

Northlight still treats the first result as a visually distinct `Best Match`, which makes the list feel inconsistent and overly opinionated. Recent command additions for macOS settings do not yet show native-looking icons. Keyboard behavior inside the search box also conflicts with normal text-field expectations: `Cmd+Backspace` can trigger destructive result actions instead of clearing the query. In addition, the launcher can reopen with stale visible results even when no query is present, and final local results can lag too long behind typing.

## User Value

- Every result row looks consistent and predictable.
- macOS settings commands feel native because they show recognizable System Settings icons.
- Search input behaves like a normal macOS text field.
- Reopening the launcher starts from a clean empty-query state instead of showing stale result leftovers.
- Visible results update faster while typing.
- Broad app-intent searches such as `textedit` correctly surface the app users expect.

## Scope

- In scope: remove the dedicated `Best Match` card and render all results in one consistent list style
- In scope: assign appropriate icons to newly added macOS settings command results
- In scope: make `Cmd+Backspace` clear the query when focus is in the launcher search input or actions input
- In scope: remove `Move To Trash` from the actions panel and keyboard-action matching
- In scope: prevent stale non-empty result lists from appearing when reopening the launcher with an empty query
- In scope: reduce perceived result lag while typing by tightening immediate-result and async-refresh behavior
- In scope: fix ranking and tests so `TextEdit.app` appears for literal `textedit`
- In scope: update docs and add regression tests for all above behavior

## Out Of Scope

- New search providers beyond the existing local and deterministic surfaces
- A full favorites or pinning system
- A redesign of the preview pane
- New destructive file-management features

## User Stories

- As a user, I see one coherent result list rather than a special first-card layout.
- As a user, I can type `textedit` and get `TextEdit.app`.
- As a user, pressing `Cmd+Backspace` inside the query box clears the text instead of deleting files.
- As a user, the `Actions` panel avoids destructive actions for routine use.
- As a user, reopening Northlight with no query does not show stale search leftovers from the previous session.
- As a user, visible search results settle quickly as I type.

## Interaction Notes

- The first result may still be the top result, but it must share the same row layout as the rest of the list.
- The bottom action bar still reflects the currently selected result.
- Empty query state should show either recent items or an empty/root state, but never a stale non-empty query result set carried over from a previous open/close cycle.
- `Cmd+Backspace` should be intercepted before result action matching when an input is focused.
- Destructive `Move To Trash` should no longer appear in `Cmd+K` actions and should no longer be keyboard-triggered from search.

## Acceptance Criteria

- [ ] The launcher no longer renders a dedicated `Best Match` card above the list.
- [ ] The first result uses the same visual row style as subsequent results.
- [ ] macOS settings commands render with suitable settings-related icons instead of generic placeholders.
- [ ] Typing `textedit` surfaces `TextEdit.app` as the top relevant result when available in local candidates.
- [ ] `Cmd+Backspace` clears the query when the search input is focused.
- [ ] `Cmd+Backspace` clears the action filter when the actions input is focused.
- [ ] `Move To Trash` is removed from the actions panel for local results.
- [ ] Reopening the launcher with an empty query does not show stale non-empty results from the prior session.
- [ ] Local result refreshes feel faster and tests confirm immediate and final result behavior for representative queries.
- [ ] `docs/user-guide.md` documents the changed launcher behavior in the same slice.

## Failure Cases

- If native icons cannot be loaded for a settings command, Northlight falls back to a deterministic command icon without breaking layout.
- If local search has not yet returned fresh results for a new query, Northlight should preserve coherent immediate feedback without leaving stale unrelated results on screen.
- If a requested app is not present in local candidates, Northlight must not fabricate it.

## Performance Expectations

- Query changes should show a coherent immediate state within a single render pass.
- Final local results for indexed queries should replace immediate placeholders without visible stale carryover.

## Notes

- This slice intentionally tightens behavior around predictability, consistency, and input semantics rather than adding new feature breadth.
