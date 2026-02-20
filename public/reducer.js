export function reducer(state, action) {
  switch (action.type) {
    case "CONNECTING":
      state.connection = "connecting"; return;

    case "CONNECTED":
      state.connection = "connected"; return;

    case "RECONNECTING":
      state.connection = "reconnecting"; return;

    case "DISCONNECTED":
      state.connection = "disconnected";
      state.streaming = false;
      state.video.hasStream = false;
      state.video.stream = null;
      state.peers = [];
      return;

    case "STREAM_STARTED":
      state.streaming = true;
      state.video.hasStream = true;
      state.video.stream = action.stream || null;
      return;

    case "STREAM_STOPPED":
      state.streaming = false;
      state.video.hasStream = false;
      state.video.stream = null;
      return;

    case "PEERS_UPDATED":
      state.peers = action.peers || [];
      return;
  }
}
