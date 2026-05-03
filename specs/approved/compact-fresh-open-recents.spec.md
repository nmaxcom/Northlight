# Compact Fresh Open Recents

## User-visible behavior

- Opening Northlight with an empty query shows a compact launcher window instead of the full search-and-preview layout.
- The compact state contains the title/header, search field, and a short result list seeded from recent local selections and recent clipboard items.
- Starting a query switches the launcher back to the full window size with normal search results and preview behavior.
- Clearing the query returns to the compact recent-list state.

## Non-goals

- This does not redesign the full search-results layout.
- This does not add a new persistence store for conversations beyond existing local selection and clipboard history data.
- This does not change the configured global shortcut.

## Failure cases

- If there are no recorded recent items, the compact state falls back to the existing empty-state copy.
- If a native icon is not cached yet, the row still paints immediately using the existing polished fallback artwork.
- If Electron cannot resize the window, search behavior must still function normally.

## Acceptance criteria

- Fresh open content size is smaller than the full `1120x760` launcher content size.
- Empty-query results are populated from recent selections and clipboard history when available.
- Non-empty queries continue to use normal immediate, hot, and deep search.
- The renderer requests compact layout only while the query is empty and no action panel is open.
