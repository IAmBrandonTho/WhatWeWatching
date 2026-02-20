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

    // Playback control (local-only, state-driven)
    if(video && state.video.hasStream){
      if(state.timeline.paused){
        if(!video.paused) video.pause();
      }else{
        video.play().catch(()=>{});
      }
    }

}

export function updateTimelineTick(state){
  // Timeline UI temporarily disabled to prevent runtime crash
  // (updateTimelineUI was undefined)
}
