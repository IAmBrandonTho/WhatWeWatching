export function reducer(state, action){
  switch(action.type){

    case "CONNECTING":
      state.connection="connecting"; return;

    case "CONNECTED":
      state.connection="connected"; return;

    case "DISCONNECTED":
      state.connection="disconnected";
      state.streaming=false;
      state.video.hasStream=false;
      state.video.stream=null;
      return;

    case "STREAM_STARTED":
      state.streaming=true;
      state.video.hasStream=true;
      state.video.stream=action.stream;
      return;

    case "STREAM_STOPPED":
      state.streaming=false;
      state.video.hasStream=false;
      state.video.stream=null;
      return;

    case "SET_STREAM_QUALITY":
      state.stream.quality = action.id;
      return;

    case "TIMELINE_UPDATE":
      state.timeline={
        hostTime:action.t,
        duration:action.d,
        paused:action.paused,
        receivedAt:performance.now()
      };
      return;
  }
}