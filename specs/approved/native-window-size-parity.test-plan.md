# Test Plan: Native Window Size Parity

## Status

- Approved

## Linked Spec

- `specs/approved/native-window-size-parity.spec.md`

## Coverage Strategy

- Unit: none required if sizing constants remain static and uncomputed.
- Integration: verify launcher and settings window constructors use the calibrated content-size contract.
- E2E: manual macOS comparison of real windows against mockup pages.

## Test Cases

- [ ] Launcher window is created with the calibrated native content size.
- [ ] Settings window is created with the calibrated native content size.
- [ ] Launcher mockup HTML renders the same dimensions documented by the launcher window contract.
- [ ] Settings mockup HTML renders the same dimensions documented by the settings window contract.

## Fixtures or Mocks

- No new fixtures required.

## Pass Criteria

- `npm run test:unit` passes if any touched tests exist.
- Manual macOS verification confirms launcher and settings mockups match the real windows at 100% browser zoom.

## Risks

- Settings uses a titled native window, so content-size and outer-size can be confused if the contract is not explicit.
