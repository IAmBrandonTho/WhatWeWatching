export function reducer(state, action) {
  switch (action.type) {
    case "CONNECTED":
      state.connection = "connected";
      return;

    case "CONNECTING":
      state.connection = "connecting";
      return;

    case "DISCONNECTED":
      state.connection = "disconnected";
      state.streaming = false;
      state.video.hasStream = false;
      return;

    case "STREAM_STARTED":
      state.streaming = true;
      state.video.hasStream = true;
      return;

    case "STREAM_STOPPED":
      state.streaming = false;
      state.video.hasStream = false;
      return;

    case "PEERS_UPDATED":
      state.peers = action.peers || [];
      return;

    default:
      return;
  }
}
