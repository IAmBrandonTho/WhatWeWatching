
import { handleStream } from "./stream.js";
import { Room } from "./room.js";

export { Room };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }


    // ---- Proxy FFmpeg assets from R2 to same-origin (avoids CORS/worker importScripts issues)
    if (url.pathname.startsWith("/ffmpeg/")) {
      const file = url.pathname.replace(/^\/ffmpeg\//, "");
      const allowed = new Set(["814.ffmpeg.js","ffmpeg-core.js","ffmpeg-core.wasm"]);
      if (!allowed.has(file)) return new Response("Not found", { status: 404, headers: { ...cors } });

      const upstream = `https://pub-4166aa96d4fa43369eae21feb27f9263.r2.dev/ffmpeg/${file}`;
      // Forward Range requests (wasm sometimes uses them)
      const reqHeaders = new Headers();
      const range = request.headers.get("range");
      if (range) reqHeaders.set("range", range);

      const up = await fetch(upstream, { headers: reqHeaders });
      if (!up.ok) return new Response(`Upstream error ${up.status}`, { status: 502, headers: { ...cors } });

      const h = new Headers(up.headers);
      // Force correct content-type (Cloudflare sometimes serves wasm as octet-stream)
      if (file.endsWith(".js")) h.set("Content-Type", "application/javascript; charset=utf-8");
      if (file.endsWith(".wasm")) h.set("Content-Type", "application/wasm");

      // Make sure our CORS headers are present (harmless even same-origin)
      for (const [k,v] of Object.entries(cors)) h.set(k, v);

      // Allow caching at edge
      h.set("Cache-Control", "public, max-age=86400");

      return new Response(up.body, { status: up.status, headers: h });
    }

    // ---- New: chunked upload + stitched streaming (/upload/init, /upload/part, /v/:id)
    const streamResponse = await handleStream(request, env, cors);
    if (streamResponse) return streamResponse;

    // ---- Legacy compatibility: single-shot upload used by the existing UI (/upload)
    if (url.pathname === "/upload" && request.method === "POST") {
      const file = await request.arrayBuffer();
      const id = crypto.randomUUID();
      const key = `videos/${id}.mp4`;

      const ct = request.headers.get("content-type") || "video/mp4";
      await env.VIDEOS.put(key, file, { httpMetadata: { contentType: ct } });

      const publicUrl = `${env.PUBLIC_VIDEO_BASE}/${key}`;
      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { "Content-Type": "application/json", ...cors }
      });
    }

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

  
  // Auto cleanup cron (deletes expired videos)
  async scheduled(event, env) {
    const now = Date.now();

    // R2 list() is paginated; walk all meta.json objects under videos/
    let cursor = undefined;
    for (;;) {
      const page = await env.VIDEOS.list({ prefix: "videos/", cursor });
      cursor = page.cursor;

      for (const obj of page.objects) {
        if (!obj.key.endsWith("meta.json")) continue;

        const metaObj = await env.VIDEOS.get(obj.key);
        if (!metaObj) continue;

        let meta = null;
        try { meta = await metaObj.json(); } catch { continue; }

        if (meta?.expiresAt && meta.expiresAt < now) {
          const prefix = obj.key.replace("/meta.json", "");

          // Delete everything under the video's prefix (paginated)
          let delCursor = undefined;
          for (;;) {
            const parts = await env.VIDEOS.list({ prefix, cursor: delCursor });
            delCursor = parts.cursor;

            // Parallelize a bit, but keep it bounded
            await Promise.all(parts.objects.map(p => env.VIDEOS.delete(p.key)));

            if (!delCursor) break;
          }
        }
      }

      if (!cursor) break;
    }
  }
};


function sanitizeRoomId(roomId) {
  if (!roomId) return "";
  const v = String(roomId).trim();
  return v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}
