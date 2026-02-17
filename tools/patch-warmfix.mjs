#!/usr/bin/env node
/**
 * Warmfix patch for WhatWeWatching
 * - Makes /warm endpoint always return 200 and never throw (prevents 530s)
 * - Uses DO ping with stable URL and wraps in try/catch
 *
 * Usage:
 *   node .\tools\patch-warmfix.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKER = path.join(ROOT, "src", "worker", "worker.js");

const BEGIN = "/* WARMUP_PATCH_v1 */";
const FIX = "/* WARMUP_FIX_v1 */";

function die(msg) { console.error(msg); process.exit(1); }
if (!fs.existsSync(WORKER)) die(`Could not find ${WORKER}`);

let w = fs.readFileSync(WORKER, "utf8");
if (w.includes(FIX)) {
  console.log("ℹ️ warmfix already applied.");
  process.exit(0);
}

// If the previous warm patch marker exists, replace that whole warm block with the fixed one.
const warmFixedBlock = `  ${FIX}\n  // Durable Object warmup: GET /warm?room=...\n  // This endpoint MUST NEVER error (prevents intermittent 530s on page load).\n  if (url.pathname === \"/warm\") {\n    try {\n      const roomId = url.searchParams.get(\"room\");\n      if (!roomId) return new Response(\"missing room\", { status: 400 });\n\n      const id = env.ROOMS.idFromName(roomId);\n      const stub = env.ROOMS.get(id);\n\n      // Ping the DO to ensure it is initialized.\n      // Use a stable internal URL; only the path matters in DO fetch().\n      await stub.fetch(\"https://do.internal/ping\", { method: \"GET\" });\n\n      return new Response(\"warmed\", { status: 200, headers: { \"content-type\": \"text/plain\" } });\n    } catch (e) {\n      // Never fail page load; warmup is best-effort.\n      return new Response(\"ok\", { status: 200, headers: { \"content-type\": \"text/plain\" } });\n    }\n  }\n`;

// Replace old block if present
if (w.includes(BEGIN)) {
  // Replace from the old marker up to the end of the warm handler.
  // We look for: marker ... if (url.pathname === "/warm") { ... }\n  // and replace that entire region.
  const re = new RegExp(
    String.raw`[ \t]*\/\*\s*WARMUP_PATCH_v1\s*\*\/[\s\S]*?if\s*\(\s*url\.pathname\s*===\s*["']\/warm["']\s*\)\s*\{[\s\S]*?\n[ \t]*\}\n`,
    "m"
  );
  if (re.test(w)) {
    w = w.replace(re, warmFixedBlock + "\n");
    fs.writeFileSync(WORKER, w, "utf8");
    console.log("✅ Replaced existing /warm block with warmfix.");
    process.exit(0);
  }
  // If marker exists but regex didn't match, fall through to insertion.
}

// Otherwise insert right after `const url = new URL(request.url);`
if (w.includes("const url = new URL(request.url);")) {
  w = w.replace(
    "const url = new URL(request.url);",
    "const url = new URL(request.url);\n\n" + warmFixedBlock
  );
  fs.writeFileSync(WORKER, w, "utf8");
  console.log("✅ Inserted warmfix after URL parsing.");
  process.exit(0);
}

die("Could not find `const url = new URL(request.url);` in worker.js. Please paste your src/worker/worker.js and I'll generate an exact patch.");
