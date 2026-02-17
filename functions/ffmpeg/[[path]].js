export async function onRequest({ request, params, env }) {
  const rel = Array.isArray(params.path)
    ? params.path.join("/")
    : String(params.path || "");

  if (!env.ASSETS) {
    return new Response("Missing R2 binding", { status: 500 });
  }

  const allowed = new Set([
    "ffmpeg.min.js",
    "814.ffmpeg.js",
    "ffmpeg-core.js",
    "ffmpeg-core.wasm",
    "ffmpeg-core.worker.js",
  ]);

  if (!allowed.has(rel)) {
    return new Response("Not Found", { status: 404 });
  }

  const key = `ffmpeg/${rel}`;

  // SIMPLE GET — no metadata copy
  const obj = await env.ASSETS.get(key);

  if (!obj) {
    return new Response(`Missing object: ${key}`, { status: 404 });
  }

  const headers = new Headers();

  // Correct MIME types
  if (rel.endsWith(".js"))
    headers.set("Content-Type", "application/javascript; charset=utf-8");

  if (rel.endsWith(".wasm"))
    headers.set("Content-Type", "application/wasm");

  // Required for ffmpeg multithreading
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Cache forever (files are versioned by upload)
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  // Debug header
  headers.set("X-FFMPEG-SOURCE", "r2");

  return new Response(obj.body, {
    status: 200,
    headers,
  });
}
