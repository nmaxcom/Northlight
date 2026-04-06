# Test Plan: Icon Tile Simplification

## Unit / Component

- [ ] `src/components/LauncherBar.test.tsx`
  - app results with image-backed icons render without the old decorative tile styling
  - settings command results with image-backed icons render without the old decorative tile styling
  - fallback glyph-only results still render with the expected fallback treatment

## Visual / DOM

- [ ] verify the result icon container exposes distinct styling hooks for:
  - image-backed app icons
  - image-backed command icons
  - glyph fallback icons

## E2E

- [ ] `tests/e2e/launcher.spec.ts`
  - a query that returns a real app icon renders the simplified icon presentation
  - `wifi` or `privacy` renders the simplified pane-icon presentation

## Manual Verification

- [ ] search for a third-party app with a macOS icon and confirm there is no extra rounded tile around it
- [ ] search `wifi` and confirm the pane icon sits cleanly without the extra surrounding frame
- [ ] search a fallback file result and confirm the generic icon remains readable
