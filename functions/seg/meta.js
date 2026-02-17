import { getSession, listSegIndices } from './_store.js';

export async function onRequestGet({ request }){
  const url = new URL(request.url);
  const videoId = String(url.searchParams.get('videoId')||'');
  const s = getSession(videoId);
  if(!s){
    return new Response(JSON.stringify({ ok:false, error:'not_found' }), {
      status: 404,
      headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'access-control-allow-origin':'*' }
    });
  }
  const segIdx = listSegIndices(s);
  const uploadedSegments = segIdx.length;
  return new Response(JSON.stringify({
    ok: true,
    videoId,
    hasInit: !!s.init,
    uploadedSegments,
    segmentDurationMs: s.segmentDurationMs,
    mime: s.mime,
    codecs: s.codecs,
    durationSec: s.durationSec,
    maxSegmentIndex: segIdx.length ? Math.max(...segIdx) : -1,
  }), {
    status: 200,
    headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'access-control-allow-origin':'*' }
  });
}

export async function onRequestOptions(){
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    }
  });
}
