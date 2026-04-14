# Path-Scoped Search Audit And Case-Insensitive Completion

## Summary

Northlight should not silently lose path completions or scoped search behavior just because casing differs from the real filesystem, and its search promises around `in:`, hidden files, dotfiles, apps, images, and scoped paths need reproducible coverage against the launcher behavior the user actually sees.

## Problem

- Typing `/app` should still suggest `/Applications/`, but the current inline path suggestion is case-sensitive.
- Search behavior across explicit paths and scoped queries is easy to regress silently because the combinations are broader than the current suite.
- The user needs confidence that the launcher can actually find the kinds of things it claims to support in scoped and unscoped search.

## Scope

- In scope: make visible path completion matching case-insensitive while preserving real inserted casing.
- In scope: audit scoped and unscoped search behavior with realistic launcher coverage.
- In scope: cover `in:` at the beginning and end of a query.
- In scope: cover dotfiles and hidden files.
- In scope: cover apps, images, and operator-based narrowing such as `img`.
- In scope: cover behavior across paths that are `Fast Path`, indexed-only, and not in an active indexed scope.
- In scope: add browser-level launcher tests and supporting unit/integration tests where needed.

## Out Of Scope

- Out of scope: redesigning the `in:` syntax.
- Out of scope: changing how scopes are configured.
- Out of scope: adding new search operators.

## User-Visible Behavior

- Path autocomplete suggestions remain visible and accept with `Tab` even when the typed segment casing differs from the real path casing, such as `/app` for `/Applications/`.
- Scoped path search behaves consistently whether `in:` appears at the beginning or end of the query.
- Searches for supported result classes such as apps, images, hidden files, and dotfiles remain discoverable when the current scope and operators should allow them.

## Failure Cases

- Lowercase path typing must not hide a valid completion purely because the real directory name starts uppercase.
- `in:` at the beginning and end of a query must not behave like two different search systems.
- Dotfiles and hidden files must not disappear unexpectedly when the chosen scope should include them.
- Image narrowing such as `img` must not leak irrelevant non-image results inside an explicit path scope.
- Unscoped global results must not masquerade as scoped success when the path scope itself is failing.

## Acceptance Criteria

- [ ] Typing `/app` surfaces `/Applications/` as the active path completion and `Tab` accepts it.
- [ ] Scoped queries using `in:` at the beginning and end of the query resolve the same scoped results.
- [ ] Realistic tests cover dotfiles, hidden files, apps, images, and operator-based narrowing in scoped search.
- [ ] Tests cover at least one `Fast Path`, one indexed-only path, and one non-indexed path behavior expectation.
- [ ] Browser-level launcher tests verify the observable behavior for the most important search-path combinations.
