import { ensureSession } from './_store.js';

function hexId(len=32){
  const a = new Uint8Array(len/2);
  crypto.getRandomValues(a);
  return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function onRequestPost({ request }){
  let body = {};
  try{ body = await request.json(); }catch{}

  const provided = (body && body.videoId) ? String(body.videoId) : '';
  const videoId = provided || hexId(32);

  ensureSession(videoId, {
    segmentDurationMs: body.segmentDurationMs,
    mime: body.mime,
    codecs: body.codecs,
    durationSec: body.durationSec,
  });

  return new Response(JSON.stringify({ videoId }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    }
  });
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
