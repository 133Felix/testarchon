# PRD: Funny Chat App (Archon Workflow Test)

**Status:** Ready for Implementation  
**Author:** Felix Doobe  
**Date:** 2026-04-09  
**Type:** Test / Validation App

---

## 1. Problem Statement

**Who:** A solo developer (Felix) testing the Archon workflow locally.

**What:** There is no concrete small app to build against while validating an Archon end-to-end workflow. Without a real build target, Archon workflow bugs stay invisible.

**Why it can't be solved otherwise:** This is deliberately a test-project need — the app itself is not the goal, validating that Archon can scaffold and build a complete app from scratch is.

**When is it solved:** A simple split-panel React chat frontend runs at `localhost:5173`, accepts a typed message, and returns a funny LLM response — built entirely by Archon from zero.

---

## 2. Evidence

- No existing test app exists in this repo — the working directory is empty (only `.archon/` and `.git`).
- Archon workflow has not been validated end-to-end yet; this app is the first concrete target.
- The developer has an active Anthropic API key and a local Node/npm environment.

---

## 3. Proposed Solution

A minimal React chat app scaffolded from scratch by Archon:

- **Left panel:** Chat history list (previous conversations or sessions, minimal UI)
- **Right panel:** Active chat window — input box, send button, message thread
- **Backend:** Single API route (or direct client-side call) to `claude-haiku-4-5` via Anthropic SDK
- **System prompt:** Instructs the model to give responses that are thematically related to the question but never actually answer it — absurdist, funny, slightly unhinged

The app is intentionally minimal: no auth, no persistence, no streaming, no markdown rendering, no production config. It just needs to work.

---

## 4. Key Hypothesis

> "We believe a minimal 3-file React chat app will prove the Archon workflow runs end-to-end for me, testing locally. We'll know we're right when I can open `localhost:5173`, type a message, and get a funny LLM response — built entirely by Archon."

---

## 5. What We're NOT Building

| Category | Excluded |
|---|---|
| Auth | No login, no sessions, no users |
| Persistence | No database, no localStorage, no history saved |
| Mobile | Desktop browser only |
| Production | No Docker, no CI/CD, no deployment |
| Tests | No unit tests, no e2e tests |
| Polish | No Markdown rendering, no streaming, no animations |
| Multi-user | Single developer, local only |

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| App starts | `npm install && npm run dev` runs without errors |
| UI loads | `localhost:5173` opens in browser with split-panel layout |
| Message sent | Typing a message and clicking send works |
| Funny response | LLM responds with something absurd and non-answer-y |
| Archon built it | Zero manual file creation outside of what Archon produces |

---

## 7. Open Questions

| Question | Answer |
|---|---|
| Who scaffolds the app? | Archon — from scratch, including `package.json`, `vite.config`, everything |
| Streaming needed? | No — simple request/response is fine |
| Which model? | `claude-haiku-4-5-20251001` — cheap and fast |
| Where does the API key live? | `.env` file, server-side preferred (see Technical Approach) |
| Framework? | React + Vite (standard, minimal) |

---

## 8. Users & Context

**Primary User:** Felix Doobe — solo developer, testing locally, using a desktop browser.

**Job to Be Done:**  
*"When I'm testing an Archon workflow, I want to have a concrete small app to build, so I can validate the workflow runs end-to-end."*

**Non-Users:** No team, no external users, no mobile users, no production traffic.

**Usage Context:** Local dev environment, one session at a time, no concurrent users.

---

## 9. Solution Detail

### MoSCoW

| Priority | Feature |
|---|---|
| **Must Have** | React app with left panel (chat history) + right panel (chat window) |
| **Must Have** | Text input + send button in right panel |
| **Must Have** | Message thread display (user messages + LLM responses) |
| **Must Have** | API call to `claude-haiku-4-5` on send |
| **Must Have** | Funny system prompt (absurdist, topic-adjacent but non-answering) |
| **Must Have** | `npm install && npm run dev` just works |
| **Should Have** | Basic CSS split-panel layout (flexbox or grid) |
| **Won't Have** | Streaming, Markdown, auth, persistence, tests, mobile |

### MVP Definition

Archon builds the complete app scaffold from zero — no manual files. The result is a repo where `npm install && npm run dev` launches a working chat UI at `localhost:5173`.

**Minimum file set (Archon produces all of these):**

```
package.json
vite.config.js (or .ts)
index.html
src/main.jsx
src/App.jsx          <- split-panel layout
src/components/ChatHistory.jsx
src/components/ChatWindow.jsx
.env.example         <- documents ANTHROPIC_API_KEY
server.js            <- thin proxy to Anthropic API
```

---

## 10. Technical Approach

> **Note:** This is a greenfield app — no existing codebase to verify. All paths below are the target output of Archon. Nothing exists yet; all items are "to be created."

### Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | React 18 + Vite | Standard, minimal, fast dev server |
| Styling | Plain CSS or inline styles | No polish needed, avoid tooling overhead |
| LLM | `claude-haiku-4-5-20251001` via `@anthropic-ai/sdk` | Cheap, fast, Felix has an API key |
| API integration | Thin Express/Node server (`server.js`) | Avoids exposing API key in browser bundle |
| Build/run | `npm run dev` via Vite + `node server.js` | Dev-only, `localhost:5173` frontend, `localhost:3001` API |

