# Path Autocomplete And Path Aliases

## Summary

Northlight should make path-scoped search feel natural and fast before introducing heavier scope syntax or complex path settings. The first step is path autocomplete that behaves more like a strong terminal or launcher than like a loose text field:

- complete one path segment at a time
- accept the current suggestion with `Tab`
- handle ambiguity with an explicit completion list
- allow the user to save a resolved folder as a reusable alias from `Cmd+K`

This same interaction model should work both in the normal query field and inside future scoped forms such as `in:`.

## Problem

- Writing long absolute paths by hand is slow and error-prone.
- Reusing a frequently visited work folder should not require typing the full path every time.
- Settings-only alias creation is too indirect for a launcher workflow.
- If future scoped search relies on `in:` or similar syntax, the launcher needs a natural way to complete folders and references without forcing the user into manual path typing.

## Product Direction

Northlight should treat path references as first-class launcher input, with a model that is:

- predictable
- keyboard-first
- incremental
- reusable across global search and scoped search

The launcher should not guess huge path jumps aggressively. It should help the user walk a path quickly and confidently.

## Scope

- In scope: inline autocomplete for filesystem folders and saved path aliases
- In scope: segment-by-segment path completion rather than full-path autocompletion by default
- In scope: `Tab` acceptance of the active path or alias completion
- In scope: ambiguity handling when multiple folder or alias candidates match the current segment
- In scope: arrow-key navigation for the completion list when ambiguity exists
- In scope: case-insensitive matching with insertion that preserves the real filesystem or alias casing
- In scope: support for visible `~` home-prefix input without expanding it visually
- In scope: support for path autocomplete in the normal search box when the input clearly represents a path
- In scope: support for the same autocomplete behavior inside future scoped contexts such as `in:`
- In scope: creation of path aliases from `Cmd+K` once the current input resolves to a concrete folder
- In scope: alias management remaining available in settings

## Out Of Scope

- Out of scope: file autocomplete in v1
- Out of scope: full-path autocompletion as the default behavior
- Out of scope: aliases containing spaces
- Out of scope: path aliases automatically overriding normal global search intent outside path contexts
- Out of scope: a complete `in:` search feature in this slice
- Out of scope: recursive scope navigation syntax beyond path completion and alias resolution

## User-Visible Behavior

- When the user types a path-like input such as `/Users/nm4/ST`, Northlight suggests the next folder segment rather than the full remaining path.
- Pressing `Tab` accepts the active completion and inserts the completed folder segment with a trailing `/`.
- If there are multiple matching folders or aliases for the current segment, Northlight shows a completion list.
- When the completion list is open:
  - one candidate is active by default
  - `Up` and `Down` move the active candidate
  - `Tab` accepts the active candidate
  - continuing to type narrows the list until one match remains or the user chooses one
- `Esc` dismisses the active completion list or inline suggestion without deleting the user’s typed text.
- `~` stays visible as `~` in the input even though Northlight resolves it as the home directory internally.
- The same completion behavior must apply inside future path-scoped contexts such as `in:`.
- When the current input resolves to a concrete folder, the user can open `Cmd+K` and choose an action such as `Save Path Alias`.
- The user supplies a no-spaces alias name.
- After that, the alias participates in the same completion system as real folders.

## Context Rules

- Outside explicit path context, normal global search keeps its current meaning.
- In explicit path contexts such as `in:`, aliases and path completions take priority over unrelated global results.
- A saved alias must not silently hijack ordinary global search outside path contexts just because its name matches an app or file query.

## Completion Sources

- Real filesystem folders
- Saved path aliases
- Recent path targets, when applicable

These sources should appear through one coherent completion model rather than separate competing UI systems.

## Interaction Rules

- The completion model is folder-first in v1.
- `Tab` accepts the current active completion.
- Accepted folder completions insert a trailing `/`.
- If a completion resolves via alias inside `in:`, Northlight should continue naturally so the user can type the search term immediately after the resolved reference.
- The path completion list should be compact and keyboard-first, not a separate modal.
- When the completion list is active, `Up` and `Down` control that list rather than the main result list.

## Settings Behavior

- Settings should continue to expose saved path aliases.
- The launcher should not require settings as the primary creation flow.
- Alias creation from `Cmd+K` is the primary workflow because it lets aliases emerge from real use.

## Failure Cases

- `Tab` should not unexpectedly jump to a full deep path when only the next segment should be accepted.
- A path alias must not require spaces or punctuation tricks to be usable.
- Ambiguous matches should not behave like silent guesswork with no visible candidates.
- Global search should not become harder to use because aliases start overriding normal app/file intent in the wrong context.
- The user should not lose normal result navigation unexpectedly unless the completion list is visibly active.

## Acceptance Criteria

- [ ] Path-like input in the main launcher supports folder autocomplete one segment at a time.
- [ ] `Tab` accepts the current folder or alias suggestion and inserts a trailing `/` for folder traversal.
- [ ] Ambiguous matches open a completion list with a default active candidate.
- [ ] `Up` and `Down` navigate the completion list while it is active.
- [ ] Typing more characters refines the completion list until a single match or clearer set remains.
- [ ] `Esc` dismisses completion UI without deleting typed input.
- [ ] `~` remains visible in the input while still resolving against the home directory.
- [ ] Path alias creation is available from `Cmd+K` when the current input resolves to a concrete folder.
- [ ] Saved aliases have no spaces and participate in the same autocomplete model as real folders.
- [ ] In future scoped input such as `in:`, alias and path completions take priority over unrelated global results.

## Notes On UX

- Completing one segment at a time is more predictable than autocompleting an entire long path.
- This keeps Northlight fast and learnable, especially for users already familiar with terminal path completion.
- The completion list should feel like a compact extension of the search box, not like switching into another mode.
