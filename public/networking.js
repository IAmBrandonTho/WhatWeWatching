import { dispatch } from "./actions.js";

/*
 Simplified networking bridge.
 Existing signaling should be reconnected here.
*/

let pc=null;
let dc=null;

export async function startNetworking(){

  dispatch({type:"CONNECTING"});

  pc=new RTCPeerConnection();

  // Instant‑join improvement: prepare media pipeline early
  try {
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });
  } catch(e) {
    console.warn("Transceiver prewarm failed", e);
  }

  pc.addEventListener("track",(ev)=>{
    const stream=ev.streams?.[0];
    if(stream){
      dispatch({type:"STREAM_STARTED", stream});
    }
  });

  pc.addEventListener("connectionstatechange",()=>{
    if(pc.connectionState==="connected"){
      dispatch({type:"CONNECTED"});
    }
    if(["failed","disconnected","closed"].includes(pc.connectionState)){
      dispatch({type:"DISCONNECTED"});
      dispatch({type:"STREAM_STOPPED"});
    }
  });

  // DataChannel receive (chat + timeline only)
  pc.addEventListener("datachannel",(e)=>{
    dc=e.channel;
    dc.onmessage=(msg)=>{
      try{
        const data=JSON.parse(msg.data);
        if(data.type==="timeline"){
          dispatch({type:"TIMELINE_UPDATE", ...data});
        }
      }catch{}
    };
  });
}

// Bitrate observer (host‑local)
let lastQuality=null;

export function applyQuality(state){
  if(!pc) return;
  const sender = pc.getSenders().find(s=>s.track && s.track.kind==="video");
  if(!sender) return;

  const opt = state.stream.qualityOptions.find(o=>o.id===state.stream.quality);
  if(!opt) return;

  if(lastQuality === opt.id) return;
  lastQuality = opt.id;

  try{
    const params = sender.getParameters();
    if(!params.encodings) params.encodings=[{}];
    params.encodings[0].maxBitrate = opt.bitrate;
    sender.setParameters(params);
  }catch(e){
    console.warn("Bitrate apply failed", e);
  }
}
