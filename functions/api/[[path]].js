export async function onRequest(context) {
  const { request } = context;

  // Proxy all /api/* requests to the signaling Worker.
  const WORKER_ORIGIN = "https://whatwewatching-signal.lilbrandon2008.workers.dev";

  const incoming = new URL(request.url);

  // Strip the /api prefix
  const path = incoming.pathname.replace(/^\/api/, "");
  const targetUrl = WORKER_ORIGIN + path + incoming.search;

  // Recreate the request to avoid Pages runtime edge-cases when forwarding the original Request.
  const init = {
    method: request.method,
    headers: request.headers,
    redirect: "manual",
  };

  // Only attach a body for methods that can have one.
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return fetch(new Request(targetUrl, init));
}
