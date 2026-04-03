# Feature Spec: Intent Refiners

## Status

- Approved

## Problem

Northlight already handles broad local search, but users need a fast way to tighten intent when the first ranked results are not the asset type they want. Requiring symbolic prefixes before typing is too heavy for routine launcher use.

## User Value

- Users can start with a natural broad query and only add a short trailing refiner when ranking misses the intended result type.
- Users can recover image, folder, app, or extension-specific results without opening settings or learning a complex query language.

## Scope

- In scope:
- Parse safe trailing refiners such as `img`, `.jpg`, `.pdf`, `.md`, `app`, `file`, and `folder`.
- Treat a trailing `/` as a folder-only refiner when there is still query text before it.
- Filter local search results by kind and extension when a valid refiner is active.
- Remove unrelated result categories when a valid local refiner is active.
- Push the filter into indexed local search so refined queries can surface different top results than the broad query.
- Add extensive parser and integration tests with ambiguous and conflicting cases.

## Out of Scope

- Leading symbolic operators such as `@`, `#`, or `=`.
- Free-form boolean syntax or nested query expressions.
- Scope refiners such as `in:downloads`.
- Visual query-builder UI beyond the existing search field.

## User Stories

- As a user, I can type `snowboard`, see mixed results, then add `img` or `.jpg` to focus the launcher on image assets.
- As a user, I can type `project/` to force Northlight to treat the query as a folder search.
- As a user, I can type `figma app` to remove non-app results from consideration.

## Interaction Notes

- Trigger:
  Trailing standalone refiners at the end of the query, plus a trailing `/` folder suffix.
- Primary result behavior:
  Valid refiners narrow the local result set before the final top results are chosen.
- Secondary actions:
  Result actions remain unchanged.
- Empty states:
  If a valid refiner produces no matches, the launcher shows no matching result rather than falling back to unrelated result types.
- Error states:
  Conflicting or unsafe refiner combinations are ignored and treated as plain query text.

## Acceptance Criteria

- [ ] `snowboard img` returns only local image files when matching images exist.
- [ ] `snowboard .jpg` returns only `.jpg` or `.jpeg` files.
- [ ] `project/` returns only folder results.
- [ ] `figma app` returns only app results.
- [ ] Queries with no remaining search text after removing a candidate refiner are treated as plain text.
- [ ] Conflicting trailing refiners such as `snowboard app .jpg` do not activate filtering.
- [ ] Refined local search can surface matches that were not in the broad query’s top mixed results.

## Failure Cases

- If the query is only `img`, `.jpg`, `app`, or another refiner token, Northlight must not strip it and must search literally.
- If a token is embedded in a filename like `img-tools`, it must not be treated as a refiner.
- If multiple trailing refiners conflict, Northlight must preserve the original query instead of applying a partial filter.

## Performance Expectations

- Refiner parsing is pure string processing and should stay negligible relative to local search.
- Refined local search should keep the same latency profile as unrefined indexed search.

## Notes

- Refiners are deliberately trailing-only in this slice to minimize false positives.
