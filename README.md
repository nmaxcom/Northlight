# Northlight

Northlight is a macOS-first launcher built with Electron, React, and Mantine. The first milestone focuses on steel-fast local intent resolution: files, folders, deterministic conversions, and direct actions such as open or reveal in Finder.

## Stack

- Electron
- React
- Mantine
- TypeScript
- Vitest
- Playwright

## Scripts

- `npm run dev` starts the renderer and Electron shell with watch-based relaunch for main/preload changes
- `npm run build` builds the renderer and Electron bundles
- `npm run verify` runs lint, typecheck, and unit tests
- `npm run test:e2e` runs Playwright against the preview build

## First Milestone

- Command bar shell
- Result ranking and intent preview
- Mock providers for files, folders, apps, and unit conversion
- Secure preload bridge ready for native integrations

## Delivery Process

- Write a feature spec before implementing meaningful functionality
- Pair the spec with a test plan that defines required unit, integration, and e2e checks
- Keep drafts in `specs/drafts/` until approved
- Move approved specs into `specs/approved/` before implementation starts
