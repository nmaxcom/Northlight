# Northlight Search Refiners Guide

## What This Is

Northlight lets you start with a normal search, then add a short trailing hint only if the first results are not what you want.

You do not need to learn a command language before typing.

The intended flow is:

1. Type what you want normally.
2. See whether the top results already match your intent.
3. If they do not, add one small refiner at the end.

Examples:

- `chrome`
- `chrome app`
- `invoice`
- `invoice pdf`
- `design`
- `design png in:downloads`

## The Core Rule

Refiners are optional and trailing.

That means Northlight reads them when they appear as standalone tokens at the end of the query.

Good examples:

- `project/`
- `snowboard img`
- `invoice pdf`
- `config json in:library`
- `report today`

Literal searches still stay literal when the token is not being used as a trailing refiner.

Examples:

- `img-tools` keeps searching for `img-tools`
- `project//` is treated as plain text
- conflicting expressions such as `snowboard app jpg` fall back to plain text instead of applying a broken filter

## Folder Search

Use a trailing slash to say "I want folders".

Examples:

- `project/`
- `chrome/`
- `screenshots/`

What this does:

- keeps the main search text
- filters the result set to folders
- is useful when a file or app is outranking the directory you actually want

## Type Refiners

These tell Northlight which kind of result you want.

### Apps

Use:

- `app`

Examples:

- `chrome app`
- `figma app`
- `notion app`

Use this when you typed an app name but folders, docs, or support files are showing up too high.

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

These are the most useful refiners for everyday file search.

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

### Specific Extensions

Use the file type itself when you know the format.

Examples:

- `invoice pdf`
- `notes md`
- `config json`
- `mockup png`
- `export jpg`
- `settings yaml`
- `theme toml`

Common supported examples:

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

- `invoice` might show folders, spreadsheets, screenshots, or drafts
- `invoice pdf` tells Northlight you only want PDFs

## Scope Refiners

Scope refiners tell Northlight where to narrow the search.

Supported forms:

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

When to use them:

- when the query is common and appears in many places
- when you know roughly where the file lives
- when Home-wide search is returning too much noise

Practical examples:

- `config json in:library`
  This is good for app settings, support files, and internal configuration.

- `receipt pdf in:downloads`
  This is good for recent attachments, invoices, or exports.

- `mockup png in:desktop`
  This is good when you know you dropped the file there recently.

## Time Refiners

Time refiners tell Northlight to prefer files by modification time.

Supported forms:

- `today`
- `yesterday`
- `recent`

Examples:

- `report today`
- `invoice pdf yesterday`
- `mockup png recent`
- `config json in:library today`

How they behave:

- `today` means modified today
- `yesterday` means modified yesterday
- `recent` means modified recently

These are especially useful when you know the name only vaguely but remember when you touched it.

## Combining Refiners

Refiners are additive. You can combine them to get very targeted searches.

Examples:

- `invoice pdf`
- `invoice pdf in:downloads`
- `config json in:library`
- `config json in:library today`
- `reference img in:desktop recent`

Good mental model:

- the main words are still the search
- the trailing refiners narrow the result set

## Real Usage Examples

### Find an app, not its support files

Start with:

- `chrome`

If support folders or extension files are showing up too high, refine to:

- `chrome app`

### Find a photo when broad search is noisy

Start with:

- `snowboard`

If docs, folders, or app names appear above the photo, refine to:

- `snowboard img`

If you specifically want a JPEG:

- `snowboard jpg`

### Find a configuration file in `~/Library`

Start with:

- `cursor`

If the result set is too broad:

- `cursor json in:library`

If you changed it today:

- `cursor json in:library today`

### Find a folder quickly

Start with:

- `project`

If files and repos are outranking the directory:

- `project/`

### Find a Markdown note

Start with:

- `strategy`

If images, folders, or other assets appear too high:

- `strategy md`

### Find a recent download

Start with:

- `invoice`

If the list is too broad:

- `invoice pdf in:downloads recent`

## What Northlight Does Not Expect

Northlight does not require:

- prefixes before you start typing
- strict syntax from the first character
- memorizing symbolic commands for every search

The goal is not to make the launcher feel like a shell.

The goal is:

- normal search first
- lightweight clarification second

## If A Refiner Does Not Help

Try one of these:

1. switch to a more concrete type such as `pdf`, `png`, or `json`
2. add a scope like `in:downloads` or `in:library`
3. add a time hint like `today` or `recent`
4. reduce the search text to the strongest keyword

Examples:

- from `snowboard` to `snowboard img`
- from `config` to `config json in:library`
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

Scope:

- `in:downloads`
- `in:documents`
- `in:desktop`
- `in:library`
- `in:home`

Time:

- `today`
- `yesterday`
- `recent`
