# Deploy notes (R2-hosted ffmpeg)

## Required Cloudflare Pages settings (Production)
- R2 binding: `ASSETS` -> bucket `whatwewatching-assets`
- Build command: (empty)
- Output directory: `public`

## Recommended deploy method
Use Git deploys (push to `main`). Avoid `wrangler pages deploy` if you see "Failed to publish your Function: Unknown internal error".

## Verify
Open `/ffmpeg/ffmpeg.min.js` and confirm response header `X-FFMPEG-SOURCE: r2`.
