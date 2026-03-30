# Northlight Agent Rules

## Product Direction

- Build for macOS first. Optimize for keyboard speed, low latency, and clear action affordances.
- The bar should feel premium and restrained: fast, confident, and easy to parse.
- Deterministic answers beat AI when both can solve the same query.

## Architecture Boundaries

- Keep Electron renderer focused on presentation.
- Keep OS integrations, search orchestration, and command execution in the main process or dedicated services.
- Expose only narrow, typed APIs through preload.
- Do not let renderer code call shell commands directly.

## Safety

- Never use `rm` or `rmdir`; use `trash` if deletion is explicitly required.
- Avoid destructive file actions unless the user asked for them.
- Tool execution must be explicit, logged, and permission-aware.

## Workflow

- Prefer small vertical slices that keep the app runnable.
- Write or update a feature spec before implementing any meaningful feature.
- Do not start implementation until the user has approved the feature spec and its pass/fail criteria.
- Keep accepted specs in `specs/approved/` and draft specs in `specs/drafts/`.
- Pair every feature spec with an explicit test plan that states unit, integration, and e2e coverage.
- Add or update tests for parser, ranking, and provider behavior when changing those areas.
- Use `npx playwright` for keyboard-flow and UI regressions.
- Before committing in a dirty worktree, stage only files from the current task.
- Make a commit for each significant completed slice that changes user-visible behavior, architecture, or persisted settings; avoid commits for tiny churn or half-finished noise.
- Commit only files or hunks created or modified by the current task; never bundle unrelated user edits.
- Any user-visible behavior change must update `docs/user-guide.md` in the same task and commit.
- Any shipped user-visible or behavior-affecting change must also bump the app semver in `package.json` in the same task and commit.

## Spec Gate

- Every approved feature must define user-visible behavior, non-goals, failure cases, and measurable acceptance criteria.
- Tests are part of the spec, not an afterthought.
- If implementation reveals the spec is wrong, update the spec first and then change code.
- Avoid hidden scope creep. Any behavior not written in the approved spec is out of scope for that change unless the user explicitly expands it.

## Current Priorities

- Build the launcher shell and file/app search flows.
- Wire local macOS search through Spotlight metadata primitives.
- Add deterministic conversion providers before AI ranking.
- Keep `docs/user-guide.md` concise and current so users can rely on it as the single feature guide.
