# Test Plan: Immediate Icons and Dev Autorestart

## Status

- Approved

## Linked Spec

- `specs/approved/immediate-icons-and-dev-autorestart.spec.md`

## Coverage Strategy

- Unit: launcher icon hydration scheduling and retry behavior.
- Integration: main-process icon IPC should not permanently cache failed icon results as `null`.
- Manual/dev: run `npm run dev`, edit watched files, and confirm the child restarts.

## Test Cases

- [ ] Visible app results call `launcher:get-path-icons` before deep search settles and without pointer movement.
- [ ] A first failed icon batch can retry and render image-backed icons on a later attempt.
- [ ] Main-process icon errors leave the icon retryable rather than returning a permanent cache hit.
- [ ] `npm run dev` starts `electron-vite dev --watch`.
- [ ] Editing `electron/main.ts` schedules one restart after the debounce.
- [ ] If the child exits unexpectedly, the supervisor starts it again after a backoff.

## Fixtures or Mocks

- Mock launcher bridge callbacks for icon IPC.
- Mock native icon dependencies where possible; real Finder icon artwork is not required for unit tests.

## Pass Criteria

- `npm run typecheck`
- `npm run test:unit -- LauncherBar`
- `npm run test:unit -- appIcon finderIcon`

## Risks

- macOS icon services can be slow or inconsistent; tests should assert scheduling and retryability rather than exact artwork.
- The dev supervisor must not use destructive cleanup commands.
