#!/usr/bin/env node
/**
 * Patch WhatWeWatching Worker to add a DO warmup endpoint:
 *   GET /warm?room=<id>  -> pings the Room DO via /ping
 *
 * It tries a few common patterns to inject code into src/worker/worker.js,
 * and to add a /ping handler into src/worker/room.js (or Room class file).
 *
 * Safe: adds markers so it won't double-apply.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKER = path.join(ROOT, "src", "worker", "worker.js");
const ROOM = path.join(ROOT, "src", "worker", "room.js");

const MARK = "/* WARMUP_PATCH_v1 */";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(WORKER)) die(`Could not find ${WORKER}`);

let w = fs.readFileSync(WORKER, "utf8");
if (!w.includes(MARK)) {
  // Try to find a place inside fetch(request, env, ctx) where url is computed
  // We'll inject right after: const url = new URL(request.url);
  const inject = `\n  ${MARK}\n  // Durable Object warmup: GET /warm?room=...\n  if (url.pathname === "/warm") {\n    const roomId = url.searchParams.get("room");\n    if (!roomId) return new Response("missing room", { status: 400 });\n    const id = env.ROOMS.idFromName(roomId);\n    const stub = env.ROOMS.get(id);\n    // Ping the DO to ensure it is initialized.\n    await stub.fetch("https://do.internal/ping");\n    return new Response("warmed", { status: 200 });\n  }\n`;

  if (w.includes("const url = new URL(request.url)")) {
    w = w.replace("const url = new URL(request.url);", "const url = new URL(request.url);" + inject);
  } else if (w.includes("new URL(request.url)")) {
    // fallback: insert after first occurrence
    w = w.replace("new URL(request.url)", "new URL(request.url)" + `;\n  ${MARK}\n  // NOTE: warmup patch inserted; ensure 'url' variable exists.\n`);
    console.warn("Patched worker.js with fallback insertion. Please ensure you have `const url = new URL(request.url);` before warmup block.");
  } else {
    die("Could not find URL parsing in worker.js. Open src/worker/worker.js and add the warmup block manually (see README).");
  }

  fs.writeFileSync(WORKER, w, "utf8");
  console.log("✅ Patched src/worker/worker.js with /warm endpoint.");
} else {
  console.log("ℹ️ worker.js already patched.");
}

// Patch Room DO ping handler (best-effort)
if (fs.existsSync(ROOM)) {
  let r = fs.readFileSync(ROOM, "utf8");
  const RM = "/* DO_PING_PATCH_v1 */";
  if (!r.includes(RM)) {
    // Insert early in fetch(request) inside Room class
    const pingBlock = `\n    ${RM}\n    const url = new URL(request.url);\n    if (url.pathname === "/ping") return new Response("ok");\n`;

    // Pattern 1: async fetch(request) {
    const p1 = /async\s+fetch\s*\(\s*request\s*\)\s*\{\s*/m;
    if (p1.test(r)) {
      r = r.replace(p1, (m) => m + pingBlock);
      fs.writeFileSync(ROOM, r, "utf8");
      console.log("✅ Patched src/worker/room.js with /ping handler.");
    } else {
      console.warn("⚠️ Could not auto-insert /ping handler in room.js (no 'async fetch(request)' found). You can add it manually.");
    }
  } else {
    console.log("ℹ️ room.js already has ping patch.");
  }
} else {
  console.warn("⚠️ Could not find src/worker/room.js to add /ping handler automatically. If your Room class is in a different file, add the /ping handler manually (see README).");
}
