import { AppState, subscribe } from "./state.js";

function renderConnection(){
  const pill = document.querySelector(".connection-pill");
  if(!pill) return;
  pill.dataset.state = AppState.connection;
  pill.textContent =
    AppState.connection === "connected" ? "Connected" :
    AppState.connection === "connecting" ? "Connecting…" :
    AppState.connection === "reconnecting" ? "Reconnecting…" :
    "Disconnected";
}

function renderPeople(){
  const list = document.querySelector(".peoplePanel ul");
  if(!list) return;
  list.innerHTML = "";
  AppState.peers.forEach(p=>{
    const li=document.createElement("li");
    li.textContent=p;
    list.appendChild(li);
  });
}

function renderVideo(){
  const video=document.querySelector("video");
  if(!video) return;
  if(!AppState.video.hasStream){
    video.srcObject=null;
  }
}

function renderBodyState(){
  document.body.dataset.connection = AppState.connection;
}

export function initRender(){
  subscribe(()=>{
    renderConnection();
    renderPeople();
    renderVideo();
    renderBodyState();
  });
}