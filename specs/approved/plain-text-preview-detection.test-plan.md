# Test Plan: Plain-Text Preview Detection Beyond File Extensions

## Status

- Approved

## Linked Spec

- `specs/approved/plain-text-preview-detection.spec.md`

## Coverage Strategy

- Unit: text-vs-binary detection helper.
- Integration: main-process path preview behavior for extensionless, uncommon-extension, and binary fixture files.
- E2E: launcher preview shows file body for extensionless/uncommon text files and omits body for binary fixtures.

## Test Cases

- [ ] Extensionless UTF-8 file shows preview body text.
- [ ] Uncommon-extension UTF-8 file shows preview body text.
- [ ] Known image file still shows image preview instead of text body.
- [ ] Known PDF file still shows thumbnail preview instead of text body.
- [ ] Binary fixture does not show body text.
- [ ] Known code extension still uses code-style preview mode.

## Fixtures or Mocks

- Extensionless text fixture.
- Uncommon-extension text fixture.
- Binary fixture with NUL bytes.
- Existing image/PDF fixtures where available.

## Pass Criteria

- `npm run typecheck`
- Relevant unit/integration tests pass.
- `npx playwright test` coverage for launcher preview regressions passes.

## Risks

- Over-eager text detection could show junk for binary-ish files.
- Over-conservative detection could still miss legitimate text files with uncommon encodings.
