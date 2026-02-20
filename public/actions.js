import { setState } from "./state.js";

export function connecting(){
  setState({connection:"connecting"});
}

export function reconnecting(){
  setState({connection:"reconnecting"});
}

export function connected(){
  setState({connection:"connected"});
}

export function disconnected(){
  setState({
    connection:"disconnected",
    streaming:false,
    peers:[],
    video:{paused:true, hasStream:false}
  });
}

export function streamStarted(){
  setState({streaming:true, video:{paused:false, hasStream:true}});
}

export function streamStopped(){
  setState({streaming:false, video:{paused:true, hasStream:false}});
}

export function peersUpdated(peers){
  setState({peers});
}