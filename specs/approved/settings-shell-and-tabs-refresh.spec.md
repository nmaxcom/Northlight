# Settings Shell And Tabs Refresh

## Goal

Make the Northlight settings window feel closer to a native macOS utility surface by improving drag behavior, moving section navigation out of the scrolled content, and upgrading the visual treatment of the primary controls.

## User-Visible Behavior

- The settings window header becomes a drag region so the user can reposition the window by dragging the top shell chrome, similar to the launcher.
- Interactive controls inside that header remain clickable and do not trigger dragging.
- Section navigation uses a more appropriate tab control treatment for desktop settings navigation.
- The tab control stays fixed outside the per-section scroll area instead of scrolling away with each section body.
- Switching tabs keeps the user in the same settings shell while only the content region changes.
- Primary and secondary buttons in settings get a more intentional visual treatment with clearer hover, pressed, focus, and disabled states.
- The shared settings mockup continues to reflect the real renderer structure and updated interactions.

## Non-Goals

- No information architecture rewrite of the settings sections.
- No new settings categories.
- No behavior change to saving, validation, or settings persistence.
- No redesign of launcher controls in this slice.

## Constraints

- Preserve the current `980×760` settings content size.
- Keep the settings window usable on desktop and in the shared design mockup.
- Keep drag affordances limited to shell chrome and never interfere with text inputs, textareas, buttons, checkboxes, switches, or tab clicks.
- Keep renderer markup and styles shared with the design route, not duplicated in standalone mockup HTML.

## Failure Cases

- Dragging from the header does nothing.
- Dragging starts when clicking tabs, save buttons, or form controls.
- Tabs scroll away with content.
- Tab switching changes the shell layout height unexpectedly or produces layout jump.
- Buttons lose visible hover/active/focus feedback.
- Shared design route diverges from the real settings renderer.

## Acceptance Criteria

- A user can drag the settings window from its header area in the native app.
- A user cannot accidentally drag the window by interacting with tabs or form controls.
- Tabs remain visible while scrolling long settings sections.
- Tabs visibly communicate active, hover, pressed, and focus states.
- Primary and secondary buttons visibly communicate hover, pressed, focus, disabled, and saving states.
- The settings design route shows the same updated shell and interactions as the real renderer.
- Playwright verifies the updated settings shell behavior and visual structure before the change is considered complete.
