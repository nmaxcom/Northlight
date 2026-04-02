# Northlight User Guide

## What It Does

Northlight is a keyboard-first macOS launcher for fast local search, deterministic answers, and quick action workflows.

Current built-in capabilities:

- Search local files, folders, and apps by name.
- Search through a hybrid local backbone: Spotlight brings broad macOS recall, and Northlight's local catalog lifts recent and repeated choices.
- Refine a broad query with trailing intent hints such as `project/`, `snowboard img`, `snowboard jpg`, `figma app`, `notes md`, `config json in:library`, or `report today`.
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
- Northlight enforces a single launcher instance, so reopening the app or retriggering activation reuses the same launcher window instead of creating duplicates.
- The header acts as a drag region, so you can reposition the launcher like a native utility window.
- The launcher remembers its last moved position and reopens there.
- Dragging the launcher no longer streams live settings updates back into the renderer, so the interface stays visually stable while you reposition it.
- On macOS, Northlight runs as an accessory utility window: it stays out of the Dock, app switcher, and Mission Control window set, and it shows across Spaces instead of pulling you back to the desktop where it launched.
- On macOS, opening the launcher from the global shortcut now explicitly re-activates the app and ignores the first transient blur, so the window stays visible instead of flickering closed.
- Keyboard launch now ignores the cursor's resting position until you actually move or use the mouse inside the launcher, so `Enter` keeps targeting the keyboard-selected result.
- The top-right status area shows the app version, indexed item count, and current index state.
- The launcher keeps a single active focus model: `Tab` and stray focus events do not move focus away from the active input for the current mode.
- A persistent bottom bar always shows the primary action for the current result and an `Actions` trigger.
- `Cmd+,` opens the Northlight settings window.
- Clicking away from the launcher hides it again.
- The launcher mockup in `design/launcher-current-view.html` is calibrated to the native launcher content size of `1120×760` for visual design checks.

## Search Behavior

- Type at least 2 characters for local file, folder, and app search.
- Exact and prefix matches rank above loose path matches.
- Apps are ranked above low-value system matches when names compete.
- macOS local recall is hybrid: Spotlight supplies broad candidates, then Northlight reranks them with personal signals from its local catalog.
- Aliases rank above generic fuzzy matches when the trigger matches exactly.
- Snippets and clipboard items can participate in search without overriding stronger file or app matches for broad queries.
- Search is local-first and favors common personal locations such as `/Applications`, `~/Desktop`, `~/Documents`, `~/Downloads`, and `~/STUFF/Coding`.
- Trailing intent refiners stay optional: Northlight first searches broadly, then lets you tighten the result type with suffixes like `/`, `img`, `jpg`, `pdf`, `md`, `app`, `file`, or `folder`.
- Scope refiners let you narrow broad queries with `in:downloads`, `in:documents`, `in:desktop`, `in:library`, or `in:home`.
- Time refiners let you narrow local results with `today`, `yesterday`, and `recent`.
- Intent refiners are only recognized as trailing standalone terms, so literal names like `img-tools` keep searching as plain text.
- For a full user guide to search refiners, examples, and combinations, see `docs/search-refiners-guide.md`.

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
- File results now expose stronger default actions such as `Quick Look` and `Copy Markdown Link` in addition to open, reveal, and copy-path flows.
- The preview pane can show real image previews, PDF page thumbnails, plain-text/code contents for text-like files, folder contents, app bundle info, clipboard contents, and deterministic calculation details.
- Native app icons and image previews are loaded from real macOS assets so they render consistently inside the launcher.
- When the selected result stays the same across background refreshes, the preview remains pinned instead of flashing back to a fallback state.
- Result rows and the bottom action bar are intentionally compact so more hits fit on screen at once.

## Settings Window

The settings window is the control center for launcher preferences.

- Toggle best match, app-first ranking, preview, quick look, snippets, and clipboard history.
- Capture a new global launcher shortcut directly by pressing the combination in settings, or clear it entirely to disable the launcher hotkey.
- During `npm run dev`, a cleared launcher shortcut still falls back to `Cmd+Shift+Space` for that session so the launcher cannot strand itself hidden while you are iterating.
- The shortcut field in settings renders Apple-style keycaps and still shows the active session shortcut when development fallback is in effect.
- The settings mockup in `design/settings-current-view.html` is calibrated to the native settings content size of `980×760` for visual design checks.
- Set how many clipboard items to retain.
- Create aliases for paths, snippets, or direct settings access.
- Create reusable text snippets.
- Enable or disable indexed scope paths.
- Use scope presets like `~/Library`, Home, or `/` to broaden search coverage without typing full paths by hand.
- `Add Scope` now opens a dedicated add-path composer instead of inserting a blank invalid scope row.
- Save actions now show an explicit `Saving…` state, and settings buttons have visible pressed/disabled feedback.
- Enable or disable filesystem watchers for live scope invalidation.
- Review validation warnings before saving.
- The scopes view explains the hybrid model: wider roots help the local catalog and scoped fallback search, but they increase hydration cost and usually add more low-value results.
- If you add Home or `~/Library`, Northlight now ignores its own internal support files so broad scopes do not keep retriggering the index on self-writes.
- Very broad scopes such as Home, `~/Library`, and `/` are still indexed, but Northlight no longer attaches recursive live watchers to them because macOS background churn would keep forcing refresh loops.
- In development, you can enable diagnostics tracing with `NORTHLIGHT_TRACE=1 npm run dev` to capture structured search, status, preview, icon, watcher, and clipboard activity.
- In a traced dev session, `Cmd+Shift+D` writes the current trace buffer and idle summary to `~/Library/Application Support/Northlight/trace-dumps/` and shows a confirmation in the launcher.

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
- Search starts from the last good persisted catalog and hydrates it in the background.
- Spotlight recall remains available even while the local catalog is still restoring or hydrating.
- Background index refreshes keep the current result list visible while new hits resolve, instead of flashing back to the empty `Searching...` state.
- Keeping a non-empty query open no longer retriggers full background index rebuilds on every local search pass, so steady search sessions stop burning CPU in the main process.
- When files or folders move, stale persisted paths are pruned from results instead of lingering across relaunches.
- Filesystem watchers can invalidate local search caches immediately when enabled scopes change on disk.
- Launcher show/hide avoids async settings reads on the hot path, so shortcut-to-window appearance stays more consistent.
- Diagnostics traces are development-only and stay off by default, so normal launcher sessions do not pay the extra logging overhead.
- This guide must be updated whenever visible launcher behavior changes.
