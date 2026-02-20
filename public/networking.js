import { dispatch } from "./actions.js";

let pc=null;

export function startNetworking(){

  pc=new RTCPeerConnection();

  pc.addEventListener("track",(ev)=>{
    const stream=ev.streams?.[0];
    if(stream){
      dispatch({type:"STREAM_STARTED", stream});
    }
  });

  pc.addEventListener("connectionstatechange",()=>{
    if(["failed","disconnected","closed"].includes(pc.connectionState)){
      dispatch({type:"DISCONNECTED"});
      dispatch({type:"STREAM_STOPPED"});
    }
  });

  pc.addEventListener("datachannel",(e)=>{
    const dc=e.channel;
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