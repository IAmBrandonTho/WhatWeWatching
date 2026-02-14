
export async function handleStream(request, env, cors) {
  const url = new URL(request.url);

  async function loadMeta(videoId){
    const metaKey = `videos/${videoId}/meta.json`;
    const metaObj = await env.VIDEOS.get(metaKey);
    if(!metaObj) return { meta: null, metaKey };
    let meta=null;
    try{ meta = await metaObj.json(); }catch{ meta=null; }
    if(meta?.expiresAt && meta.expiresAt < Date.now()){
      // Enforce expiry immediately (cron is best-effort): delete prefix and treat as gone.
      const prefix = metaKey.replace('/meta.json','');
      let cursor;
      for(;;){
        const page = await env.VIDEOS.list({ prefix, cursor });
        cursor = page.cursor;
        await Promise.all(page.objects.map(o=> env.VIDEOS.delete(o.key)));
        if(!cursor) break;
      }
      return { meta: null, metaKey };
    }
    return { meta, metaKey };
  }

  // ---------------------------------------------------------------------------
  // OPTION B (time-based segmented upload/playback)
  //
  // Storage layout (R2):
  //   videos/<videoId>/meta.json
  //   videos/<videoId>/init.mp4
  //   videos/<videoId>/seg-000001.m4s
  //   videos/<videoId>/seg-000002.m4s
  //   ...
  //
  // Endpoints:
  //   POST /seg/init                       -> { videoId }
  //   POST /seg/put?videoId=&kind=init      -> upload init.mp4
  //   POST /seg/put?videoId=&kind=seg&index=<n> -> upload seg-N.m4s
  //   GET  /seg/meta?videoId=              -> meta json (includes uploadedSegments)
  //   GET  /seg/init/<videoId>             -> init.mp4
  //   GET  /seg/seg/<videoId>/<n>          -> seg-N.m4s
  //
  // Notes:
  // - We intentionally return 404/416 when a segment is not present yet.
  // - Client (MSE) retries/polls until segments appear.
  // ---------------------------------------------------------------------------

  // INIT SEGMENTED UPLOAD
  if (url.pathname === "/seg/init" && request.method === "POST") {
    const videoId = crypto.randomUUID();

    let body = {};
    try {
      body = await request.json();
    } catch {}

    const segDurMs = Number(body.segmentDurationMs || 2000);

    const meta = {
      kind: "segmented",
      segmentDurationMs: Math.max(250, Math.min(segDurMs, 10_000)),
      mime: String(body.mime || "video/mp4"),
      codecs: String(body.codecs || ""),
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 60 * 1000),
      uploadedSegments: 0,
      hasInit: false
    };

    await env.VIDEOS.put(`videos/${videoId}/meta.json`, JSON.stringify(meta));

    return new Response(JSON.stringify({ videoId }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // UPLOAD INIT OR SEGMENT
  if (url.pathname === "/seg/put" && request.method === "POST") {
    const videoId = url.searchParams.get("videoId");
    const kind = url.searchParams.get("kind");
    const index = Number(url.searchParams.get("index"));

    if (!videoId) return new Response("missing videoId", { status: 400, headers: cors });

    const { meta, metaKey } = await loadMeta(videoId);
    if (!meta) return new Response("no meta", { status: 404, headers: cors });

    const buf = await request.arrayBuffer();

    if (kind === "init") {
      await env.VIDEOS.put(`videos/${videoId}/init.mp4`, buf, {
        httpMetadata: { contentType: meta.mime || "video/mp4" }
      });
      meta.hasInit = true;
      await env.VIDEOS.put(metaKey, JSON.stringify(meta));
      return new Response("ok", { headers: cors });
    }

    if (kind === "seg") {
      if (!Number.isFinite(index) || index < 0) {
        return new Response("bad index", { status: 400, headers: cors });
      }
      const key = `videos/${videoId}/seg-${String(index).padStart(6, "0")}.m4s`;
      await env.VIDEOS.put(key, buf, { httpMetadata: { contentType: "video/iso.segment" } });
      meta.uploadedSegments = Math.max(meta.uploadedSegments || 0, index + 1);
      await env.VIDEOS.put(metaKey, JSON.stringify(meta));
      return new Response("ok", { headers: cors });
    }

    return new Response("bad kind", { status: 400, headers: cors });
  }

  // META
  if (url.pathname === "/seg/meta" && request.method === "GET") {
    const videoId = url.searchParams.get("videoId");
    if (!videoId) return new Response("missing videoId", { status: 400, headers: cors });
    const metaObj = await env.VIDEOS.get(`videos/${videoId}/meta.json`);
    if (!metaObj) return new Response("Not found", { status: 404, headers: cors });
    return new Response(await metaObj.text(), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // GET INIT
  if (url.pathname.startsWith("/seg/init/")) {
    const videoId = url.pathname.split("/")[3];
    const metaObj = await env.VIDEOS.get(`videos/${videoId}/meta.json`);
    if (!metaObj) return new Response("Not found", { status: 404, headers: cors });
    const meta = await metaObj.json();
    const obj = await env.VIDEOS.get(`videos/${videoId}/init.mp4`);
    if (!obj) return new Response("Init missing", { status: 404, headers: cors });
    return new Response(obj.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": meta.mime || "video/mp4",
        "Cache-Control": "no-store"
      }
    });
  }

  // GET SEGMENT
  if (url.pathname.startsWith("/seg/seg/")) {
    const parts = url.pathname.split("/");
    const videoId = parts[3];
    const n = Number(parts[4]);

    if (!Number.isFinite(n) || n < 0) return new Response("Bad segment", { status: 400, headers: cors });

    const obj = await env.VIDEOS.get(`videos/${videoId}/seg-${String(n).padStart(6, "0")}.m4s`);
    if (!obj) return new Response("Segment missing", { status: 404, headers: cors });
    return new Response(obj.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "video/iso.segment",
        "Cache-Control": "no-store"
      }
    });
  }

  // INIT UPLOAD
  if (url.pathname === "/upload/init" && request.method === "POST") {
    const videoId = crypto.randomUUID();

    const meta = {
      chunkSize: 5_000_000,
      uploadedBytes: 0,
      uploadedParts: 0,
      mime: "video/mp4",
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 60 * 1000)
    };

    await env.VIDEOS.put(`videos/${videoId}/meta.json`, JSON.stringify(meta));

    return new Response(JSON.stringify({ videoId }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // UPLOAD PART
  if (url.pathname === "/upload/part" && request.method === "POST") {
    const videoId = url.searchParams.get("videoId");
    const index = Number(url.searchParams.get("index"));

    const metaKey = `videos/${videoId}/meta.json`;
    const metaObj = await env.VIDEOS.get(metaKey);
    if (!metaObj) return new Response("no meta", { status: 404 });

    const meta = await metaObj.json();

    const key = `videos/${videoId}/part-${String(index).padStart(6,"0")}`;

    const body = await request.arrayBuffer();
    await env.VIDEOS.put(key, body);

    meta.uploadedParts = Math.max(meta.uploadedParts, index + 1);
    meta.uploadedBytes = meta.uploadedParts * meta.chunkSize;

    await env.VIDEOS.put(metaKey, JSON.stringify(meta));

    return new Response("ok", { headers: cors });
  }

  // PLAYBACK
  if (url.pathname.startsWith("/v/")) {
    const videoId = url.pathname.split("/")[2];

    const metaObj = await env.VIDEOS.get(`videos/${videoId}/meta.json`);
    if (!metaObj) return new Response("Not found", { status: 404 });

    const meta = await metaObj.json();
    const rangeHeader = request.headers.get("Range");
    if (!rangeHeader) return new Response("Range required", { status: 400 });

    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (!match) return new Response("Bad range", { status: 400 });

    let start = Number(match[1]);
    let end = match[2] ? Number(match[2]) : start + meta.chunkSize - 1;

    const avgBitrate = 2_000_000;
    const safeWindow = avgBitrate * 60 / 8;
    const maxReadable = meta.uploadedBytes - safeWindow;

    if (start > maxReadable)
      return new Response("Behind upload frontier", { status: 416 });

    end = Math.min(end, maxReadable);

    const chunkSize = meta.chunkSize;
    const firstChunk = Math.floor(start / chunkSize);
    const lastChunk = Math.floor(end / chunkSize);

    const streams = [];

    for (let i = firstChunk; i <= lastChunk; i++) {
      const key = `videos/${videoId}/part-${String(i).padStart(6,"0")}`;
      const obj = await env.VIDEOS.get(key);
      if (!obj) return new Response("Chunk missing", { status: 416 });
      streams.push(obj.body);
    }

    const stream = new ReadableStream({
      async start(controller) {
        for (const s of streams) {
          const reader = s.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      status: 206,
      headers: {
        ...cors,
        "Content-Type": meta.mime,
        "Accept-Ranges": "bytes"
      }
    });
  }

  return null;
}
