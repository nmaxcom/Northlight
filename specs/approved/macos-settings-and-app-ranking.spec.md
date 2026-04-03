# Feature Spec: macOS Settings Coverage And Launcher Ranking Expectations

## Status

- Draft

## Problem

Northlight does not currently understand macOS System Settings destinations as first-class launcher results. It also allows noisy file matches inside app bundles, presets, support folders, and package contents to outrank the app the user is likely trying to open. A query such as `text` can surface files like `Text.tpl` instead of `TextEdit.app`, which breaks launcher expectations and makes Northlight feel less trustworthy than Spotlight or Raycast.

## User Value

- Users can open the most important macOS settings panes directly from Northlight with plain queries such as `settings`, `keyboard`, `security`, `privacy`, `display`, or `wifi`.
- Users get app results that match expected launcher behavior for broad app-intent queries such as `text`, `safari`, `notes`, or `preview`.
- Search quality becomes measurable through stable input-to-results tests instead of relying on ad hoc visual checks.

## Scope

- In scope: first-class command results for a broad, launcher-appropriate set of macOS System Settings destinations
- In scope: search synonyms for those destinations, including common English terms, alternative spellings, punctuation variants, and natural launcher phrases
- In scope: ranking changes that favor strong app-name matches over noisy file-path matches for broad launcher queries
- In scope: regression tests that assert expected top results and expected command presence for representative launcher queries
- In scope: user-guide updates for the new macOS settings targets

## Out Of Scope

- Exhaustive coverage of every System Settings pane or every subpage within a pane
- Arbitrary shell-command execution from search
- A plugin system for user-defined commands
- Runtime discovery of installed third-party preference panes

## User Stories

- As a user, when I type `settings`, I can open Northlight settings and relevant macOS settings destinations without leaving the launcher model.
- As a user, when I type `keyboard`, I can open the macOS Keyboard settings directly.
- As a user, when I type `privacy` or `security`, I can open the macOS Privacy & Security settings directly.
- As a user, when I type `display`, `wifi`, `bluetooth`, `sound`, `notifications`, or `wallpaper`, I can reach the corresponding macOS settings destination directly.
- As a user, when I type `text`, I see `TextEdit.app` ahead of unrelated files named `Text.*`.

## Interaction Notes

- Northlight keeps free-form root search. macOS settings destinations appear as command results in the same list.
- Northlight settings and macOS settings can both appear for broad terms such as `settings`, but the labels must make the difference obvious.
- Exact and prefix app-name matches should beat path-only file matches that happen to contain the same term inside app resources or presets.
- App-first ranking should be strongest when the basename match is exact, prefix, or acronym-based. It should not lift weak fuzzy app matches above clearly stronger file matches.
- The macOS settings catalog should cover the panes that a modern launcher is expected to open quickly, especially the destinations users reach often from Spotlight, Raycast, or daily troubleshooting flows.

## macOS Settings Targets

- `System Settings`
- `Keyboard`
- `Privacy & Security`
- `Displays`
- `Wallpaper`
- `Notifications`
- `Sound`
- `Wi-Fi`
- `Bluetooth`
- `Network`
- `General`
- `Appearance`
- `Control Center`
- `Desktop & Dock`
- `Battery`
- `Accessibility`
- `Siri`
- `Spotlight`
- `Lock Screen`
- `Screen Time`
- `VPN`
- `Apple ID` or account settings when available through the same deep-link model

## Search Vocabulary Expectations

- Each target should support the most natural launcher terms for that pane.
- Examples:
  - `settings`, `system settings`, `system preferences`
  - `keyboard`, `kb`, `shortcuts`
  - `privacy`, `security`, `privacy & security`
  - `display`, `displays`, `screen`, `monitor`
  - `wifi`, `wi-fi`
  - `bluetooth`, `bt`
  - `sound`, `audio`, `volume`
  - `notifications`, `notification`
  - `wallpaper`, `background`
  - `battery`, `power`
  - `network`, `vpn`

## Acceptance Criteria

- [ ] Typing `settings` returns an `Open System Settings` command result.
- [ ] Typing `system settings` returns an `Open System Settings` command result.
- [ ] Typing `system preferences` returns an `Open System Settings` command result for modern macOS naming compatibility.
- [ ] Typing `keyboard` returns an `Open Keyboard Settings` command result.
- [ ] Typing `privacy` returns an `Open Privacy & Security Settings` command result.
- [ ] Typing `security` returns an `Open Privacy & Security Settings` command result.
- [ ] Typing `display` or `screen` returns an `Open Display Settings` command result.
- [ ] Typing `wifi` returns an `Open Wi-Fi Settings` command result.
- [ ] Typing `bluetooth` returns an `Open Bluetooth Settings` command result.
- [ ] Typing `sound` or `audio` returns an `Open Sound Settings` command result.
- [ ] Typing `notifications` returns an `Open Notifications Settings` command result.
- [ ] Typing `wallpaper` or `background` returns an `Open Wallpaper Settings` command result.
- [ ] Typing `battery` or `power` returns an `Open Battery Settings` command result.
- [ ] Typing `network` returns an `Open Network Settings` command result.
- [ ] Typing `vpn` returns an `Open VPN Settings` command result when Northlight exposes VPN through the chosen settings-link strategy, otherwise it falls back to Network settings with explicit labeling.
- [ ] Typing `spotlight` returns an `Open Spotlight Settings` command result.
- [ ] Typing `accessibility` returns an `Open Accessibility Settings` command result.
- [ ] Typing `text` ranks `TextEdit.app` above unrelated files whose basename or path also contains `text`.
- [ ] Typing `textedit` ranks `TextEdit.app` as the top local result when the app is available in local search candidates.
- [ ] Typing `preview` ranks `Preview.app` above unrelated files such as `preview.png`, `preview copy.psd`, or support assets when the app is available in local search candidates.
- [ ] Typing `notes` ranks `Notes.app` above unrelated note files when the app is available in local search candidates and the textual app match is stronger.
- [ ] Typing `safari` ranks `Safari.app` above unrelated web-project files when the app is available in local search candidates.
- [ ] Ranking changes do not break existing abbreviation behavior such as `btt` for `BetterTouchTool.app`.
- [ ] Automated tests cover representative app queries, macOS settings queries, and ambiguous broad launcher queries.
- [ ] Automated tests cover noisy `/Applications/.../Resources/...` and `~/Library/...` path cases that should not outrank direct app-name matches.
- [ ] `docs/user-guide.md` documents the new macOS settings targets in the same change.

## Failure Cases

- If a specific macOS settings deep link fails, Northlight still opens general System Settings where possible.
- If local search does not return the expected app candidate, Northlight must not fabricate an app result.
- If a query is ambiguous, Northlight may show both a command and local results, but must keep the command labels explicit.
- If a settings term matches multiple plausible panes, Northlight should prefer the most common user intent and may show closely related alternatives below it.

## Performance Expectations

- The new command results add negligible overhead and should be resolved synchronously from local configuration.
- Ranking adjustments must not add visible latency to local result sorting.

## Notes

- This slice is intentionally broader than the initial draft. It aims to cover the practical macOS settings surface a premium launcher should support while keeping implementation deterministic and testable.
