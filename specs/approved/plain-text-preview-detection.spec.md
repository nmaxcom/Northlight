# Feature Spec: Plain-Text Preview Detection Beyond File Extensions

## Status

- Approved

## Problem

Northlight only renders file-body previews for a fixed set of known text extensions. Plain-text documents with unusual extensions or no extension fall back to metadata-only previews even when their contents are readable and useful.

## User Value

- Users can inspect the actual contents of more documents directly in the launcher.
- Renamed files, dotfiles, config files, logs, and extensionless scripts remain previewable.
- Preview behavior feels based on file reality rather than filename conventions.

## Scope

- In scope:
- Extend file preview detection so Northlight can show plain-text bodies for files whose contents are text even when the extension is unknown or missing.
- Keep existing richer image and PDF preview behavior unchanged.
- Preserve syntax-style body mode for known structured/code extensions when applicable.
- Show metadata-only fallback for binary or undecidable files.

## Out of Scope

- Full MIME sniffing for every media format.
- Rich rendering for Office documents, archives, or proprietary binary formats.
- Full-text indexing changes.

## User Stories

- As a user, I can preview a README-like file even if it has no extension.
- As a user, I can preview logs, config blobs, or scripts renamed with odd suffixes.
- As a user, I do not get mojibake or binary garbage for non-text files.

## Interaction Notes

- Trigger: selecting a local file result.
- If the file is image/PDF, current specialized preview rules still win.
- If the file is not covered by a specialized preview and its leading bytes decode as plain text, the preview body shows a text excerpt.
- If the file appears binary or decoding fails, preview stays metadata-only.

## Acceptance Criteria

- [ ] A local file with no extension but UTF-8 plain-text content shows a text preview body.
- [ ] A local file with an uncommon extension but UTF-8 plain-text content shows a text preview body.
- [ ] Image and PDF previews remain unchanged.
- [ ] Binary files without supported rich previews do not show raw binary gibberish in the preview body.
- [ ] Known code/markup extensions still use the existing code-style body mode.

## Failure Cases

- If the file cannot be read, preview falls back to metadata only.
- If content sampling is inconclusive, Northlight prefers metadata-only fallback over showing corrupt text.
- If decoding succeeds but embedded NUL or binary-heavy content is detected, Northlight suppresses the body preview.

## Performance Expectations

- Detection should inspect only a bounded prefix of the file before deciding whether to render a text preview.
- Selection changes should remain effectively immediate for normal local files.

## Notes

- A pragmatic implementation can sample the first chunk of the file, attempt UTF-8 decoding, and reject content containing NUL bytes or an excessive share of replacement/control characters.
