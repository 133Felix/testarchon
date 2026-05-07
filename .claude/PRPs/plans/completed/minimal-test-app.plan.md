# Feature: Minimal Test App for Archon Workflow Validation

## Summary

Tiny click-counter web app. Bun + Hono server, single HTML page, in-memory counter, one POST endpoint. Built as concrete target for `archon-create-issue` and similar workflows — gives reproducer something real to load, click, and inspect. Intentionally smaller than the funny-chat PRD: no LLM, no React, no build step.

## User Story

As Felix (testing Archon workflows)
I want a minimal runnable web app with a visible UI surface
So that workflow nodes (start-server, agent-browser reproducer, investigator grep) have a real target instead of empty repo.

## Problem Statement

Repo currently greenfield. Workflows like `archon-create-issue` fail at investigator/reproducer stage because there is no `packages/`, no source, no UI to load. Cannot evaluate workflow quality without a real build target. Funny-chat PRD exists but is heavier than needed for fast workflow iteration (LLM dependency, React + Vite, dev concurrency).

## Solution Statement

Smallest viable web app: one Bun + Hono server file, one static HTML page, in-memory counter. Server writes `.server-port` (Archon convention) on boot. UI: button + count display. One endpoint `POST /api/click`. Total: 3 files, no build step, `bun run dev` starts it.

## Metadata

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| Type             | NEW_CAPABILITY                                 |
| Complexity       | LOW                                            |
| Systems Affected | repo root (new files only)                     |
| Dependencies     | `hono@^4`, `@types/bun` (devDep)               |
| Estimated Tasks  | 6                                              |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════╗
║                       BEFORE STATE                             ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║   ┌──────────────┐         ┌──────────────────────┐           ║
║   │  Workflow    │ ──────► │  start-server fails  │           ║
║   │  triggered   │         │  (no script)         │           ║
║   └──────────────┘         └──────────────────────┘           ║
║                                     │                         ║
║                                     ▼                         ║
║                            ┌──────────────────────┐           ║
║                            │  reproducer blocked  │           ║
║                            │  (nothing to load)   │           ║
║                            └──────────────────────┘           ║
║                                                                ║
║   USER_FLOW: trigger → start-server → fail → NOT_REPRODUCED   ║
║   PAIN_POINT: no app to test workflows against                ║
║   DATA_FLOW: no data, repo only has PRD                       ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════╗
║                       AFTER STATE                              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║   ┌──────────────┐         ┌──────────────────────┐           ║
║   │  Workflow    │ ──────► │  bun run dev         │           ║
║   │  triggered   │         │  port → .server-port │           ║
║   └──────────────┘         └──────────────────────┘           ║
║                                     │                         ║
║                                     ▼                         ║
║                            ┌──────────────────────┐           ║
║                            │  agent-browser opens │           ║
║                            │  localhost:PORT/     │           ║
║                            └──────────────────────┘           ║
║                                     │                         ║
║                                     ▼                         ║
║                            ┌──────────────────────┐           ║
║                            │  click button        │           ║
║                            │  POST /api/click     │           ║
║                            │  count++ visible     │           ║
║                            └──────────────────────┘           ║
║                                                                ║
║   USER_FLOW: trigger → server up → browser → click → repro    ║
║   VALUE_ADD: workflows have real UI + endpoint to exercise    ║
║   DATA_FLOW: button click → POST → in-memory inc → JSON → DOM ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location          | Before        | After                  | User Impact                           |
| ----------------- | ------------- | ---------------------- | ------------------------------------- |
| `localhost:PORT/` | 404           | HTML page with counter | Workflows can load real DOM           |
| `POST /api/click` | n/a           | `{count: N+1}`         | State change observable for tests     |
| `.server-port`    | absent        | port number written    | Archon `start-server` node finds port |
| `bun run dev`     | npm not init  | starts server          | One command = running app             |

---

## Mandatory Reading

Greenfield repo. No internal files to mirror. PRD provides scope context.

