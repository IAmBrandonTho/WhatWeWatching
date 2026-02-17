// In-memory segment store.
// NOTE: This is *ephemeral* (per isolate). For production, back this with Durable Objects/KV/R2.
export const sessions = new Map();

export function getSession(videoId){
  return sessions.get(String(videoId||''));
}

export function ensureSession(videoId, meta={}){
  const id = String(videoId||'');
  let s = sessions.get(id);
  if(!s){
    s = {
      videoId: id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      segmentDurationMs: Number(meta.segmentDurationMs||2000),
      mime: String(meta.mime||'video/mp4'),
      codecs: String(meta.codecs||''),
      init: null,
      segs: new Map(), // idx -> Uint8Array
      done: false,
      durationSec: Number(meta.durationSec||0),
    };
    sessions.set(id, s);
  } else {
    // merge meta
    if(meta.segmentDurationMs) s.segmentDurationMs = Number(meta.segmentDurationMs);
    if(meta.mime) s.mime = String(meta.mime);
    if(meta.codecs) s.codecs = String(meta.codecs);
    if(meta.durationSec) s.durationSec = Number(meta.durationSec);
    s.updatedAt = Date.now();
  }
  return s;
}

export function listSegIndices(s){
  return Array.from(s.segs.keys()).map(n=>Number(n)).filter(Number.isFinite).sort((a,b)=>a-b);
}

export function maxContiguousIndex(s){
  const idxs = listSegIndices(s);
  let m = -1;
  for(const i of idxs){
    if(i === m+1) m = i;
    else if(i>m+1) break;
  }
  return m;
}
