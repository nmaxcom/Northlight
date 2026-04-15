# Test Plan: Launcher DevTools Pin Toggle

## Status

- Approved

## Linked Spec

- `specs/approved/launcher-devtools-pin-toggle.spec.md`

## Coverage Strategy

- Unit: launcher header renders the inspect toggle, updates state from the bridge, and triggers the bridge action.
- Integration: Electron main process toggles the shared inspect state and suppresses hide behavior while pinned.
- E2E: Playwright validates the launcher design page still exposes the inspect control and reflects the pinned visual state.

## Test Cases

- [ ] Clicking the launcher inspect toggle calls the runtime toggle and updates the visible state.
- [ ] Renderer listeners update the toggle if inspect mode changes outside the renderer.
- [ ] The launcher design page renders the inspect toggle beside the theme toggle.
- [ ] The inspect toggle can show both `Off` and `On` states in the shared launcher design page.

## Pass Criteria

- `npm run typecheck`
- `npm run test:unit -- src/components/LauncherBar.test.tsx`
- `npx playwright test tests/e2e/launcher.spec.ts --grep "launcher design mockup"`

## Risks

- Blur dismissal can still bypass the pin if any launcher hide path calls native hide directly.
- Detached DevTools lifecycle can drift from launcher state if close events are not synchronized.
