# Feature Spec: Preview, Quick Look, Clipboard, And Snippets

## Status

- Approved

## Problem

The launcher forces users to execute or reveal items before understanding them. It also lacks high-value transient content like clipboard history and reusable snippets.

## User Value

- Users can inspect items before opening them.
- Common copied content and snippets become first-class launcher results.
- Quick look behavior reduces Finder round-trips.

## Scope

- In scope:
- Add a preview pane inside the launcher for the selected result.
- Support quick-look style toggling with keyboard for the current selection.
- Show contextual previews for files, folders, apps, calculations, clipboard items, and snippets.
- Track clipboard history locally and expose it in search.
- Add user-defined text snippets and make them searchable.

## Out of Scope

- Binary media rendering beyond lightweight metadata/thumbnail placeholders.
- Rich markdown or PDF full rendering engines.
- Cross-device clipboard sync.

## User Stories

- As a user, I can inspect the selected item without leaving the launcher.
- As a user, I can press space to quick-look the current item.
- As a user, I can search my recent clipboard history.
- As a user, I can define snippets and paste them quickly.

## Interaction Notes

- Trigger: selection changes, `Space`, and normal search typing.
- Primary result behavior: `Enter` still runs the result.
- Secondary actions: clipboard and snippet items can copy immediately.
- Empty states: preview pane shows guidance when preview is disabled or unavailable.
- Error states: clipboard monitoring failures degrade silently and keep local search working.

## Acceptance Criteria

- [ ] A preview pane can render beside the result list for the current selection.
- [ ] `Space` toggles preview/open quick look mode for the current result.
- [ ] Clipboard items appear in search results when enabled.
- [ ] Snippets appear in search results and can be copied/inserted with `Enter`.
- [ ] Preview content changes with selection without stealing focus from the launcher input.

## Failure Cases

- If preview data is unavailable, the pane shows metadata and fallback copy.
- If clipboard access is denied or empty, clipboard results are omitted without breaking the launcher.
- If a snippet is malformed or empty, it is rejected in settings.

## Performance Expectations

- Preview state changes should feel immediate on selection change.
- Clipboard/snippet result generation should not add visible delay to normal local file search.

## Notes

- Quick-look behavior may be implemented as a launcher-side preview rather than macOS Quick Look proper as long as the interaction feels equivalent.
