# Feature Spec: Indexed File And Folder Search

## Status

- Approved

## Problem

The launcher must resolve local file and folder names quickly without crawling the filesystem on each keystroke.

## User Value

- Users can type part of a local file, folder, or app name and see useful results immediately.

## Scope

- In scope: local search powered by the macOS metadata index in Electron
- In scope: browser fallback fixtures for preview and automated tests
- In scope: ranking exact, prefix, and substring filename matches
- In scope: files, folders, and `.app` bundles

## Out of Scope

- Deep content search inside documents
- User-configurable indexing scopes
- Network drives and cloud-provider specific APIs

## User Stories

- As a user, I can type a local filename and see matching local files.
- As a user, I can type a folder name and see matching folders.
- As a user, I can type an app name and see application bundles.

## Interaction Notes

- Search starts after at least two visible characters.
- Results are capped to a compact top set.
- Exact and prefix basename matches rank above substring matches.
- Search errors do not crash the bar; they fall back to an empty local result set.

## Acceptance Criteria

- [ ] Electron search uses Spotlight metadata lookup instead of recursive filesystem walking.
- [ ] File, folder, and app results can appear in a single ranked list.
- [ ] Basename exact matches rank above prefix matches, which rank above substring matches.
- [ ] Search returns no local results for empty or one-character queries.

## Failure Cases

- If Spotlight lookup fails, the launcher still renders and other deterministic result types continue to work.

## Performance Expectations

- Local queries should feel immediate for top results and stay within a single interaction frame after data arrives.

## Notes

- Browser preview uses a deterministic fixture provider so the UI can be tested without Electron.
