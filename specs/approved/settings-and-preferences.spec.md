# Feature Spec: Settings Window And Preferences

## Status

- Approved

## Problem

The launcher now needs real user control over aliases, scopes, clipboard/snippets, preview behavior, ranking preferences, and launcher utility-window behavior. Without a settings surface, these features become opaque and fragile.

## User Value

- Preferences are discoverable and editable in one place.
- Power features become usable without editing files manually.
- The launcher becomes adaptable to personal workflows.

## Scope

- In scope:
- Add a dedicated settings window for Northlight.
- Organize settings into clear sections for search, ranking, preview, clipboard/snippets, aliases, scopes, and launcher behavior.
- Persist preferences natively and apply them live when possible.
- Provide entry points to open settings from the launcher.

## Out of Scope

- A remote/cloud account system.
- Multi-user profiles.

## User Stories

- As a user, I can open a settings window and understand the launcher configuration quickly.
- As a user, I can add aliases, snippets, and scopes without editing files.
- As a user, I can enable/disable preview and clipboard features.

## Interaction Notes

- Trigger: keyboard shortcut and/or launcher action.
- Primary behavior: settings open in a dedicated, ordered window.
- Secondary actions: save, reset, and per-section edits.
- Empty states: aliases/snippets/scopes explain how to add the first entry.
- Error states: invalid paths or duplicate aliases are blocked with inline messaging.

## Acceptance Criteria

- [ ] A dedicated settings window opens from the launcher.
- [ ] Preferences are grouped into well-ordered sections.
- [ ] Aliases, scopes, snippets, and toggles persist across relaunches.
- [ ] Settings changes update launcher behavior without manual file edits.

## Failure Cases

- Invalid scope paths stay visible with inline validation and are not applied.
- Duplicate aliases or snippet triggers are rejected.
- Corrupt settings files fall back to defaults without crashing the app.

## Performance Expectations

- Opening settings should feel immediate and must not block launcher search.
- Reading preferences during search should use cached in-memory settings after initial load.

## Notes

- The settings window can share the main renderer bundle as long as it has its own mode and layout.
