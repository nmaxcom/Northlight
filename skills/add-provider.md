# Skill: Add Provider

Use this workflow when adding a new launcher provider.

1. Define the input contract in `src/lib/search/types.ts`.
2. Keep parsing deterministic where possible.
3. Return a small ranked set of results with one primary action and optional secondary actions.
4. Add unit tests for provider behavior and edge cases.
5. Only add IPC if the provider needs native capabilities.
