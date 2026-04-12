# Path Completion Panel Density

## Summary

The path completion panel should behave like a compact launcher autocomplete, not like a secondary result list. When many candidates match, the panel must stay visually contained inside the launcher and remain fast to scan.

## Problem

- The current panel can become taller than the usable launcher viewport.
- Each candidate currently uses two lines plus a repeated kind badge, which wastes vertical space.
- The visual weight of the completion UI is too close to full search results, even though completions are only a transient assistive layer.

## Scope

- In scope: cap the completion panel height and make it scroll internally.
- In scope: reduce each completion row to a single visual line for the candidate name.
- In scope: remove repeated per-row kind badges from the completion list.
- In scope: show the active candidate's full path or note once, outside the row list, as contextual detail.
- In scope: keep mouse hover and keyboard selection synchronized with the active candidate.
- In scope: preserve the existing `Tab`, `Up`, `Down`, and `Escape` behaviors.

## Out Of Scope

- Out of scope: changing the underlying path completion logic.
- Out of scope: moving the panel to a floating overlay in this slice.
- Out of scope: redesigning the main results list.
- Out of scope: multi-column or grouped completion layouts.

## User-Visible Behavior

- When multiple path completions are visible, the panel uses a compact single-line row per option.
- The panel no longer shows a repeated `Folder` or `Alias` badge on every candidate row.
- The panel never grows unbounded with the number of candidates; it scrolls internally once it reaches its maximum height.
- The active candidate still changes through hover and keyboard navigation.
- The launcher shows one contextual detail line for the active completion so the user can still disambiguate similar names.

## Failure Cases

- The panel must not push the rest of the launcher out of the viewport when many matches exist.
- Completion rows must not expand back to a two-line layout.
- Removing per-row metadata must not make ambiguous items impossible to disambiguate; the active-detail line must remain visible.
- Keyboard navigation must not lose the active row when the panel scrolls.

## Acceptance Criteria

- [ ] The completion panel has a fixed maximum height and scrolls internally when candidates exceed it.
- [ ] Each completion row renders on a single line.
- [ ] Per-row `Folder` and `Alias` badges are removed from the completion list.
- [ ] The active candidate's path or note is shown separately as contextual detail.
- [ ] Hover and `Up` / `Down` still update the active candidate correctly.
- [ ] `Tab` still accepts the active completion.
- [ ] Browser verification confirms the compact panel styling in the launcher UI.
