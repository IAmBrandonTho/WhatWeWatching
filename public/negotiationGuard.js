const COOLDOWN_MS = 8000;

let state = "IDLE";
let pendingConfig = null;
let cooldownUntil = 0;
let cooldownTimer = null;

function emitToast(message){
  document.dispatchEvent(new CustomEvent("ui:toast", {
    detail:{
      message,
      type:"warning",
      duration:3500
    }
  }));
}

function remainingSeconds(){
  return Math.max(0, Math.ceil((cooldownUntil - Date.now())/1000));
}

async function runNegotiation(fn){
  state = "NEGOTIATING";
  try{
    await fn();
  }catch(e){
    console.error("Negotiation failed", e);
  }

  if(pendingConfig){
    const next = pendingConfig;
    pendingConfig = null;
    await runNegotiation(()=>fn(next));
    return;
  }

  state = "COOLDOWN";
  cooldownUntil = Date.now() + COOLDOWN_MS;

  if(cooldownTimer) clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(()=>{
    state = "IDLE";
  }, COOLDOWN_MS);
}

export function requestNegotiation(config, fn){
  if(state === "COOLDOWN"){
    emitToast(
      "You recently applied a setting. Please try again in "
      + remainingSeconds() + " seconds."
    );
    return;
  }

  if(state === "NEGOTIATING"){
    pendingConfig = config;
    return;
  }

  runNegotiation(()=>fn(config));
}