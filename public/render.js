import { AppState } from "./state.js";



export function render(state){
  document.body.dataset.connection=state.connection;

  const video=document.querySelector("video");
  if(video){
    if(state.video.hasStream && state.video.stream){
      if(video.srcObject!==state.video.stream){
        video.srcObject=state.video.stream;
        video.play().catch(()=>{});
      }
    }else{
      video.srcObject=null;
    }
  }

  
}

export function updateTimelineTick(state){
  updateTimelineUI(state);
}


function updateTimelineUI(state){
  const cur=document.getElementById("timeCur");
  const dur=document.getElementById("timeDur");
  if(!cur || !dur) return;

  const tl=state.timeline;
  if(!tl || !tl.duration) return;

  let display=tl.hostTime||0;

  if(!tl.paused){
    const delta=(performance.now()-tl.receivedAt)/1000;
    display += delta;
  }

  const fmt=(s)=>{
    s=Math.max(0,Math.floor(s));
    const m=Math.floor(s/60);
    const ss=String(s%60).padStart(2,"0");
    return `${m}:${ss}`;
  };

  cur.textContent = fmt(display);
  dur.textContent = fmt(tl.duration);
}
