# WhatWeWatching - Prewarm Patch (PowerShell)
# Run from project root (folder that contains public/ and functions/)

Write-Host "1) Ensure Pages Functions routes include /api, /ffmpeg, /seg" -ForegroundColor Cyan
@'
{
  "version": 1,
  "include": ["/api/*", "/ffmpeg/*", "/seg/*"],
  "exclude": []
}
'@ | Set-Content -Encoding UTF8 .\public\_routes.json

Write-Host "2) Inject FFmpeg prewarm snippet into built JS in public/" -ForegroundColor Cyan
$inject = '(()=>{try{const s=document.createElement("script");s.src="/ffmpeg/ffmpeg.min.js";s.defer=true;s.setAttribute("data-ffmpeg-prewarm","1");document.head.appendChild(s);}catch(e){}})();'

Get-ChildItem .\public -Recurse -Filter *.js | ForEach-Object {
  $c = Get-Content $_.FullName -Raw
  if ($c -notmatch "data-ffmpeg-prewarm") {
    Set-Content $_.FullName ($inject + $c)
    Write-Host "  Patched: $($_.FullName)"
  } else {
    Write-Host "  Skipped (already patched): $($_.FullName)"
  }
}

Write-Host "3) Deploy Pages" -ForegroundColor Cyan
wrangler pages deploy .\public --project-name whatwewatching

Write-Host "Done." -ForegroundColor Green
