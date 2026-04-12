# Test Plan: Path Autocomplete And Path Aliases

## Unit

- [ ] parser tests for detecting path context in:
  - absolute paths starting with `/`
  - home-prefixed paths starting with `~`
  - future scoped input such as `in:`
- [ ] completion engine tests for:
  - next-segment completion only
  - case-insensitive matching with preserved insertion casing
  - alias and filesystem folder candidates sharing one completion model
  - home-directory resolution while keeping visible `~`
- [ ] alias validation tests enforcing:
  - no spaces
  - uniqueness rules
  - resolution to a concrete folder path

## Integration

- [ ] query/input tests showing `Tab` accepts the current active folder completion and appends `/`
- [ ] tests showing ambiguous matches produce multiple candidates rather than a silent guess
- [ ] tests showing continued typing narrows the candidate set correctly
- [ ] tests showing alias references resolve correctly both as direct path completions and inside `in:`
- [ ] tests showing path aliases do not override unrelated global search outside explicit path contexts

## Component

- [ ] `LauncherBar` tests for:
  - inline suggestion visibility for path input
  - completion list visibility when multiple candidates exist
  - `Up` and `Down` controlling the completion list while active
  - `Esc` dismissing completion UI without clearing typed input
  - keyboard focus staying in the search field during completion traversal
- [ ] action panel tests for:
  - exposing `Save Path Alias` when the current input resolves to a concrete folder
  - hiding or disabling that action when the input does not resolve cleanly

## Settings UI

- [ ] settings tests showing saved aliases appear in settings and persist correctly
- [ ] tests showing aliases created from the launcher are visible and editable in settings

## E2E

- [ ] type a partial absolute path and verify `Tab` completes only the next folder segment
- [ ] type a partial home path using `~` and verify the visible input keeps `~`
- [ ] trigger an ambiguous path segment and verify the completion list appears and can be navigated with `Up` and `Down`
- [ ] create a path alias from `Cmd+K` after resolving a folder path and verify it is reusable from the launcher
- [ ] verify a saved alias can be used and autocompleted inside an `in:` context
- [ ] verify normal global search still prefers ordinary app/file intent outside path contexts

## Manual Verification

- [ ] walk to a long folder path using repeated `Tab` acceptance of the next segment
- [ ] confirm the experience feels incremental rather than jumpy
- [ ] confirm ambiguous completions are understandable and keyboard-friendly
- [ ] create an alias from a resolved work folder and confirm it becomes a fast reusable reference
