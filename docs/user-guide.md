# Northlight User Guide

## What It Does

Northlight is a keyboard-first macOS launcher for fast local search, deterministic answers, and quick action workflows.

Current built-in capabilities:

- Search local files, folders, and apps by name.
- Search through a hybrid local backbone: Spotlight brings broad macOS recall, and Northlight's local catalog lifts recent and repeated choices.
- Refine a broad query with trailing intent hints such as `project/`, `snowboard img`, `snowboard .jpg`, `figma app`, `notes .md`, `config .json in:library`, `northlight .md in:/Users/nm4/STUFF/Coding/Northlight`, or `report today`.
- Highlight each result type with a distinct color only in the left icon tile, so folders, apps, files, calculations, snippets, clipboard items, aliases, and commands are easier to scan.
- Match abbreviations and fuzzy app names such as `btt` and `fig`.
- Learn from repeated selections so important results rise to the top.
- Show one consistent result list without a separate `Best Match` card.
- Opening the launcher with an empty query starts from a clean blank state instead of showing leftover results from a previous search.
- Open the selected result with `Enter`.
- Pressing `Enter` on an app result also re-activates already-open apps correctly on macOS, bringing you to the Space where that app is visible.
- Reveal the selected result in Finder with `Cmd+Enter`.
- Copy the selected path with `Cmd+Shift+C`.
- Open a folder in Terminal, copy a result name, and open files in TextEdit.
- Resolve deterministic calculations inline, including units, percentages, currencies, timezone conversions, durations, data sizes, and volume measures.
- Copy a conversion result with `Enter`.
- Search saved aliases and snippets.
- Search recent clipboard history when clipboard tracking is enabled.
- Open major macOS System Settings destinations directly from search, including System Settings, Keyboard, Privacy & Security, Displays, Wi-Fi, Bluetooth, Sound, Notifications, Wallpaper, Battery, Network, Spotlight, and Accessibility.
- System Settings command results render pane-style icons instead of generic document-like placeholders.
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
- On macOS, dismissing the launcher now hides the Northlight app itself instead of leaving an active app with no key window behind, so the underlying app can usually keep keyboard focus without an extra click.
- Opening the dedicated settings window from the launcher now hides only the launcher surface, not the whole app, so Settings stays accessible instead of getting hidden behind the dismiss flow.
- Keyboard launch, typing, and live result refreshes now ignore the cursor's resting position until you actually move or use the mouse inside the launcher, so `Enter` keeps targeting the keyboard-selected result and stale hover highlights disappear as soon as you resume typing.
- Reopening the launcher also clears the previous pointer-hover session, so a resting cursor cannot silently reapply hover styling until the mouse moves again.
- The top-right status area shows the app version, the exact current catalog count, and the current readiness state.
- Clicking the `Theme` chip in the launcher header toggles between the fixed `Original` theme and the duplicated `Sandbox` theme for fast visual comparison.
- `Cmd+Shift+J` toggles detached Chromium DevTools for the Northlight window that is focused or visible, so you can inspect real launcher and settings CSS issues without leaving Electron.
- The launcher header also exposes an `Inspect` toggle; turning it on opens detached DevTools for the launcher, lowers the launcher out of always-on-top so DevTools stays usable, and keeps the launcher pinned visible until inspect mode is turned off again.
- The launcher keeps a single active focus model: `Tab` and stray focus events do not move focus away from the active input for the current mode.
- A persistent bottom bar always shows the primary action for the current result and an `Actions` trigger.
- `Cmd+,` opens the Northlight settings window.
- Clicking away from the launcher hides it again.
- The launcher mockup in `design/launcher-current-view.html` is calibrated to the native launcher content size of `1120×760` for visual design checks.
- `npm run build:design` regenerates local design bundles in `design/assets/bundles/` from the real launcher and settings renderer sources.
- `npm run export:design` generates one self-contained share file at `design/export/current-design.html` from the current launcher design page, so you can hand off a single HTML that opens directly without separate JS/CSS bundles.
- `npm run design` regenerates those same local bundles, serves the launcher/settings design pages over HTTP, prints the available design URLs in the terminal, and exposes an index at `/design/`.
- The local design pages are [design/launcher-current-view.html](/Users/nm4/STUFF/Coding/Northlight/design/launcher-current-view.html), [design/settings-current-view.html](/Users/nm4/STUFF/Coding/Northlight/design/settings-current-view.html) (classic horizontal tabs), [design/settings-current-view2.html](/Users/nm4/STUFF/Coding/Northlight/design/settings-current-view2.html) (sidebar layout), and [design/settings-current-view3.html](/Users/nm4/STUFF/Coding/Northlight/design/settings-current-view3.html) (dense layout, matches the shipping settings window). All work over `file://` and HTTP from bundles in `design/assets/bundles/`.
- The exported share files live in `design/export/` and are snapshots for handoff; the local `design/*.html` pages remain the real renderer-backed source of truth.
- The `Sandbox` launcher theme loads [src/styles/launcher-sandbox.css](/Users/nm4/STUFF/Coding/Northlight/src/styles/launcher-sandbox.css) through the real launcher bundle, so design pages still inherit the real launcher styling source of truth.
- During `npm run design`, Northlight also serves Chrome DevTools automatic workspace metadata at `/.well-known/appspecific/com.chrome.devtools.json`, so `Sources > Workspaces` can connect directly to this repo and persist `Styles` edits back into the local files when you are using HTTP.
- The shared launcher mockup now opens in a realistic in-use launcher state, including app, file, folder, and clipboard rows with dedicated icons plus a populated preview pane, so design work happens against something much closer to the live launcher.

