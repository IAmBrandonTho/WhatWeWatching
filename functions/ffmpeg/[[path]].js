// Serve /ffmpeg/* directly from R2 (Pages binding: WWW_ASSETS)
//
// Expected object keys in the bucket:
//   ffmpeg/<filename>
// e.g. ffmpeg/ffmpeg-core.wasm

const MIME = {
  wasm: "application/wasm",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  map: "application/json; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
};

function contentTypeFromKey(key) {
  const ext = key.split(".").pop()?.toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

export async function onRequest(context) {
  const { request, env, params } = context;

  const bucket = env.WWW_ASSETS;
  if (!bucket || typeof bucket.get !== "function") {
    return new Response(
      "R2 binding WWW_ASSETS is missing or not an R2 bucket. Check Pages → Settings → Bindings.",
      { status: 500 }
    );
  }

  const raw = Array.isArray(params.path) ? params.path.join("/") : params.path;
  if (!raw) return new Response("Missing path", { status: 400 });

  const key = `ffmpeg/${raw}`;

  const obj = await bucket.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", contentTypeFromKey(key));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  // REQUIRED for crossOriginIsolated + ffmpeg worker
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");


  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  const inm = request.headers.get("If-None-Match");
  if (inm && obj.httpEtag && inm === obj.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(obj.body, { status: 200, headers });
}
