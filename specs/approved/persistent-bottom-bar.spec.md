# Feature Spec: Persistent Bottom Bar

## Status

- Approved

## Problem

The launcher currently exposes actions only as ad-hoc footer pills. Users need a stable command surface that is always present and immediately explains what Enter and other shortcuts will do.

## User Value

- The launcher feels more native and predictable.
- Primary and secondary actions are discoverable without hunting through result cards.

## Scope

- In scope: a bottom bar that is always visible
- In scope: contextual content based on the selected result
- In scope: idle-state hints when no result is selected

## Out of Scope

- Multi-row toolbars
- Touch-specific controls
- Global preferences UI for customizing the bar

## User Stories

- As a user, I can always see what the current primary action is.
- As a user, I can always see how to open the actions panel.

## Interaction Notes

- The left side emphasizes the primary action of the selected result.
- The right side always exposes `Actions` with `Cmd+K`.
- With no selected result, the bar shows contextual search/help hints instead of going blank.

## Acceptance Criteria

- [ ] The bottom bar remains visible in empty, searching, and result states.
- [ ] With a selected result, the bottom bar shows the primary action label and shortcut.
- [ ] The bottom bar shows the `Actions` trigger with `Cmd+K`.
- [ ] With no selected result, the bottom bar shows launcher guidance instead of action pills.

## Failure Cases

- If a result exposes no actions, the bottom bar still renders with idle guidance and the actions trigger.

## Performance Expectations

- Updating the bottom bar must be synchronous with result selection changes.

## Notes

- The bottom bar should read as part of the launcher chrome, not as HTML footer content.