## Search Behavior

- Type at least 2 characters for local file, folder, and app search.
- Exact and prefix matches rank above loose path matches.
- Apps are ranked above low-value system matches when names compete.
- Direct app-name intent is ranked ahead of noisy support files and app-bundle resources, so queries like `text`, `preview`, `notes`, and `safari` favor the corresponding app when available.
- Strong app hits from the fast tier are preserved when deeper search expands the list, so common apps such as `Calendar.app` do not disappear just because slower file results arrive later.
- Core Apple apps under `/System/Applications` are part of the default recall fixtures and regression coverage, so direct queries like `calendar` are protected against silent drops in the launcher pipeline.
- macOS local recall is hybrid: Spotlight supplies broad candidates, then Northlight reranks them with personal signals from its local catalog.
- Aliases rank above generic fuzzy matches when the trigger matches exactly.
- Snippets and clipboard items can participate in search without overriding stronger file or app matches for broad queries.
- Search is local-first and favors common personal locations such as `/Applications`, `/System/Applications`, `~/Desktop`, `~/Documents`, `~/Downloads`, and `~/STUFF/Coding`.
- Northlight now searches in tiers: fast paths such as apps, macOS settings commands, deterministic answers, and visible personal folders resolve first, while broader or noisier locations can expand the list slightly later.
- Clipboard and snippets no longer hijack the first visible rows for common app/file intent just because they are cheaper to fetch.
- Northlight records local search-performance samples so you can see how the hot and deep tiers behave on your own machine instead of guessing from feel alone.
- Trailing intent refiners stay optional: Northlight first searches broadly, then lets you tighten the result type with suffixes like `/`, `img`, `.jpg`, `.pdf`, `.md`, `app`, `file`, or `folder`.
- A trailing slash such as `lw/` is parsed as a folder refiner and appears as a `folder` chip inside the search box, to the right of the typed query.
- Scope refiners let you narrow broad queries with `in:downloads`, `in:documents`, `in:desktop`, `in:library`, `in:home`, or a concrete path such as `in:/Users/nm4/STUFF/Coding/Northlight` or `in:~/Documents`.
- `in:` works both at the start and at the end of the query, so `in:/Users/nm4/STUFF/Coding/Northlight product .md` and `product .md in:/Users/nm4/STUFF/Coding/Northlight` narrow to the same scope.
- Path-like input now autocompletes one folder segment at a time in the launcher, both for direct path typing and inside `in:`.
- Path autocomplete is casing-tolerant while you type, so lowercase input such as `/app` can still suggest and accept `/Applications/` with the real filesystem casing.
- `Tab` accepts the active folder or path-alias completion, `Up` / `Down` choose between ambiguous candidates, and `Escape` dismisses the completion list without clearing what you typed.
- Saved path aliases participate in that same completion model inside explicit path contexts such as `in:Northlight`.
- When multiple path completions are visible, Northlight keeps them in a compact single-line list with internal scroll and shows the active candidate's full path only once as contextual detail.
- The active path detail now sits in its own footer area below the scrollable completion list, so long paths no longer bleed visually behind the last visible completion row.
- Scoped search also applies to dotfiles and hidden-style support locations when you point `in:` at them explicitly, for example `in:/Users/nm4/STUFF/Coding/Northlight .env` or `ghost img in:/Users/nm4/Library/Application Support/HiddenGallery`.
- Time refiners let you narrow local results with `today`, `yesterday`, and `recent`.
- `today` means modified on the current local calendar day, `yesterday` means the previous local calendar day, and `recent` means the last 7 days by modification time.
- Common macOS settings terms such as `settings`, `system preferences`, `keyboard`, `privacy`, `security`, `display`, `wifi`, `bluetooth`, `sound`, `notifications`, `wallpaper`, `battery`, `network`, `spotlight`, and `accessibility` surface direct settings commands in the root results.
- The launcher shows active refiner chips inside the search box so you can confirm exactly what Northlight parsed.
- Intent refiners are only recognized as trailing standalone terms, so literal names like `img-tools` keep searching as plain text.
- For a full user guide to search refiners, examples, and combinations, see `docs/search-refiners-guide.md`.

