function corsHeaders(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    'access-control-allow-headers': '*',
    'cache-control': 'no-store',
    ...extra,
  };
}

function makePlaylist(meta){
  const segDurSec = Math.max(0.5, (Number(meta.segmentDurationMs || 2000) / 1000));
  const target = Math.ceil(segDurSec);

  const uploaded = Math.max(0, Number(meta.uploadedSegments || 0));
  const lines = [];
  lines.push('#EXTM3U');
  lines.push('#EXT-X-VERSION:7');
  lines.push(`#EXT-X-TARGETDURATION:${target}`);
  lines.push('#EXT-X-PLAYLIST-TYPE:EVENT');
  lines.push('#EXT-X-MEDIA-SEQUENCE:0');
  lines.push('#EXT-X-INDEPENDENT-SEGMENTS');
  lines.push('#EXT-X-MAP:URI="init.mp4"');

  for(let i=0;i<uploaded;i++){
    lines.push(`#EXTINF:${segDurSec.toFixed(3)},`);
    lines.push(`seg-${String(i).padStart(6,'0')}.m4s`);
  }

  // Optional end marker if the host sets meta.done=true (not required)
  if(meta.done){
    lines.push('#EXT-X-ENDLIST');
  }

  return lines.join('\n') + '\n';
}

export async function onRequest(context){
  const { params, request, env } = context;
  if(request.method === 'OPTIONS'){
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if(request.method !== 'GET' && request.method !== 'HEAD'){
    return new Response('method not allowed', { status: 405, headers: corsHeaders() });
  }

  const videoId = String(params.videoId || '');
  const path = String(params.path || '');
  if(!videoId){
    return new Response('not found', { status: 404, headers: corsHeaders() });
  }

  const bucket = env?.VIDEOS;
  if(!bucket){
    return new Response('R2 binding VIDEOS missing', { status: 500, headers: corsHeaders({'content-type':'text/plain; charset=utf-8'}) });
  }

  const base = `videos/${videoId}/`;

  // out.m3u8 (derived from R2 meta.json)
  if(path === 'out.m3u8'){
    const metaObj = await bucket.get(base + 'meta.json');
    if(!metaObj){
      return new Response('not found', { status: 404, headers: corsHeaders() });
    }
    let meta;
    try{
      meta = JSON.parse(await metaObj.text());
    }catch{
      return new Response('bad meta', { status: 500, headers: corsHeaders() });
    }
    const body = makePlaylist(meta);
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: corsHeaders({ 'content-type': 'application/vnd.apple.mpegurl; charset=utf-8' })
    });
  }

  // init.mp4
  if(path === 'init.mp4'){
    const obj = await bucket.get(base + 'init.mp4');
    if(!obj){
      return new Response('not found', { status: 404, headers: corsHeaders() });
    }
    const hdrs = corsHeaders({
      'content-type': obj.httpMetadata?.contentType || 'video/mp4',
      'etag': obj.etag,
    });
    return new Response(request.method === 'HEAD' ? null : obj.body, { status: 200, headers: hdrs });
  }

  // seg-000123.m4s
  const m = /^seg-(\d{6})\.m4s$/i.exec(path);
  if(m){
    const idx = m[1];
    const obj = await bucket.get(base + `seg-${idx}.m4s`);
    if(!obj){
      return new Response('not found', { status: 404, headers: corsHeaders() });
    }
    const hdrs = corsHeaders({
      'content-type': obj.httpMetadata?.contentType || 'video/iso.segment',
      'etag': obj.etag,
    });
    return new Response(request.method === 'HEAD' ? null : obj.body, { status: 200, headers: hdrs });
  }

  return new Response('not found', { status: 404, headers: corsHeaders() });
}
