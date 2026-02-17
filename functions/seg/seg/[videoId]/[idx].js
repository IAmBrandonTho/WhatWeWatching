import { getSession } from '../../_store.js';

export async function onRequest({ params, request }){
  const videoId = String(params.videoId||'');
  const idx = Number(params.idx);
  const s = getSession(videoId);
  const ok = !!(s && Number.isFinite(idx) && s.segs.has(idx));

  if(request.method === 'HEAD'){
    return new Response(null, {
      status: ok ? 200 : 404,
      headers: {
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      }
    });
  }

  if(!ok){
    return new Response('not found', { status: 404, headers: { 'access-control-allow-origin': '*', 'cache-control':'no-store' } });
  }

  const bytes = s.segs.get(idx);
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'video/iso.segment',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    }
  });
}
