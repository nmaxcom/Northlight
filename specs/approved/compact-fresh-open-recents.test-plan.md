# Test Plan: Compact Fresh Open Recents

## Unit

- Verify typecheck covers the new bridge methods and result builders.

## Integration

- Build Electron with `npx electron-vite build --config electron.vite.config.ts` to verify main/preload/renderer bundles.
- Verify recent local selections are read from the catalog without requiring a typed query.

## E2E / visual

- Run the launcher e2e suite after implementation.
- Manually verify in Electron that empty query opens compact, typing expands to full size, and clearing returns compact.
