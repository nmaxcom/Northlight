# Test Plan: Intent Refiners

## Status

- Approved

## Linked Spec

- `specs/approved/intent-refiners.spec.md`

## Coverage Strategy

- Unit:
  Parser table tests for valid, invalid, ambiguous, uppercase, whitespace-heavy, and conflicting refiner combinations.
- Integration:
  Query builder tests with mocked local results containing folders, apps, images, markdown, pdf, and misleading filenames.
- E2E:
  Existing launcher coverage remains; this slice relies primarily on parser and integration tests.

## Test Cases

- [ ] Parse trailing `img`, `jpg`, `pdf`, `md`, `app`, `file`, and `folder`.
- [ ] Parse trailing `/` as folder-only when query text exists.
- [ ] Ignore refiner candidates when they are the full query.
- [ ] Ignore embedded tokens such as `img-tools` and `project/jpg`.
- [ ] Reject conflicting combinations such as `app jpg`.
- [ ] Return only filtered local results for refined queries.
- [ ] Preserve normal mixed results for unrefined queries.
- [ ] Ensure refined search can recover extension-specific results from a mixed mocked result pool.

## Fixtures or Mocks

- Mocked local result pools with files, folders, apps, multiple image extensions, and filenames containing refiner-like text.
- Existing runtime fixtures for default behavior.

## Pass Criteria

- `npm run test:unit` passes.
- Manual verification in dev confirms `project/`, `snowboard img`, `snowboard jpg`, and `figma app`.

## Risks

- Over-aggressive parsing may steal literal search terms from users.
- Filtering only after ranking would weaken the value of refiners, so integration coverage must protect against that regression.
