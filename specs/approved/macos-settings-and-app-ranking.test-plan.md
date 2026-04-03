# Test Plan: macOS Settings Coverage And Launcher Ranking Expectations

## Status

- Draft

## Unit Coverage

- Verify command matching for the supported settings catalog, including:
  - `settings`, `system settings`, `system preferences`
  - `keyboard`, `shortcuts`
  - `privacy`, `security`, `privacy & security`
  - `display`, `screen`, `monitor`
  - `wifi`, `wi-fi`
  - `bluetooth`, `bt`
  - `sound`, `audio`, `volume`
  - `notifications`
  - `wallpaper`, `background`
  - `battery`, `power`
  - `network`, `vpn`
  - `spotlight`
  - `accessibility`
- Verify broad settings terms can return both Northlight settings and macOS settings results with explicit labels.
- Verify app-first exactness promotes `TextEdit.app` over unrelated files such as `Text.tpl` when both are present in local candidates.
- Verify app-first exactness promotes `Preview.app`, `Notes.app`, and `Safari.app` over noisy file matches when the textual app match is clearly stronger.
- Verify exact, prefix, and acronym boosts do not break abbreviation matches such as `btt`.

## Integration Coverage

- Verify `buildResults()` returns macOS settings command results in the same result set as local and deterministic results.
- Verify mixed candidate sets with app, file, and folder results rank expected top entries for:
  - `text`
  - `textedit`
  - `preview`
  - `notes`
  - `safari`
  - `keyboard`
  - `privacy`
  - `security`
  - `display`
  - `wifi`
  - `bluetooth`
  - `sound`
  - `notifications`
  - `wallpaper`
  - `battery`
  - `network`
  - `spotlight`
  - `accessibility`
  - `settings`
- Verify Northlight settings remains reachable for `settings`, `preferences`, and `prefs`.
- Verify ambiguous broad terms can include more than one settings-related result without losing the primary expected destination.
- Verify result ordering stays stable when noisy file candidates live under `/Applications/...`, `/Applications/Utilities/...`, and `~/Library/...`.

## E2E Coverage

- None required for the first slice if deep-link execution is isolated behind tested action handlers and unit/integration coverage proves ranking and result composition.
- Add Playwright coverage later if the launcher gains a broader macOS command catalog or richer command UI.

## Fixtures

- Use explicit mocked local candidates that include:
  - `TextEdit.app`
  - `Preview.app`
  - `Notes.app`
  - `Safari.app`
  - at least two noisy file matches per representative query family
  - at least one unrelated high-scoring folder or file candidate
- Keep fixture names and paths realistic to macOS app-bundle noise, such as Adobe presets, `/Applications/.../Resources/...`, and support files under `~/Library`.
- Include cases where a file basename matches strongly but the user-intent app match should still win because the app name is direct and the file lives in bundle noise or support content.

## Suggested Query Matrix

- App intent:
  - `text -> TextEdit.app`
  - `textedit -> TextEdit.app`
  - `preview -> Preview.app`
  - `notes -> Notes.app`
  - `safari -> Safari.app`
  - `btt -> BetterTouchTool.app`
- System settings intent:
  - `settings -> Open System Settings`
  - `system preferences -> Open System Settings`
  - `keyboard -> Open Keyboard Settings`
  - `privacy -> Open Privacy & Security Settings`
  - `security -> Open Privacy & Security Settings`
  - `display -> Open Display Settings`
  - `wifi -> Open Wi-Fi Settings`
  - `bluetooth -> Open Bluetooth Settings`
  - `sound -> Open Sound Settings`
  - `notifications -> Open Notifications Settings`
  - `wallpaper -> Open Wallpaper Settings`
  - `battery -> Open Battery Settings`
  - `network -> Open Network Settings`
  - `spotlight -> Open Spotlight Settings`
  - `accessibility -> Open Accessibility Settings`
- Mixed ambiguity:
  - `prefs` should still expose Northlight settings
  - `settings` should expose both system and Northlight settings with explicit labels
  - `text` should not surface Adobe or support-file noise ahead of `TextEdit.app`

## Pass / Fail

- Pass when all specified queries produce the expected top result or expected command presence.
- Fail when a noisy file outranks a direct app match for launcher-style app-intent queries or when a supported macOS settings term fails to surface its command result.
