
import { Room } from "./room.js";
import { sanitizeRoomId } from "./util.js";

export { Room };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* WARMUP_FIX_v2 */
    // Durable Object warmup: GET /warm?room=...
    if (url.pathname === "/warm") {
      try {
        let roomId = sanitizeRoomId(url.searchParams.get("room"));
        if (!roomId) {
          return new Response("invalid room", { status: 400 });
        }

        const id = env.ROOMS.idFromName(roomId);
        const stub = env.ROOMS.get(id);

        await stub.fetch("https://do.internal/ping", { method: "GET" });

        return new Response("warmed", {
          status: 200,
          headers: { "content-type": "text/plain" }
        });
      } catch (e) {
        return new Response("ok", {
          status: 200,
          headers: { "content-type": "text/plain" }
        });
      }
    }

    // ---- CORS helpers
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = new Set([
      "https://whatwewatching.pages.dev",
      "http://localhost:8788",
      "http://127.0.0.1:8788"
    ]);

    if (env && env.ALLOWED_ORIGIN) {
      allowedOrigins.add(String(env.ALLOWED_ORIGIN));
    }

    const isPagesSubdomain =
      origin === "https://whatwewatching.pages.dev" ||
      origin.endsWith(".whatwewatching.pages.dev");

    const reqHeaders = request.headers.get("Access-Control-Request-Headers");
    const allowHeaders = reqHeaders ? reqHeaders : "Content-Type";

    const originAllowed = isPagesSubdomain || allowedOrigins.has(origin);

    const cors = {
      ...(originAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin, Access-Control-Request-Headers"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // ---- WebSocket signaling (Durable Object Room)
    const upgrade = request.headers.get("Upgrade");
    if (upgrade && upgrade.toLowerCase() === "websocket") {
      let roomId = url.searchParams.get("room");

      if (!roomId) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 2 && parts[0] === "ws") {
          roomId = parts[1];
        }
      }

      roomId = sanitizeRoomId(roomId);

      // Reject invalid rooms instead of collapsing into "default"
      if (!roomId) {
        return new Response("invalid room", { status: 400 });
      }

      const id = env.ROOMS.idFromName(roomId);
      const obj = env.ROOMS.get(id);
      return obj.fetch(request);
    }

    // Health / default response
    return new Response("OK", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...cors
      }
    });
  },
};
