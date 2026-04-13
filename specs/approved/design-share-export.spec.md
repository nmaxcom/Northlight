# Feature Spec: Shareable Self-Contained Design Exports

## Status

- Approved

## Problem

The current `design/*.html` pages are local shells backed by external JS/CSS bundles. That is correct for keeping the real renderer as the source of truth, but it is not a convenient artifact to hand off to someone else as a single self-contained file they can open and inspect.

## User Value

- Designers can keep using the real renderer-backed local design pages for accurate work.
- Northlight can also generate shareable, self-contained HTML exports for launcher and settings.
- Shared exports remain visually aligned with the current real renderer state at the time of export.

## Scope

- In scope:
- Add `npm run export:design`.
- Generate self-contained share HTML files for launcher and settings from the current renderer-backed design pages.
- Keep the existing local `design/*.html` workflow intact.
- Preserve the exact native viewport sizes in the exported files.
- Make the export location and regeneration workflow explicit in docs.

## Out of Scope

- Replacing the local renderer-backed design workflow.
- Rewriting the launcher or settings as handwritten static mockups.
- Building a bi-directional sync system from shared exports back into source.

## User Stories

- As a designer, I can run `npm run export:design` and get a shareable launcher HTML file.
- As a designer, I can run `npm run export:design` and get a shareable settings HTML file.
- As a collaborator, I can open the exported HTML directly without needing the repo build pipeline.

## Interaction Notes

- The local source-of-truth pages stay in `design/`.
- The shareable exports should be emitted into a clearly separate folder, for example `design/export/`.
- The exports should be self-contained enough to open directly via `file://` on another machine without additional build output.

## Acceptance Criteria

- [ ] `npm run export:design` generates a self-contained launcher export HTML.
- [ ] `npm run export:design` generates a self-contained settings export HTML.
- [ ] Exported files open directly via `file://` without requiring separate JS/CSS files.
- [ ] Exported launcher and settings pages preserve their exact native viewport sizes.
- [ ] The existing local `design/launcher-current-view.html` and `design/settings-current-view.html` workflow continues to use the real renderer bundles.
- [ ] The export workflow is documented in `docs/user-guide.md`.

## Failure Cases

- If the export step cannot inline the required assets, it should fail clearly instead of producing a partial artifact.
- If export generation fails, the local design workflow remains usable.

## Performance Expectations

- Export generation should be fast enough for normal handoff workflows.
- Running `npm run export:design` should not require manual editing of generated files.

## Notes

- A pragmatic implementation can build the local renderer-backed design pages first, then inline their CSS/JS into `design/export/*.html`.
