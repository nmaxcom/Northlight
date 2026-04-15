# Feature Spec: Shareable Self-Contained Current Design Export

## Status

- Approved

## Problem

The current `design/*.html` pages are local shells backed by external JS/CSS bundles. That is correct for keeping the real renderer as the source of truth, but it is not a convenient artifact to hand off as one single self-contained HTML file that always reflects the current launcher design.

## User Value

- Designers can keep using the real renderer-backed local design pages for accurate work.
- Northlight can generate one shareable, self-contained HTML export for the current launcher design.
- The shared export remains visually aligned with the current real renderer state at the time of export.

## Scope

- In scope:
- Add `npm run export:design`.
- Generate one self-contained share HTML file for the current launcher design from the current renderer-backed design page.
- Keep the existing local `design/*.html` workflow intact.
- Preserve the exact launcher native viewport size in the exported file.
- Make the export location and regeneration workflow explicit in docs.

## Out of Scope

- Replacing the local renderer-backed design workflow.
- Rewriting the launcher as a handwritten static mockup.
- Building a bi-directional sync system from shared exports back into source.

## User Stories

- As a designer, I can run `npm run export:design` and get a single shareable launcher HTML file.
- As a collaborator, I can open the exported HTML directly without needing the repo build pipeline.

## Interaction Notes

- The local source-of-truth pages stay in `design/`.
- The shareable export should be emitted into a clearly separate folder, for example `design/export/`.
- The export should be self-contained enough to open directly via `file://` on another machine without additional build output.

## Acceptance Criteria

- [ ] `npm run export:design` generates a single self-contained launcher export HTML.
- [ ] The exported file opens directly via `file://` without requiring separate JS/CSS files.
- [ ] The exported launcher page preserves its exact `1120×760` native viewport size.
- [ ] The existing local `design/launcher-current-view.html` workflow continues to use the real renderer bundles.
- [ ] The export workflow is documented in `docs/user-guide.md`.

## Failure Cases

- If the export step cannot inline the required assets, it should fail clearly instead of producing a partial artifact.
- If export generation fails, the local design workflow remains usable.

## Performance Expectations

- Export generation should be fast enough for normal handoff workflows.
- Running `npm run export:design` should not require manual editing of generated files.

## Notes

- A pragmatic implementation can build the local renderer-backed launcher design page first, then inline its CSS/JS into a single HTML file under `design/export/`.
