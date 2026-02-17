# 🎬 WhatWeWatching

A **host‑authoritative watch‑together** app built on Cloudflare, where the host controls play/pause/seek and viewers stay locked and synced — **even while the movie is still uploading**.

This repo is optimized for your “dream mode”:

- Host drops a big file (even multi‑GB)
- The host browser generates **time‑based fMP4 segments** and uploads them to R2
- Viewers start watching as soon as the needed segments exist
- If the host jumps to **37:44**, the uploader prioritizes segments around that timestamp (**behind 10s / ahead 60s**)
- Everything is auto‑deleted ~5 hours later

---

## Stack

- **Cloudflare Workers**: HTTP API + streaming endpoints
- **Durable Objects**: rooms + WebSocket signaling + host authority
- **Cloudflare R2**: segment storage (`init.mp4` + `.m4s`)
- **MediaSource Extensions (MSE)**: segmented playback in the browser
- **ffmpeg.wasm (in-browser)**: segments are generated on the host machine

---

## Key behaviors

### Host authoritative controls
- Host controls **play / pause / seek / rate**
- Viewers see the normal player UI, but cannot control playback:
  - Clicks on play/pause do nothing
  - Seek bar snaps back immediately on drag and on release
  - Keyboard shortcuts are blocked (space/J/K/L/arrows/home/end/0‑9)
  - Pointer / touch gestures on the `<video>` element are blocked (double‑click fullscreen, etc.)
  - If the browser tries to change playback via native media UI / hardware keys, the viewer snaps back to host state
- Viewers can still change **volume**

### Option B “Dream mode”: time‑segmented progressive upload
Storage layout in R2:

```
videos/<videoId>/meta.json
videos/<videoId>/init.mp4
videos/<videoId>/seg-000000.m4s
videos/<videoId>/seg-000001.m4s
...
```

Endpoints:

- `POST /seg/init` → create a segmented session
- `POST /seg/put?videoId=...&kind=init` → upload `init.mp4`
- `POST /seg/put?videoId=...&kind=seg&index=N` → upload `seg-N.m4s`
- `GET /seg/init/<videoId>` → init
- `GET /seg/seg/<videoId>/<N>` → segment N
- `GET /seg/meta?videoId=...` → meta

**Priority upload logic (host):**
- segment duration: **2 seconds**
- upload window: **-10s / +60s** around current host playhead
- upload concurrency: **4 parallel segment uploads**
- uses **windowed segmentation** (does NOT pre-generate the entire movie up front)

---

## Codec & browser compatibility (important)

For widest MSE support in Chrome/Edge/Safari/Firefox, the safest combo is:

- **H.264 (AVC) video + AAC audio**

The host uploader:
1. tries **stream-copy** (fast) if the file appears to be H.264/AAC
2. falls back to **transcoding to baseline H.264 + AAC** when copy fails (slower, but most compatible)

If your file is HEVC/H.265, DTS, etc., playback may fail in some browsers unless transcoded.

---

## Auto-delete after ~5 hours

Each upload writes `expiresAt = now + 5 hours` into `meta.json`.

Deletion happens in two ways:
- **Immediate enforcement**: if any request sees an expired `meta.json`, the Worker deletes that video prefix and returns 404.
- **Cron cleanup**: a scheduled Worker job periodically scans and removes expired prefixes.

**Note:** “~5 hours” means 5h + up to your cron interval.

---

## Setup (Cloudflare)

You do **not** need additional Workers beyond this one project, but you must configure:

1) **R2 bucket binding**  
2) **Durable Object binding**  
3) **Cron trigger** (for cleanup)  
4) WebSocket enabled (default for Workers)

### 1) Configure `wrangler.toml`
This repo includes a starter `wrangler.toml`. Ensure you have:

- `[vars] PUBLIC_VIDEO_BASE` set appropriately (if you use the legacy /upload path)
- an R2 binding like `[[r2_buckets]] binding = "VIDEOS"`
- a Durable Object class/binding for `Room`
- a cron schedule (example: every 5 or 15 minutes)

