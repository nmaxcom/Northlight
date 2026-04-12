# Feature Spec: Local Design Pages Backed By Real Renderer Bundles

## Status

- Approved

## Problem

The current design setup duplicates `*.html` and `*.live.html` variants for the same launcher/settings views. This creates maintenance overhead and confusion, while `file://`-only manual mockups would reintroduce drift away from the real app renderer.

## User Value

- Designers get a single local HTML file per window that opens directly in Chrome.
- The design pages stay backed by the real launcher/settings source of truth.
- The design folder becomes easier to understand and maintain.

## Scope

- In scope:
- Replace duplicated `design/*.html` and `design/*.live.html` pairs with a single local page per design surface.
- Generate local JS/CSS bundles for those design pages from the real renderer components.
- Preserve direct local opening via `file://`.
- Preserve HTTP preview via the existing design server workflow where practical.
- Keep launcher and settings design pages at their exact native content sizes.

## Out of Scope

- Rewriting launcher/settings as standalone static mockups.
- Replacing the real renderer with hand-maintained HTML/CSS copies.
- Broad redesign of the design page visuals.

## User Stories

- As a designer, I can open `design/launcher-current-view.html` locally and see the real launcher-based design view.
- As a designer, I can open `design/settings-current-view.html` locally and see the real settings-based design view.
- As a developer, I only maintain one design-page source per surface instead of paired `live` and exported variants.

## Interaction Notes

- The design HTML files are local-first and should render when opened directly from disk.
- The design bundles are generated from the real renderer components and styles.
- If the local bundles are missing or stale, the workflow must make regeneration explicit.

## Acceptance Criteria

- [ ] `design/launcher-current-view.html` opens via `file://` and renders the launcher-based design page.
- [ ] `design/settings-current-view.html` opens via `file://` and renders the settings-based design page.
- [ ] The rendered launcher/settings design pages are built from the real renderer source, not handwritten duplicates.
- [ ] The duplicate `*.live.html` design variants are removed.
- [ ] The design workflow documents how to regenerate the local design bundles.

## Failure Cases

- If a local design bundle is missing, the page should fail clearly instead of pretending to be current.
- If bundle generation fails, the app runtime remains unaffected.

## Performance Expectations

- Generating local design bundles should be fast enough for normal iteration.
- Opening the local design pages should not require a dev server.

## Notes

- A pragmatic implementation can emit local design entry bundles into `design/assets/` while keeping the HTML shells in `design/`.
