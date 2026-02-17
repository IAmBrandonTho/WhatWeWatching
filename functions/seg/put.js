import { ensureSession } from './_store.js';

export async function onRequestPost({ request }){
  const url = new URL(request.url);
  const videoId = String(url.searchParams.get('videoId')||'');
  const kind = String(url.searchParams.get('kind')||'');
  const indexStr = url.searchParams.get('index');

  if(!videoId || !kind){
    return new Response('missing videoId/kind', { status: 400, headers: { 'access-control-allow-origin': '*'} });
  }

  const s = ensureSession(videoId, {});
  const buf = new Uint8Array(await request.arrayBuffer());

  if(kind === 'init'){
    s.init = buf;
    s.updatedAt = Date.now();
    return new Response('ok', { status: 200, headers: { 'access-control-allow-origin': '*', 'cache-control':'no-store' } });
  }

  if(kind === 'seg'){
    const idx = Number(indexStr);
    if(!Number.isFinite(idx) || idx < 0){
      return new Response('bad index', { status: 400, headers: { 'access-control-allow-origin': '*'} });
    }
    s.segs.set(idx, buf);
    s.updatedAt = Date.now();
    return new Response('ok', { status: 200, headers: { 'access-control-allow-origin': '*', 'cache-control':'no-store' } });
  }

  return new Response('bad kind', { status: 400, headers: { 'access-control-allow-origin': '*'} });
}

export async function onRequestOptions(){
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    }
  });
}
