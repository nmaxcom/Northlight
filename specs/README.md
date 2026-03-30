# Spec-First Workflow

Northlight is built with a spec-first workflow:

1. Write a feature spec in `specs/drafts/`.
2. Write a matching test plan next to it.
3. Get explicit user approval on the spec and tests.
4. Move the spec to `specs/approved/`.
5. Implement only what the approved spec covers.
6. Keep the spec updated if accepted behavior changes during implementation.

## Folder Layout

- `specs/drafts/` contains proposed specs waiting for approval
- `specs/approved/` contains approved work items
- `specs/templates/` contains the canonical templates for new specs and test plans

## Required Pair

Every feature starts with two files:

- `feature-name.spec.md`
- `feature-name.test-plan.md`

The spec defines the behavior. The test plan defines what evidence proves the behavior works.