## Deterministic Calculations

- Full expressions work inline for units, currencies, percentages, time zones, durations, data sizes, and volume conversions.
- Examples: `30mph to kmh`, `9km/h to mi/h`, `15% of 240`, `45 usd to eur`, `2pm CET in Tokyo`, `90 min to h`, `2048 mb to gb`, and `500ml to cup`.
- Northlight also surfaces obvious conversion suggestions early from compact tokens such as `40F`, `20USD`, `90min`, `2048MB`, and `500ml`.
- Currency conversions use a deterministic local rate table for quick answers, not live market rates.

## Keyboard Controls

- `Enter`: run the primary action.
- `Cmd+Enter`: reveal the selected result in Finder.
- `Cmd+Shift+C`: copy the selected result path.
- `Alt+Enter`: run the alternate action for the selected result, such as `Open In Terminal` or `Open With TextEdit`.
- `Cmd+Shift+T`: open the selected folder in Terminal when available.
- `Cmd+Shift+N`: copy only the selected result name when available.
- `Cmd+Backspace`: clear the current query or action filter when the text field is focused.
- `Cmd+K`: open the current result's `Actions` panel.
- `Tab`: accept the active path completion when the query is currently resolving a path or `in:` reference.
- `Cmd+,`: open the settings window.
- `Arrow Up` / `Arrow Down`: move through results.
- When the path completion list is visible, `Arrow Up` / `Arrow Down` move through completions instead of the main results.
- `Escape`: clear the query if there is text; otherwise hide the launcher cleanly without letting the dismiss keypress fall through into macOS.

## Result Behavior

- Running an open, reveal, or copy action hides the launcher so the target app or Finder can be seen immediately.
- Losing launcher focus also hides the launcher so Northlight gets out of the way and the underlying app can resume naturally.
- The result list scrolls inside the launcher when there are more results than fit on screen, and every result row uses the same visual layout including the top result.
- The search textbox keeps focus while you interact with the launcher chrome, and keyboard navigation auto-scrolls to the selected result.
- The launcher shell and the native utility window now share the same `10px` corner radius, and the search box is intentionally compressed to a very low-profile `35px` field.
- The search input uses a fully neutralized native appearance, so the text sits cleanly inside the field without extra WebKit capsules or clipping.
- The `Actions` panel opens above the bottom bar, lists all actions for the selected result, shows shortcuts when an action has one, and filters live as you type.
- File results now expose stronger default actions such as `Quick Look` and `Copy Markdown Link` in addition to open, reveal, and copy-path flows.
- The preview pane can show real image previews, PDF page thumbnails, plain-text/code contents for text-like files, folder contents, app bundle info, clipboard contents, and deterministic calculation details.
- File previews now fall back to content-based text detection, so extensionless documents and files with unusual extensions still show readable plain-text bodies when their contents are actually text, including common UTF-16 text files.
- Ambiguous no-extension paths are now classified from the real filesystem instead of from filename shape, so documents such as `log`, `state`, or `pid` no longer get mislabeled as folders just because they lack a dot.
- Preview titles, paths, code/text bodies, and metadata are selectable, so you can copy directly from the preview pane with the mouse.
- App previews no longer show the redundant generic `macOS application bundle` body block when there is no useful app-specific text to display.
- Native app icons and image previews are loaded from real macOS assets so they render consistently inside the launcher.
- Real image-backed result icons render without the extra decorative tile, so app icons and pane-style command icons read more cleanly in the list.
- In the `Sandbox` theme, result-icon backgrounds are removed across all result kinds for a cleaner icon-only treatment.
- In the `Sandbox` theme, the keyboard-selected result row uses the same background treatment as hover so list states stay visually aligned while iterating.
- In the `Sandbox` theme, preview text is selectable and the preview media/code panels can drop their borders when that cleaner treatment is desired.
- When the selected result stays the same across background refreshes, the preview remains pinned instead of flashing back to a fallback state.
- Result rows and the bottom action bar are intentionally compact so more hits fit on screen at once.