### API Key Handling

**Option A (simpler, acceptable for local-only):** Vite dev server — API key in `.env` as `VITE_ANTHROPIC_API_KEY`, used client-side. Key is in browser bundle — only ok because this never leaves localhost.

**Option B (recommended):** Minimal Express server (`server.js`) proxies to Anthropic. Key in `.env` as `ANTHROPIC_API_KEY`. Frontend calls `localhost:3001/api/chat`. Concurrently runs both via `npm run dev`.

**Decision:** Option B — minor extra complexity, avoids bad habits with API key exposure.

### System Prompt

```
You are a deeply unhelpful but extremely entertaining assistant.
When someone asks you a question, you must:
1. Clearly understand the topic they're asking about
2. Completely fail to answer it
3. Instead, provide an absurd, tangentially related anecdote, conspiracy theory, or philosophical musing
4. Remain cheerful and confident throughout
5. Never acknowledge that you haven't answered the question

Example: If asked "What is 2+2?", respond with something like:
"Ah, mathematics! Did you know that Pythagoras reportedly sacrificed an ox upon discovering his theorem?
The ox, for its part, had no opinion on triangles."
```

### Component Structure

```
App.jsx
├── ChatHistory (left panel, ~250px wide)
│   └── List of chat sessions (static "New Chat" placeholder is fine for MVP)
└── ChatWindow (right panel, flex-grow)
    ├── MessageThread (scrollable, maps over messages array)
    └── InputBar (text input + send button, bottom of panel)
```

### State

- `messages: Array<{role: 'user'|'assistant', content: string}>` — in `ChatWindow` or lifted to `App`
- `isLoading: boolean` — disable input while waiting for response
- No persistence — state resets on page refresh (intentional)

---

## 11. Implementation Phases

### Phase 1: Scaffold (Archon builds this)

| Task | File | Status |
|---|---|---|
| Init project | `package.json`, `vite.config.js`, `index.html` | To do |
| Entry point | `src/main.jsx` | To do |
| Root component + layout | `src/App.jsx` | To do |
| Chat history panel | `src/components/ChatHistory.jsx` | To do |
| Chat window + input | `src/components/ChatWindow.jsx` | To do |
| API proxy server | `server.js` | To do |
| Env example | `.env.example` | To do |

### Phase 2: LLM Integration (Archon builds this)

| Task | Detail | Status |
|---|---|---|
| Install SDK | `@anthropic-ai/sdk` + `express` + `cors` in `package.json` | To do |
| API endpoint | `POST /api/chat` in `server.js`, calls Haiku with system prompt | To do |
| Response display | Append assistant message to thread on response | To do |
| Loading state | Disable input while awaiting response | To do |
| Dev concurrency | `concurrently` or `npm-run-all` to run Vite + server together | To do |

### Parallel Opportunities

- CSS layout and LLM integration have no dependencies on each other — can be built in parallel.
- System prompt can be finalized independently of component scaffold.
- `server.js` and React components are fully independent until wired together at the end.

---

## 12. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React + Vite | Standard, minimal, works out of the box |
| Model | `claude-haiku-4-5-20251001` | Cheap, fast, Felix has API key |
| Streaming | No | Simplicity; non-streaming is sufficient for this test |
| Persistence | None | Out of scope; not needed to validate Archon workflow |
| Auth | None | Local dev only, single user |
| Tests | None | This is a workflow validation app, not a product |
| Who builds it | Archon, from scratch | The whole point is to validate Archon end-to-end |
| API key handling | Server-side proxy (`server.js`) | Avoids key in browser bundle, even locally |
| System prompt style | Topic-adjacent but non-answering, absurdist | Makes responses funny without being random noise |
| Left panel content | Placeholder "New Chat" only | History persistence is out of scope; panel exists for layout validation |

---

## Validation Notes

**Validated:** 2026-04-09

**Codebase state:** Greenfield — working directory contains only `.archon/` (config + logs) and `.git`. No source files, `package.json`, routes, schemas, or components exist.

**Check 1 — File paths (9 target files):** All marked "to be created" in the PRD. None pre-exist. No corrections needed.

**Check 2 — API endpoints:** No `packages/server/src/routes/api.ts` or any server code exists. The proposed `POST /api/chat` in `server.js` is a new creation. No "extend vs create" conflict.

**Check 3 — DB schemas:** No database, no migrations, no schema files. Project is explicitly persistence-free. No corrections needed.

**Check 4 — UI components:** No existing components. `App.jsx`, `ChatHistory.jsx`, `ChatWindow.jsx` are all new. No duplication conflict.

**Check 5 — Function/type names:** No existing functions or types to conflict with. The state shape `{role: 'user'|'assistant', content: string}` aligns with Anthropic SDK's `MessageParam` type — correct.

**Model ID check:** `claude-haiku-4-5-20251001` — verified as the correct full model ID for Haiku 4.5 per SDK documentation (knowledge cutoff Aug 2025).

All technical references are internally consistent. No corrections needed.