### 2) Deploy
```bash
npm i -g wrangler
wrangler login
wrangler deploy
```

---

## Performance notes / limits

- ffmpeg.wasm is **heavy** (large download + CPU usage). On weaker machines, segmentation of long 4K files can be slow.
- Uploading large segments is bandwidth dependent; viewers may stall if the host’s uplink can’t stay ahead of playback.
- R2 list operations are paginated; the cleanup job handles pagination.
- This is optimized for “watch together” rather than public VOD-scale streaming.

---

## Troubleshooting


## Debugging panel (UI)

The UI now includes a **Debugging** panel with two live streams:

- **Errors**: failures such as network/WS issues, upload/segment errors, and JS/runtime errors.
- **Logs**: normal operational events (room joins, peer changes, uploader/HLS/MSE events, etc.)

Each line is timestamped (same format as the previous chat log).

At the bottom of the panel:

- **Copy Logs / Copy Errors / Copy All**
- Optional **.TXT** checkbox: when enabled, clicking a copy button downloads a `.txt` file instead of copying to clipboard.



- Viewer sees “Unsupported MIME/codec for MSE”  
  → Try a file that is H.264/AAC, or let transcode run.

- Host machine freezes during segmentation  
  → Try a smaller file / lower resolution, or reduce concurrency / segment duration.

- Auto-delete feels late  
  → Reduce the cron interval in `wrangler.toml`.



## COOP/COEP (ffmpeg.wasm multithread readiness)

This repo now includes `public/_headers` to enable cross-origin isolation on Cloudflare Pages:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

The Worker proxy that serves `/ffmpeg/*` also sets `Cross-Origin-Resource-Policy: cross-origin` and reflects an allowed Origin.

If you use a custom domain, set `ALLOWED_ORIGIN` in the Worker environment to your site origin (e.g. `https://whatwewatching.example.com`).


## Buffering behavior (Viewer quality-of-life)

**No autoplay on load:** When the Host selects a video, clients will *not* immediately auto-play. Playback begins when the Host presses Play (or sends an unpaused state).

**Viewer buffering gate (segmented/MSE):** When a Viewer receives a Play / unpaused state (including after a seek), the Viewer will wait until at least ~5 seconds worth of segments (chunks) at the target time are available on the server, then start playback. This reduces “join while host is already playing” stalls and prevents viewers from running ahead of what’s been uploaded.

If segments are still uploading, Viewers will briefly wait (polling for readiness) and then begin once ready.

**Host buffering gate:** Host will not start/resume playback (including after seeking) until at least ~5 seconds of segments at the target time have been uploaded (reflected via `readyHi`). This helps late-join viewers and prevents playback running ahead of uploads.

## Dual playback mode (auto)
Viewers primarily use **MSE (fMP4 segments)**. For browsers with native HLS support (e.g., Safari), the client may use the generated playlist at `/seg/hls/<videoId>/out.m3u8`.
Late joiners send a `where` request on datachannel open; the host rebroadcasts the current load+state.

### HLS.js support (pinned)
This build loads **hls.js v1.6.15** from jsDelivr and will automatically use HLS (native Safari or hls.js) when a playlist URL is provided; otherwise it falls back to MSE segmented playback.



## Patch 6 note (FFmpeg Pages Function)
- Added `functions/ffmpeg/[[path]].js` proxy to R2 with COEP/COOP/CORP headers so `814.ffmpeg.js` is not blocked.
- Added `functions/_routes.json` to force `/ffmpeg/*` through Pages Functions.
- Removed `wrangler.toml` from this Pages upload bundle (it can interfere with Pages Function publishing). If you need it for Workers, keep it in your Worker repo, not the Pages upload.
### Quick test
- Open `/ffmpeg/814.ffmpeg.js` in DevTools → Headers and confirm `Cross-Origin-Embedder-Policy: require-corp` and `X-FFMPEG-PROXY: pages-function`.
