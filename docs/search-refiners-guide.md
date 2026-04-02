# Northlight Search Refiners Guide

## What Refiners Are

Search refiners are short trailing hints that help Northlight narrow the result set only when broad search is not enough.

The intended workflow is:

1. Start with a normal search.
2. Look at the first results.
3. Add one or more refiners at the end only if you need to clarify intent.

Examples:

- `chrome`
- `chrome app`
- `invoice`
- `invoice pdf`
- `design`
- `design png in:downloads`

Northlight is not expecting you to type special symbols from the first character. Refiners are a second step, not the default language of the launcher.

## The Main Rule

Refiners are trailing standalone tokens.

That means Northlight only tries to interpret them when they appear at the end of the query as their own tokens.

Examples that are treated as refiners:

- `project/`
- `snowboard img`
- `invoice pdf`
- `config json in:library`
- `northlight md in:/Users/nm4/STUFF/Coding/Northlight`
- `report today`

Examples that stay literal:

- `img-tools`
- `project//`
- `notes in:docs`
- `snowboard app jpg`

When Northlight sees an ambiguous or conflicting trailing expression, it falls back to plain text search instead of applying a broken filter.

## How Northlight Reads A Refined Query

Take this query:

- `config json in:library today`

Northlight interprets it as:

- search text: `config`
- type refiner: `json`
- scope refiner: `in:library`
- time refiner: `today`

In other words:

- look for things matching `config`
- keep JSON-like files
- narrow to `~/Library`
- keep things modified today

## Folder Search

The fastest folder refiner is a trailing slash.

Examples:

- `project/`
- `chrome/`
- `screenshots/`

What it does:

- keeps your original search text
- filters the result set to folders only

Use it when:

- the file is outranking the folder
- the app bundle is outranking the directory
- you want the container, not the item inside it

## Type Refiners

Type refiners narrow the result set by result kind or file format.

### Apps

Use:

- `app`

Examples:

- `chrome app`
- `figma app`
- `notion app`

Use this when you typed the name of an app but support files, cache folders, documents, or screenshots are taking over the top results.

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

These are usually the highest-value refiners in day-to-day file search.

### Images

Use:

- `img`
- `image`
- `photo`

Examples:

- `snowboard img`
- `hero photo`
- `reference image`

This narrows the result set to image files only.

Internally, `img` maps to common image formats such as:

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

### Specific Formats

If you know the format, use it directly.

Examples:

- `invoice pdf`
- `notes md`
- `config json`
- `mockup png`
- `export jpg`
- `settings yaml`
- `theme toml`

Common supported format refiners:

- `pdf`
- `md`
- `txt`
- `json`
- `yaml`
- `toml`
- `jpg`
- `png`
- `gif`
- `svg`
- `webp`

Why this matters:

- `invoice` may show folders, screenshots, drafts, and exports
- `invoice pdf` says clearly that you only want PDFs

## Scope Refiners

Scope refiners narrow where Northlight should look.

Northlight supports two kinds of scope refiners:

1. named scopes
2. explicit paths

### Named Scope Refiners

Supported values:

- `in:downloads`
- `in:documents`
- `in:desktop`
- `in:library`
- `in:home`

Examples:

- `invoice pdf in:downloads`
- `screenshot png in:desktop`
- `cursor json in:library`
- `meeting notes md in:documents`
- `chrome in:home`

Use named scopes when:

- you roughly know the area
- you want a quick scope hint without typing a full path
- the query is common and appears in too many places

### Explicit Path Refiners

You can also use a concrete path with `in:`.

Supported forms:

- `in:/absolute/path`
- `in:~/path/from/home`

Examples:

- `northlight md in:/Users/nm4/STUFF/Coding/Northlight`
- `brief pdf in:/Users/nm4/Documents/Clients`
- `config json in:~/Library/ApplicationSupport`
- `screenshot png in:~/Desktop`

Important limitations:

- the path must be one token
- do not include spaces inside the `in:` token
- use absolute paths or `~/...`

Good examples:

- `northlight md in:/Users/nm4/STUFF/Coding/Northlight`
- `notes md in:~/Documents`

Examples that are not currently valid as path refiners:

- `notes md in:docs`
- `config json in:Library/ApplicationSupport`
- `notes md in:/Users/nm4/My Projects`

That last example fails because the path contains spaces and the current refiner parser is token-based. In that case, search more broadly first, then refine with a named scope or a path segment that does not require spaces.

### When To Use A Named Scope Vs A Path

Use a named scope when:

- you want speed
- the folder is one of the obvious zones like Downloads or Library
- you do not care about exact depth yet

Use an explicit path when:

- the file lives inside a project root
- the name is common across many repos
- you want to constrain search to one workspace or client folder

## Time Refiners

Time refiners narrow results by modification time.

Supported values:

- `today`
- `yesterday`
- `recent`

Examples:

- `report today`
- `invoice pdf yesterday`
- `mockup png recent`
- `config json in:library today`

### Exact Semantics

`today`

- means modified on the current local calendar day
- from local midnight up to now

`yesterday`

- means modified on the previous local calendar day
- from yesterday's local midnight up to today's local midnight

`recent`

- means modified within the last 7 days
- specifically, the last `168` hours from the current moment

So if you run the same query at a different time, `recent` moves with the current time, while `today` and `yesterday` follow local date boundaries.

### When Time Refiners Help

Use them when:

- you remember when you touched the file more clearly than what it was called
- the file name is generic
- the same document exists in many versions

Examples:

- `report today`
- `brief pdf yesterday`
- `mockup png recent`

## Combining Refiners

Refiners are additive.

Examples:

- `invoice pdf`
- `invoice pdf in:downloads`
- `config json in:library`
- `config json in:library today`
- `reference img in:desktop recent`
- `northlight md in:/Users/nm4/STUFF/Coding/Northlight recent`

Good mental model:

- the first words say what you are looking for
- the trailing refiners say how to narrow it

## Practical Examples

### Find the app, not the support files

Start with:

- `chrome`

If support folders or extension assets appear too high:

- `chrome app`

### Find the image, not the docs

Start with:

- `snowboard`

If PDFs, notes, and folders appear above the photo:

- `snowboard img`

If you specifically want a JPEG:

- `snowboard jpg`

### Find a JSON config in `~/Library`

Start with:

- `cursor`

If the search is too broad:

- `cursor json in:library`

If you changed it today:

- `cursor json in:library today`

### Search inside one project root

If you know the file belongs to a project:

- `northlight md in:/Users/nm4/STUFF/Coding/Northlight`

If you only want recently modified Markdown files there:

- `northlight md in:/Users/nm4/STUFF/Coding/Northlight recent`

### Find a folder instead of a file

Start with:

- `project`

If file matches are outranking the directory:

- `project/`

### Find a recent download

Start with:

- `invoice`

If the list is too broad:

- `invoice pdf in:downloads recent`

## How To Recover When Results Still Aren't Right

Try this sequence:

1. keep only the strongest keyword
2. add a type refiner
3. add a scope refiner
4. add a time refiner

Examples:

- from `snowboard` to `snowboard img`
- from `config` to `config json in:library`
- from `northlight` to `northlight md in:/Users/nm4/STUFF/Coding/Northlight`
- from `report` to `report today`

## Quick Reference

Folder:

- `project/`

Type:

- `app`
- `file`
- `folder`
- `img`
- `pdf`
- `md`
- `json`
- `jpg`
- `png`

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
