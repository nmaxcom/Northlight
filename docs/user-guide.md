# Northlight User Guide

## What It Does

Northlight is a keyboard-first macOS launcher for fast local search, deterministic answers, and quick action workflows.

Current built-in capabilities:

- Search local files, folders, and apps by name.
- Highlight each result type with a distinct color only in the left icon tile, so folders, apps, files, calculations, snippets, clipboard items, aliases, and commands are easier to scan.
- Match abbreviations and fuzzy app names such as `btt` and `fig`.
- Learn from repeated selections so important results rise to the top.
- Show a dominant `Best Match` card above the result list.
- Show recent local results first when the query is empty.
- Open the selected result with `Enter`.
- Reveal the selected result in Finder with `Cmd+Enter`.
- Copy the selected path with `Cmd+Shift+C`.
- Open a folder in Terminal, copy a result name, open files in TextEdit, and move results to Trash.
- Resolve deterministic calculations inline, including units, percentages, currencies, and timezone conversions.
- Copy a conversion result with `Enter`.
- Search saved aliases and snippets.
- Search recent clipboard history when clipboard tracking is enabled.
- Show an inline preview pane for the selected result.
- Open a dedicated settings window to manage ranking, preview, scopes, aliases, snippets, and clipboard history.

## Opening The Launcher

- Toggle the launcher with `Cmd+Shift+Space`.
- If the launcher is open, the same shortcut hides it.
- The launcher uses a single edge-to-edge shell inside its frameless utility window.
- The header acts as a drag region, so you can reposition the launcher like a native utility window.
- The launcher remembers its last moved position and reopens there.
- On macOS, Northlight runs as an accessory utility window: it stays out of the Dock, app switcher, and Mission Control window set, and it shows across Spaces instead of pulling you back to the desktop where it launched.
- On macOS, opening the launcher from the global shortcut now explicitly re-activates the app and ignores the first transient blur, so the window stays visible instead of flickering closed.
- The top-right status area shows the app version, indexed item count, and current index state.
- The launcher keeps a single active focus model: `Tab` and stray focus events do not move focus away from the active input for the current mode.
- A persistent bottom bar always shows the primary action for the current result and an `Actions` trigger.
- `Cmd+,` opens the Northlight settings window.
- Clicking away from the launcher hides it again.

## Search Behavior

- Type at least 2 characters for local file, folder, and app search.
- Exact and prefix matches rank above loose path matches.
- Apps are ranked above low-value system matches when names compete.
- Aliases rank above generic fuzzy matches when the trigger matches exactly.
- Snippets and clipboard items can participate in search without overriding stronger file or app matches for broad queries.
- Search is local-first and favors common personal locations such as `/Applications`, `~/Desktop`, `~/Documents`, `~/Downloads`, and `~/STUFF/Coding`.

## Keyboard Controls

- `Enter`: run the primary action.
- `Cmd+Enter`: reveal the selected result in Finder.
- `Cmd+Shift+C`: copy the selected result path.
- `Alt+Enter`: run the alternate action for the selected result, such as `Open In Terminal` or `Open With TextEdit`.
- `Cmd+Shift+T`: open the selected folder in Terminal when available.
- `Cmd+Shift+N`: copy only the selected result name when available.
- `Cmd+Backspace`: move the selected local result to Trash.
- `Cmd+K`: open the current result's `Actions` panel.
- `Cmd+,`: open the settings window.
- `Arrow Up` / `Arrow Down`: move through results.
- `Escape`: clear the query if there is text; otherwise hide the launcher.

## Result Behavior

- Running an open, reveal, or copy action hides the launcher so the target app or Finder can be seen immediately.
- Losing launcher focus also hides it so Finder or the previously active app is restored cleanly.
- The result list scrolls inside the launcher when there are more results than fit on screen.
- The search textbox keeps focus while you interact with the launcher chrome, and keyboard navigation auto-scrolls to the selected result.
- The launcher shell and the native utility window now share the same `10px` corner radius, and the search box is intentionally compressed to a very low-profile `35px` field.
- The search input uses a fully neutralized native appearance, so the text sits cleanly inside the field without extra WebKit capsules or clipping.
- The `Actions` panel opens above the bottom bar, lists all actions for the selected result, shows shortcuts when an action has one, and filters live as you type.
- The preview pane can show real image previews, PDF page thumbnails, plain-text/code contents for text-like files, folder contents, app bundle info, clipboard contents, and deterministic calculation details.
- Native app icons and image previews are loaded from real macOS assets so they render consistently inside the launcher.
- Result rows and the bottom action bar are intentionally compact so more hits fit on screen at once.

## Settings Window

The settings window is the control center for launcher preferences.

- Toggle best match, app-first ranking, preview, quick look, snippets, and clipboard history.
- Capture a new global launcher shortcut directly by pressing the combination in settings, or clear it entirely to disable the launcher hotkey.
- Set how many clipboard items to retain.
- Create aliases for paths, snippets, or direct settings access.
- Create reusable text snippets.
- Enable or disable indexed scope paths.
- Enable or disable filesystem watchers for live scope invalidation.
- Review validation warnings before saving.

## Deterministic Calculations

Supported query shape:

- `<number><unit> to <unit>`
- `<number> <unit> in <unit>`
- `<number><unit>` for automatic metric/imperial counterpart suggestions
- `<number>% of <number>`
- `<time> <zone> in <zone>`
- `<amount> <currency> to <currency>`

Examples:

- `30mph to kmh`
- `30cm`
- `5kg`
- `20ft2`
- `5 km in mi`
- `22 c to f`
- `15% of 240`
- `2pm CET in Tokyo`
- `45 usd to eur`

## Notes

- Search quality improves as the launcher records recency and frequency locally.
- Search starts from the last good persisted index and refreshes in the background.
- When files or folders move, stale persisted paths are pruned from results instead of lingering across relaunches.
- Filesystem watchers can invalidate local search caches immediately when enabled scopes change on disk.
- Launcher show/hide avoids async settings reads on the hot path, so shortcut-to-window appearance stays more consistent.
- This guide must be updated whenever visible launcher behavior changes.
