# Icon Tile Simplification

## Summary

Northlight currently wraps many real app icons and settings-command icons inside a decorative rounded tile. This makes the icon area feel heavier than necessary and obscures the app icon itself behind an extra visual frame. The launcher should present real icons more directly, with less chrome around them.

## Problem

- Native app icons and pane-style settings icons are being visually framed by an extra background tile.
- The extra tile makes the result list feel denser and less clean than intended.
- The icon treatment is inconsistent: generic fallback glyphs still need a shaped container, but real icons do not.

## Scope

- In scope: remove the decorative icon tile background for real app icons loaded from macOS assets.
- In scope: remove the decorative icon tile background for command results that render pane-style icon images.
- In scope: keep a compact icon slot for alignment so rows still scan cleanly.
- In scope: preserve fallback icon containers for generic glyph-only results where no real icon/image exists.
- In scope: adjust spacing, sizing, and clipping only as needed to keep icon rows visually balanced after the container is removed.

## Out Of Scope

- Out of scope: a broader redesign of result row spacing, typography, or selection styling.
- Out of scope: changing the icon artwork itself.
- Out of scope: changing preview-pane media presentation.

## User-Visible Behavior

- App rows with a real app icon should show the icon by itself, without the extra surrounding colored tile.
- Settings-command rows with pane-style icons should also show the icon by itself, without the extra decorative tile.
- Rows using fallback glyph icons may keep their simplified background treatment so the glyph remains legible.
- Result rows should remain aligned and visually stable across mixed icon types.

## Failure Cases

- Removing the tile must not cause icons to crop incorrectly.
- Removing the tile must not shift text alignment unpredictably between rows.
- Fallback glyph icons must not become visually lost against the row background.

## Acceptance Criteria

- [ ] Real app icons render without the extra decorative tile behind them.
- [ ] Pane-style settings command icons render without the extra decorative tile behind them.
- [ ] Glyph-only fallback icons still render legibly.
- [ ] Mixed result lists with app icons, file glyphs, and command icons remain aligned.
- [ ] UI tests cover the DOM/class behavior for icon rows with and without image assets.
- [ ] At least one Playwright check verifies the simplified icon rendering for a real app icon and a settings command icon.
