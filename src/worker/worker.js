
import { handleStream } from "./stream.js";
import { Room } from "./room.js";
import { sanitizeRoomId } from "./util.js";

export { Room };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
  /* WARMUP_FIX_v1 */
  // Durable Object warmup: GET /warm?room=...
  // This endpoint MUST NEVER error (prevents intermittent 530s on page load).
  if (url.pathname === "/warm") {
    try {
      const roomId = url.searchParams.get("room");
      if (!roomId) return new Response("missing room", { status: 400 });

      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // Ping the DO to ensure it is initialized.
      // Use a stable internal URL; only the path matters in DO fetch().
      await stub.fetch("https://do.internal/ping", { method: "GET" });

      return new Response("warmed", { status: 200, headers: { "content-type": "text/plain" } });
    } catch (e) {
      // Never fail page load; warmup is best-effort.
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
    }
  }



    // CORS / CORP helpers
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = new Set([
      "https://whatwewatching.pages.dev",
      "http://localhost:8788",
      "http://127.0.0.1:8788"
    ]);
    // Optional: allow override via env.ALLOWED_ORIGIN (set in Wrangler/CF dashboard)
    if (env && env.ALLOWED_ORIGIN) allowedOrigins.add(String(env.ALLOWED_ORIGIN));

    // Allow ALL Cloudflare Pages deployment subdomains for this project
    // e.g. https://81aba83.whatwewatching.pages.dev
    const isPagesSubdomain =
      origin === "https://whatwewatching.pages.dev" ||
      origin.endsWith(".whatwewatching.pages.dev");

    // Build CORS headers.
    // Avoid wildcard Allow-Headers (can break some clients); echo requested headers when present.
    const reqHeaders = request.headers.get("Access-Control-Request-Headers");
    const allowHeaders = reqHeaders ? reqHeaders : "Content-Type";

    const allowOrigin = (isPagesSubdomain || allowedOrigins.has(origin))
      ? origin
      : "https://whatwewatching.pages.dev";

    const cors = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin, Access-Control-Request-Headers"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // ---- Dream mode segmented upload/playback (/seg/*)
    const streamResponse = await handleStream(request, env, cors);
    if (streamResponse) return streamResponse;

    // ---- WebSocket signaling (Durable Object Room)
    if (request.headers.get("Upgrade") === "websocket") {
      // Allow:
      //  - wss://.../?room=<id>
      //  - wss://.../ws/<id>
      let roomId = url.searchParams.get("room");
      if (!roomId) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 2 && parts[0] === "ws") roomId = parts[1];
      }

      roomId = sanitizeRoomId(roomId) || "default";

      const id = env.ROOMS.idFromName(roomId);
      const obj = env.ROOMS.get(id);
      return obj.fetch(request);
    }

    // Health / default response
    return new Response("OK", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", ...cors }
    });
  },
};
