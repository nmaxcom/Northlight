# Dev Supervisor Clean Exit Resilience

## User-visible behavior

- `npm run dev` keeps watching source files after the Electron child exits cleanly.
- A duplicate-instance child exit no longer shuts down the dev supervisor.
- The next watched source change can start Electron again without manually rerunning `npm run dev`.

## Non-goals

- This does not force-close already running Northlight or Northlight Dev instances.
- This does not make `http://localhost:5173/` a substitute for the Electron app.

## Failure cases

- If the main Electron entry has not been built, the supervisor waits for a source change instead of retrying a missing file loop.
- If the user stops the supervisor with `Ctrl+C`, it still shuts down.

## Acceptance criteria

- A clean Electron child exit logs that the supervisor remains alive.
- Non-zero Electron exits continue to restart with backoff when the main entry exists.
- Manual `SIGINT`/`SIGTERM` still closes watchers and child processes.
