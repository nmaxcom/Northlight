# Skill: Release Checklist

Use this workflow before shipping a macOS build.

1. Run `npm run verify`.
2. Run `npm run test:e2e`.
3. Verify keyboard navigation and focus behavior manually.
4. Confirm preload APIs are minimal and typed.
5. Review the diff for accidental broad styling or action regressions.
