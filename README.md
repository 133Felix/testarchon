# Minimal Test App

Workflow validation target. Click counter, no LLM, no build.

## Run

    bun install
    bun run dev

Pass `PORT=` to bind specific port (Archon `start-server` does this automatically). Default: random free port.

## Endpoints

- `GET /` — HTML page
- `GET /api/health` — `{ ok: true }` (health check used by Archon `start-server`)
- `GET /api/count` — `{ count: number }`
- `POST /api/click` — increments, returns `{ count: number }`

## Archon integration

Archon's `start-server` node:

1. Picks a free port via `Bun.serve({port:0})`
2. Runs `PORT=$PORT bun run dev:server`
3. Polls `GET /api/health` until 200 (up to 30s)

The `dev:server` script is the Archon entry point. `dev` is the watch-mode variant for human use.
