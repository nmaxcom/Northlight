# Northlight Search Refiners Guide

## Purpose

Northlight lets you start with a normal search, then add a short trailing refiner only when you need to clarify intent.

The intended flow is:

1. type what you want normally
2. check the first results
3. add one or more refiners at the end only if the result mix is wrong

Examples:

- `chrome`
- `chrome app`
- `invoice`
- `invoice .pdf`
- `design`
- `design .png in:downloads`

Northlight is not expecting a command language from the first character. Refiners are optional clarifiers.

## The Parsing Rule

Refiners are trailing standalone hints.

Northlight only interprets them when they appear at the end of the query as a parseable suffix.

Examples that are treated as refiners:

- `project/`
- `snowboard img`
- `invoice .pdf`
- `config .json in:library`
- `northlight .md in:/Users/nm4/STUFF/Coding/Northlight`
- `report today`

Examples that stay literal:

- `img-tools`
- `invoice pdf`
- `notes in:docs`
- `snowboard app .jpg`

If the trailing expression is ambiguous or conflicting, Northlight falls back to plain text search instead of applying a broken interpretation.

## Explicit Beats Ambiguous

Northlight now prefers explicit syntax for file formats.

Use:

- `.pdf`
- `.md`
- `.json`
- `.png`
- `.jpg`

Instead of:

- `pdf`
- `md`
- `json`
- `png`
- `jpg`

Why:

- `invoice pdf` can plausibly mean a literal filename or phrase
- `invoice .pdf` clearly means "show me PDF files"

The one intentional exception is `img`, which stays as a word because it is a category shortcut for many image formats.

## What The Chips Mean

When Northlight recognizes refiners, it shows them as chips below the search box.

Those chips are not decorative. They are the launcher telling you exactly what it parsed.

Examples:

- query: `invoice .pdf`
  chips: `.pdf`

- query: `config .json in:library today`
  chips: `.json`, `in:library`, `today`

- query: `northlight .md in:/Users/nm4/My Projects/Northlight recent`
  chips: `.md`, `in:/Users/nm4/My Projects/Northlight`, `recent`

If a chip does not appear, Northlight did not accept that part as a refiner.

## Folder Search

The fastest folder refiner is a trailing slash.

Examples:

- `project/`
- `chrome/`
- `screenshots/`

What it does:

- keeps the original search text
- filters the result set to folders only

Use it when:

- a file is outranking the folder
- an app bundle is outranking the directory
- you want the container, not the item inside it

## Type Refiners

Type refiners narrow the result set by kind or format.

### Apps

Use:

- `app`

Examples:

- `chrome app`
- `figma app`
- `notion app`

Use this when support files, cache folders, or documents are taking over the top results.

### Folders

Use:

- `/`
- `folder`
- `dir`

Examples:

- `project/`
- `chrome folder`
- `assets dir`

### Generic Files

Use:

- `file`

Examples:

- `invoice file`
- `readme file`

This is useful when app or folder results are polluting the top of the list.

## Image And Format Refiners

These are the most useful refiners for day-to-day file search.

### Images

Use:

- `img`
- `image`
- `photo`

Examples:

- `snowboard img`
- `hero photo`
- `reference image`

`img` is special. It is not one single extension. It means common image formats, including:

- `jpg`
- `jpeg`
- `png`
- `gif`
- `webp`
- `bmp`
- `tif`
- `tiff`
- `svg`
- `avif`
- `heic`
- `heif`

### Explicit Extensions

If you know the format, use the dot form.

Examples:

- `invoice .pdf`
- `notes .md`
- `config .json`
- `mockup .png`
- `export .jpg`
- `settings .yaml`
- `theme .toml`

Common supported examples:

- `.pdf`
- `.md`
- `.txt`
- `.json`
- `.yaml`
- `.toml`
- `.jpg`
- `.png`
- `.gif`
- `.svg`
- `.webp`

Why this matters:

- `invoice` can show folders, screenshots, exports, and drafts
- `invoice .pdf` clearly says you only want PDF files

## Scope Refiners

Scope refiners narrow where Northlight should look.

There are two kinds:

1. named scopes
2. explicit paths

### Named Scopes

Supported values:

- `in:downloads`
- `in:documents`
- `in:desktop`
- `in:library`
- `in:home`

Examples:

- `invoice .pdf in:downloads`
- `screenshot .png in:desktop`
- `cursor .json in:library`
- `meeting notes .md in:documents`
- `chrome in:home`

