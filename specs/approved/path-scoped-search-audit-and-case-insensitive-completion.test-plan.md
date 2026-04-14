# Test Plan: Path-Scoped Search Audit And Case-Insensitive Completion

## Unit

- [ ] path completion tests showing lowercase typed input still produces uppercase filesystem suggestions
- [ ] parser and scoped query tests for `in:` at the beginning and end of the query

## Integration

- [ ] query tests for scoped app, image, dotfile, and hidden-file recall
- [ ] tests covering a fast-path scope, an indexed-only scope, and an out-of-scope path expectation

## E2E

- [ ] type `/app`, verify `/Applications/` is suggested, accept with `Tab`
- [ ] verify `in:` first and `in:` trailing forms return the same scoped result
- [ ] verify scoped image search with and without `img`
- [ ] verify dotfile and hidden-file recall in an explicit path scope
- [ ] verify scoped app recall inside a path alias or explicit folder scope

## Manual Verification

- [ ] try lowercase path typing against uppercase macOS folders
- [ ] compare scoped and unscoped results for the same query
- [ ] confirm hidden-file and dotfile behavior matches the scope that is actually configured
