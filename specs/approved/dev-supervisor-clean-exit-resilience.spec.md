# Dev Supervisor Clean Exit Resilience

## User-visible behavior

- `npm run dev` keeps watching source files after the Electron child exits cleanly.
- A duplicate-instance child exit no longer shuts down the dev supervisor.
- The next watched source change can start Electron again without manually rerunning `npm run dev`.
- Startup logs show the exact Electron dev command, concise build milestones, and any existing Northlight Dev process PID.
- Vite renderer URLs and repetitive build progress lines are filtered from normal supervisor output.

## Non-goals

- This does not force-close already running Northlight or Northlight Dev instances.
- This does not make `http://localhost:5173/` a substitute for the Electron app.

## Failure cases

- If the main Electron entry has not been built, the supervisor waits for a source change instead of retrying a missing file loop.
- If the user stops the supervisor with `Ctrl+C`, it still shuts down.

## Acceptance criteria

- A clean Electron child exit logs that the supervisor remains alive.
- If Northlight Dev is already running, the supervisor reports the existing PID and does not launch a duplicate child just to fail the single-instance lock.
- Non-zero Electron exits continue to restart with backoff when the main entry exists.
- Manual `SIGINT`/`SIGTERM` still closes watchers and child processes.
