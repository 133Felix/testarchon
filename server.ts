import { Hono } from "hono";
import { readFileSync } from "node:fs";

let count = 0;
const app = new Hono();

app.get("/", (c) => {
  const html = readFileSync("public/index.html", "utf8");
  return c.html(html);
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/count", (c) => c.json({ count }));

app.post("/api/click", (c) => {
  count += 1;
  log("info", "click", { count });
  return c.json({ count });
});

app.post("/api/reset", (c) => {
  count = 0;
  log("info", "reset", { count });
  return c.json({ count });
});

const port = Number(process.env.PORT ?? 0);
const server = Bun.serve({ port, fetch: app.fetch });
log("info", "listening", { port: server.port });

function log(level: string, msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level, msg, time: Date.now(), ...extra }));
}
