export async function onRequest({ request }) {
  const WORKER_ORIGIN = "https://whatwewatching-signal.lilbrandon2008.workers.dev";

  const url = new URL(request.url);
  const forwardPath = url.pathname.replace(/^\/api/, "");
  const target = WORKER_ORIGIN + forwardPath + url.search;

  // Forward request with minimal overhead. Avoid forwarding Host.
  const headers = new Headers(request.headers);
  headers.delete("host");

  return fetch(target, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "follow",
  });
}
