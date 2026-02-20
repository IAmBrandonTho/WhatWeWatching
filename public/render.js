import { AppState } from "./state.js";

let rafId=null;

function updateTimelineUI(state){
  const el=document.querySelector("[data-timeline]");
  if(!el) return;

  const tl=state.timeline;
  if(!tl.duration) return;

  let display=tl.hostTime;

  if(!tl.paused){
    const delta=(performance.now()-tl.receivedAt)/1000;
    display=tl.hostTime+delta;
  }

  const fmt=(s)=>{
    s=Math.max(0,Math.floor(s));
    const m=Math.floor(s/60);
    const ss=String(s%60).padStart(2,"0");
    return `${m}:${ss}`;
  };

  el.textContent=`${fmt(display)} / ${fmt(tl.duration)}`;
}

function timelineLoop(){
  updateTimelineUI(AppState);
  rafId=requestAnimationFrame(timelineLoop);
}

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

  if(!rafId){
    rafId=requestAnimationFrame(timelineLoop);
  }
}