Use named scopes when:

- you roughly know the area
- you want a quick scope hint
- the query appears in too many places

### Explicit Paths

You can also give a concrete path with `in:`.

Supported forms:

- `in:/absolute/path`
- `in:~/path/from/home`

Examples:

- `northlight .md in:/Users/nm4/STUFF/Coding/Northlight`
- `brief .pdf in:/Users/nm4/Documents/Clients`
- `config .json in:~/Library/ApplicationSupport`
- `screenshot .png in:~/Desktop`

Important behavior:

- Northlight can now consume spaces inside an `in:` path without forcing quotes
- the path can be written naturally, such as `in:/Users/nm4/My Projects/Northlight`
- Northlight protects that internally during parsing

Examples:

- `northlight .md in:/Users/nm4/My Projects/Northlight`
- `notes .md in:~/Documents`

Current limitation:

- the explicit path scope must be the final scope segment in the parsed suffix
- in practice, that means it can be followed by already parseable trailing tokens like `recent`, but the boundary must still be unambiguous

Examples that are not currently valid:

- `notes .md in:docs`
- `config .json in:Library/ApplicationSupport`

If the path expression is too ambiguous, Northlight will keep it as literal text instead of guessing.

### Named Scope Vs Explicit Path

Use a named scope when:

- you want speed
- the folder is a common area such as Downloads or Library
- exact depth does not matter yet

Use an explicit path when:

- the file belongs to one project root
- the name is common across many repos
- you want to constrain search to one workspace or client folder

## Time Refiners

Time refiners narrow by modification time.

Supported values:

- `today`
- `yesterday`
- `recent`

Examples:

- `report today`
- `invoice .pdf yesterday`
- `mockup .png recent`
- `config .json in:library today`

## Exact Time Semantics

`today`

- means modified on the current local calendar day
- from local midnight up to now

`yesterday`

- means modified on the previous local calendar day
- from yesterday's local midnight up to today's local midnight

`recent`

- means modified within the last 7 days
- specifically, the last `168` hours from the current moment

So:

- `today` and `yesterday` follow local date boundaries
- `recent` is a rolling 7-day window

## Combining Refiners

Refiners are additive.

Examples:

- `invoice .pdf`
- `invoice .pdf in:downloads`
- `config .json in:library`
- `config .json in:library today`
- `reference img in:desktop recent`
- `northlight .md in:/Users/nm4/My Projects/Northlight recent`

Good mental model:

- the first words say what you are looking for
- the trailing refiners say how to narrow it

## Practical Examples

### Find the app, not its support files

Start with:

- `chrome`

If support folders or assets appear too high:

- `chrome app`

### Find the image, not the docs

Start with:

- `snowboard`

If PDFs, notes, and folders appear above the photo:

- `snowboard img`

If you specifically want a JPEG:

- `snowboard .jpg`

### Find a JSON config in `~/Library`

Start with:

- `cursor`

If the search is too broad:

- `cursor .json in:library`

If you changed it today:

- `cursor .json in:library today`

### Search inside one project root

If you know the file belongs to one repo:

- `northlight .md in:/Users/nm4/STUFF/Coding/Northlight`

If you only want recently modified Markdown files there:

- `northlight .md in:/Users/nm4/STUFF/Coding/Northlight recent`

If the root itself contains spaces:

- `northlight .md in:/Users/nm4/My Projects/Northlight`

### Find a folder instead of a file

Start with:

- `project`

If files are outranking the directory:

- `project/`

### Find a recent download

Start with:

- `invoice`

If the list is too broad:

- `invoice .pdf in:downloads recent`

## How To Recover When Results Still Aren't Right

Try this sequence:

1. keep only the strongest keyword
2. add a type refiner
3. add a scope refiner
4. add a time refiner

Examples:

- from `snowboard` to `snowboard img`
- from `config` to `config .json in:library`
- from `northlight` to `northlight .md in:/Users/nm4/My Projects/Northlight`
- from `report` to `report today`

## Quick Reference

Folder:

- `project/`

Kind:

- `app`
- `file`
- `folder`
- `img`

Extensions:

- `.pdf`
- `.md`
- `.json`
- `.jpg`
- `.png`

Named scopes:

- `in:downloads`
- `in:documents`
- `in:desktop`
- `in:library`
- `in:home`

Explicit paths:

- `in:/absolute/path`
- `in:~/path`

Time:

- `today`
- `yesterday`
- `recent`
