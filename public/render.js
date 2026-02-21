import { AppState } from "./state.js";



export function render(state){
  renderStreamQuality(state);
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


function renderStreamQuality(state){
  const select = document.querySelector("#streamBitratePicker");
  if(!select) return;

  const menu = select.querySelector(".pwSelectMenu");
  const btn  = select.querySelector(".pwSelectBtn");
  if(!menu || !btn) return;

  menu.innerHTML = "";

  state.stream.qualityOptions.forEach(opt=>{
    const el = document.createElement("div");
    el.className = "pwSelectOpt";
    el.dataset.value = opt.id;
    el.textContent = opt.label;

    if(opt.id === state.stream.quality){
      el.classList.add("selected");
      btn.textContent = opt.label;
    }

    menu.appendChild(el);
  });
}