| Priority | File                                          | Lines | Why Read This                                      |
| -------- | --------------------------------------------- | ----- | -------------------------------------------------- |
| P0       | `.claude/PRPs/prds/funny-chat-app.prd.md`     | all   | Sister-PRD context — same goal, larger scope. Confirm what to NOT build (no LLM, no React) |
| P0       | `.archon/` (workflow configs if present)      | scan  | Identify Archon conventions (`.server-port` filename, port range, dev script name) |

**External Documentation:**

| Source                                                           | Section              | Why Needed                       |
| ---------------------------------------------------------------- | -------------------- | -------------------------------- |
| [Hono Quick Start](https://hono.dev/docs/getting-started/basic)  | Bun adapter          | Server bootstrap pattern         |
| [Bun Server](https://bun.sh/docs/api/http)                       | `Bun.serve`          | Native server (alternative path) |

**Decision**: Use Hono on Bun (`hono@^4` + `@hono/node-server` not needed — Hono ships Bun adapter). Three reasons: (1) Hono mirrors what Archon stack uses internally, (2) routing primitives if app grows, (3) same dev ergonomics as future workflow targets.

---

## Patterns to Mirror

Repo greenfield. No existing patterns. Plan establishes patterns for future work.

**Conventions adopted (new, not mirrored):**

- File naming: kebab-case (`server.ts`, not `Server.ts`)
- Module style: ESM (`import`, top-level await OK with Bun)
- TS: strict mode, no implicit any
- Error handling: throw `Error` with descriptive message, let server catch
- Logging: `console.log(JSON.stringify({level, msg, ...}))` — newline-delimited JSON, parseable by Archon log scrapers

---

## Files to Change

| File                | Action | Justification                              |
| ------------------- | ------ | ------------------------------------------ |
| `package.json`      | CREATE | Project manifest, scripts, deps            |
| `tsconfig.json`     | CREATE | TS strict config for Bun                   |
| `server.ts`         | CREATE | Hono server, counter state, port write     |
| `public/index.html` | CREATE | Single-page UI: button + count display     |
| `.gitignore`        | CREATE | Exclude `node_modules/`, `.server-port`    |
| `README.md`         | CREATE | One-liner: `bun install && bun run dev`    |

---

## NOT Building (Scope Limits)

- **No persistence** — counter resets on server restart. Out of scope; in-memory enough for workflow testing.
- **No React/Vite** — single static HTML + inline JS. Build step would slow workflow iterations.
- **No LLM** — funny-chat PRD covers that. Click counter has zero external deps.
- **No tests** — this app *is* the test target. Adding tests doubles surface for no benefit here.
- **No auth, no users, no sessions** — single-user local only.
- **No production config, no Docker, no CI** — dev-only, localhost.
- **No streaming, no websockets** — POST/JSON sufficient.
- **No CSS framework** — inline styles. Visual polish irrelevant to workflows.

---

## Step-by-Step Tasks

### Task 1: CREATE `package.json`

- **ACTION**: Write manifest with scripts + deps
- **IMPLEMENT**:
  ```json
  {
    "name": "minimal-test-app",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "bun run --watch server.ts",
      "start": "bun run server.ts"
    },
    "dependencies": {
      "hono": "^4.6.0"
    },
    "devDependencies": {
      "@types/bun": "latest",
      "typescript": "^5.5.0"
    }
  }
  ```
- **GOTCHA**: `"type": "module"` required for ESM. `--watch` is Bun's built-in, no nodemon needed.
- **VALIDATE**: `bun install` exit 0, `node_modules/` populated.

### Task 2: CREATE `tsconfig.json`

- **ACTION**: TS config for Bun runtime
- **IMPLEMENT**:
  ```json
  {
    "compilerOptions": {
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "skipLibCheck": true,
      "types": ["bun-types"]
    },
    "include": ["server.ts"]
  }
  ```
- **GOTCHA**: `"types": ["bun-types"]` makes `Bun` global available without import.
- **VALIDATE**: `bunx tsc --noEmit` exit 0.

### Task 3: CREATE `server.ts`

- **ACTION**: Hono server, counter state, port write
- **IMPLEMENT**:
  ```typescript
  import { Hono } from "hono";
  import { writeFileSync, readFileSync } from "node:fs";

  let count = 0;
  const app = new Hono();

  app.get("/", (c) => {
    const html = readFileSync("public/index.html", "utf8");
    return c.html(html);
  });

  app.get("/api/count", (c) => c.json({ count }));

  app.post("/api/click", (c) => {
    count += 1;
    log("info", "click", { count });
    return c.json({ count });
  });

  const port = Number(process.env.PORT ?? 0);
  const server = Bun.serve({ port, fetch: app.fetch });
  writeFileSync(".server-port", String(server.port));
  log("info", "listening", { port: server.port });

  function log(level: string, msg: string, extra: Record<string, unknown> = {}) {
    console.log(JSON.stringify({ level, msg, time: Date.now(), ...extra }));
  }
  ```
- **GOTCHA**: `port: 0` lets OS pick free port — safer for parallel workflow runs than hardcoding 3000. `.server-port` is Archon convention; without it `start-server` node cannot find the URL.
- **GOTCHA**: `noUncheckedIndexedAccess` enabled in tsconfig — no array indexing here so no impact, but follow rule in future expansions.
- **VALIDATE**: `bunx tsc --noEmit` exit 0. Then `bun run dev` — should print `listening` JSON line and write `.server-port`.

### Task 4: CREATE `public/index.html`

- **ACTION**: Single static page, inline JS, no build
- **IMPLEMENT**:
  ```html
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Minimal Test App</title>
    <style>
      body { font-family: system-ui; padding: 2rem; max-width: 32rem; margin: 0 auto; }
      button { font-size: 1.5rem; padding: 0.75rem 1.5rem; cursor: pointer; }
      #count { font-size: 3rem; font-weight: bold; margin: 1rem 0; }
    </style>
  </head>
  <body>
    <h1>Click Counter</h1>
    <p>Minimal workflow target. Click button, count increments.</p>
    <div id="count">0</div>
    <button id="btn" type="button">Click me</button>
    <script>
      const btn = document.getElementById("btn");
      const display = document.getElementById("count");
      async function load() {
        const r = await fetch("/api/count");
        const { count } = await r.json();
        display.textContent = String(count);
      }
      btn.addEventListener("click", async () => {
        const r = await fetch("/api/click", { method: "POST" });
        const { count } = await r.json();
        display.textContent = String(count);
      });
      load();
    </script>
  </body>
  </html>
  ```
- **GOTCHA**: `id="btn"` and `id="count"` must match selectors used in any agent-browser test playbook. Stable IDs > class names for reproducer scripts.
- **VALIDATE**: Open `http://localhost:<port>/` — page renders, count shows 0, click increments.

### Task 5: CREATE `.gitignore`

- **ACTION**: Exclude runtime + deps
- **IMPLEMENT**:
  ```
  node_modules/
  .server-port
  bun.lockb
  *.log
  ```
- **VALIDATE**: `git status` — `node_modules/` not listed.

### Task 6: CREATE `README.md`

- **ACTION**: Minimal usage doc
- **IMPLEMENT**:
  ```markdown
  # Minimal Test App

  Workflow validation target. Click counter, no LLM, no build.

  ## Run

      bun install
      bun run dev

  Server picks free port, writes it to `.server-port`. Open `http://localhost:<port>/`.

  ## Endpoints

  - `GET /` — HTML page
  - `GET /api/count` — `{ count: number }`
  - `POST /api/click` — increments, returns `{ count: number }`
  ```
- **VALIDATE**: Render check (any markdown viewer).

---

## Testing Strategy

No automated tests. App *is* the test target. Manual checks per task.

### Manual Verification Checklist

- [ ] `bun install` exits 0
- [ ] `bun run dev` prints `listening` JSON line within 2s
- [ ] `.server-port` file written, contains numeric port
- [ ] `curl http://localhost:$(cat .server-port)/api/count` returns `{"count":0}`
- [ ] `curl -X POST http://localhost:$(cat .server-port)/api/click` returns `{"count":1}`
- [ ] Browser at `http://localhost:<port>/` shows count, button increments display
- [ ] Workflow `archon-create-issue` `start-server` node finds `.server-port`
- [ ] Workflow `agent-browser` skill can interact with `#btn` and read `#count`

### Edge Cases (out of scope but noted)

- Counter overflow at `Number.MAX_SAFE_INTEGER` — not realistic for workflow tests
- Concurrent clicks — JS single-threaded, no race in Bun
- Restart resets count — intentional, documented

---

## Validation Commands

### Level 1: TYPE_CHECK

```bash
bunx tsc --noEmit
```

EXPECT: Exit 0.

### Level 2: BOOT

```bash
bun run dev &
sleep 2
test -f .server-port && echo "port: $(cat .server-port)"
```

EXPECT: `.server-port` exists, contains digits.

### Level 3: SMOKE

```bash
PORT=$(cat .server-port)
curl -s "http://localhost:$PORT/api/count"
curl -s -X POST "http://localhost:$PORT/api/click"
curl -s "http://localhost:$PORT/api/count"
```

EXPECT: `{"count":0}`, `{"count":1}`, `{"count":1}`.

### Level 4: WORKFLOW_INTEGRATION

```bash
archon workflow run archon-create-issue --no-worktree \
  "Click button does not increment count on first click" 2>&1 | tee /tmp/workflow-test.log
```

EXPECT: Workflow runs `start-server` successfully, `agent-browser` reproducer launches, reproducer either confirms (real bug) or refutes (NOT_REPRODUCED with evidence).

---

## Acceptance Criteria

- [ ] All 6 files created per specs above
- [ ] `bun install && bun run dev` runs cleanly on a fresh clone
- [ ] `.server-port` written, contains free port number
- [ ] HTML page renders, button increments visible counter
- [ ] `archon-create-issue` workflow no longer fails with "no source" verdict — reaches reproducer node with usable target

---

## Risks and Mitigations

| Risk                                         | Likelihood | Impact | Mitigation                                                                          |
| -------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------- |
| Port conflict if Archon hardcodes range      | LOW        | LOW    | Use `port: 0` (OS-assigned), write actual port to `.server-port`                    |
| Bun not installed on machine                 | LOW        | MED    | Document `curl -fsSL https://bun.sh/install \| bash` in README                      |
| `.server-port` filename mismatch w/ Archon   | MED        | HIGH   | P0 mandatory reading: confirm convention by scanning `.archon/` configs first       |
| HTML inline JS flagged by future linter      | LOW        | LOW    | Document as intentional; no lint configured for this app                            |
| Workflow expects build artifact path         | LOW        | MED    | No build step; if workflow demands `dist/`, add stub task to copy `public/` → `dist/` |

---

## Notes

**Why not the funny-chat PRD?** That PRD is the *full* test target — React + Vite + Express + Anthropic SDK = 9 files + dev concurrency. Heavier feedback loop. This minimal app is the *first* target — boots in 2s, no external API key, no model rate limits. Use this for fast workflow iteration, escalate to funny-chat once workflows pass against this.

**Convention question to verify on first run**: Does `archon-create-issue`'s `start-server` node read `.server-port` or some other filename? If different, Task 3 needs the actual filename. Mandatory reading P0 (`.archon/` scan) addresses this before implementation.

**Future expansion paths** (not in this plan):
- Add `/api/reset` endpoint → seed for workflows testing destructive ops
- Add intentional bug behind feature flag → workflow real-reproduce target
- Swap in-memory counter for SQLite → tests DB-aware workflow nodes

---

## Confidence

**8/10** for one-pass implementation success.

Reasons for high score:
- Greenfield repo, no integration risk
- 3 actual code files, all small
- Stack (Bun + Hono) well-documented, stable
- No external API, no auth, no DB

Two-point deduction:
- `.server-port` filename convention unverified (P0 mandatory reading covers this but is a real lookup, not a known)
- Hono on Bun has minor version drift; `hono@^4.6.0` pinned in plan but Bun's adapter docs occasionally lag