## Settings Window

The settings window is the control center for launcher preferences.

- Settings is only draggable from its dedicated top title bar, so the visible header and form controls behave like a normal window surface instead of acting as a giant drag target.
- The section sidebar stays fixed outside the scrolling content area, so long sections do not push navigation out of view.
- The shipping settings window uses a left sidebar (Overview, Aliases & Snippets, Scopes & Status), a compact header, dense grouped cards, and switch rows where extra detail lives in native tooltips (`title`) and screen-reader labels—not inline paragraphs between controls. Long scope guidance sits behind a collapsed `Scope reference` disclosure on the Scopes tab. Older layouts remain on `settings-current-view.html` (tabs) and `settings-current-view2.html` (sidebar with more inline copy).
- Primary and secondary settings buttons use a modern treatment with clear hover, pressed, disabled, and saving states.
- The settings mockup review page now uses a black outer background like the launcher review page, so both design frames sit on the same neutral surround.
- Toggle best match, app-first ranking, preview, quick look, snippets, and clipboard history.
- Capture a new global launcher shortcut directly by pressing the combination in settings, or clear it entirely to disable the launcher hotkey.
- During `npm run dev`, a cleared launcher shortcut still falls back to `Cmd+Shift+Space` for that session so the launcher cannot strand itself hidden while you are iterating.
- The shortcut field in settings renders Apple-style keycaps and still shows the active session shortcut when development fallback is in effect.
- All settings mock pages use the native settings content size of `980×760` for visual design checks.
- Set how many clipboard items to retain.
- Create aliases for paths, snippets, or direct settings access.
- When the launcher query already resolves to a concrete folder path, `Cmd+K` lets you save that folder as a no-spaces path alias directly from the launcher instead of forcing the flow through settings first.
- Create reusable text snippets.
- Enable or disable indexed scope paths.
- Mark a scope as `Fast Path` when it should behave like `~/Desktop` or `/Applications` and participate in the immediate search tier.
- Scope rows now show a rough search-cost label and indexed-item estimate so you can judge whether a path is a good `Fast Path` candidate.
- Use scope presets like `~/Library`, Home, or `/` to broaden search coverage without typing full paths by hand.
- `Add Scope` now opens a dedicated add-path composer instead of inserting a blank invalid scope row.
- Save actions now show an explicit `Saving…` state, and settings buttons have visible pressed/disabled feedback.
- Enable or disable filesystem watchers for live scope invalidation.
- Review validation warnings before saving.
- The scopes view explains the hybrid model: wider roots help the local catalog and scoped fallback search, but they increase hydration cost and usually add more low-value results.
- `Fast Path` is best reserved for high-frequency folders you want to feel immediate, such as an active workspace or project root.
- Broader paths such as `~/Library`, hidden folders, or giant trees can stay enabled without being `Fast Path`; they still contribute results, just not on the first latency-sensitive tier.
- The `Search Performance` card reports recent hot-tier latency, deep-tier latency, first-visible timing, first-useful timing, top-result replacements, and clipboard-first flashes from real queries.
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
- Catalog-backed results now default missing provider scores to `0`, so hot-path app recall stays consistent with Spotlight-backed results instead of silently dropping exact app matches.
