
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
  // DREAM MODE (time-based segmented upload/playback)
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
    let body = {};
    try { body = await request.json(); } catch {}
    let requested = (body && body.videoId) ? String(body.videoId) : "";
    // Allow client-specified stable IDs (e.g., hash) for resume across refresh.
    // Sanitize to URL-safe tokens only.
    requested = requested.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

    const videoId = requested || crypto.randomUUID();

    // Detect reuse (existing meta) when client supplies requested id
    const { meta: existingMeta } = await loadMeta(videoId);
    const reused = !!existingMeta;


    const segDurMs = Number(body.segmentDurationMs || 2000);

    // If a requested stable videoId already exists, reuse it (refresh-resume).
    if(requested){
      const existing = await env.VIDEOS.get(`videos/${videoId}/meta.json`);
      if(existing){
        try{
          const metaExisting = JSON.parse(await existing.text());
          // Refresh expiry for active sessions
          metaExisting.expiresAt = Date.now() + (5 * 60 * 60 * 1000);
          await env.VIDEOS.put(`videos/${videoId}/meta.json`, JSON.stringify(metaExisting));
        }catch{}
        return new Response(JSON.stringify({ videoId, reused: true }), {
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }
    }

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

    return new Response(JSON.stringify({ videoId, reused }), {
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

  
  // Alias: allow segments to be fetched under /seg/hls/<videoId>/<n> (some clients/extensions resolve relative URLs oddly).
  if (url.pathname.startsWith("/seg/hls/") && request.method === "GET") {
    const parts = url.pathname.split("/").filter(Boolean);
    // parts: ["seg","hls","<videoId>","<n>"] OR ["seg","hls","<videoId>","out.m3u8"]
    if (parts.length === 4 && parts[3] !== "out.m3u8") {
      const videoId = parts[2];
      const n = Number(parts[3]);
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
  }

// HLS playlist (fMP4) generated on-the-fly from uploaded segments.
  // GET /seg/hls/<videoId>/out.m3u8
  if (url.pathname.startsWith("/seg/hls/") && request.method === "GET") {
    const parts = url.pathname.split("/").filter(Boolean);
    // parts: ["seg","hls","<videoId>","out.m3u8"]
    if (parts.length >= 4 && parts[3] === "out.m3u8") {
      const videoId = parts[2];
      const { meta } = await loadMeta(videoId);
      if (!meta) return new Response("Not found", { status: 404, headers: { ...cors } });

      const segDur = Number(meta.segmentDurationMs || 2000) / 1000;
      const uploadedCount = Number(meta.uploadedSegments || 0);
      const uploaded = Array.from({length: Math.max(0, uploadedCount)}, (_,i)=>i);
      if (uploaded.length === 0) return new Response("#EXTM3U\n#EXT-X-VERSION:7\n", { status: 200, headers: { "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache", "Expires": "0", ...cors } });

      const targetDur = Math.max(1, Math.ceil(segDur));
      const durSec = Number(meta.durationSec || 0);

      // Build a simple VOD-ish playlist that grows as segments arrive.
      let playlist = "";
      playlist += "#EXTM3U\n";
      playlist += "#EXT-X-VERSION:7\n";
      playlist += "#EXT-X-TARGETDURATION:" + targetDur + "\n";
      playlist += "#EXT-X-PLAYLIST-TYPE:EVENT\n";

      playlist += "#EXT-X-ALLOW-CACHE:NO\n";

      playlist += "#EXT-X-MEDIA-SEQUENCE:0\n";

      playlist += "#EXT-X-INDEPENDENT-SEGMENTS\n";

      const base = url.origin;
      playlist += `#EXT-X-MAP:URI="${base}/seg/init/${videoId}"\n`;


      // If we know the full duration and have a contiguous range, emit ENDLIST when complete.
      const expectedCount = (durSec > 0) ? Math.ceil(durSec / segDur) : 0;

      for (const idx of uploaded) {
        playlist += "#EXTINF:" + segDur.toFixed(3) + ",\n";
        playlist += `${base}/seg/seg/${videoId}/${idx}\n`;
      }

      if (expectedCount > 0 && uploaded.length >= expectedCount) {
        playlist += "#EXT-X-ENDLIST\n";
      }

      return new Response(playlist, { status: 200, headers: { "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache", "Expires": "0", ...cors } });
    }
  }

return null;
}