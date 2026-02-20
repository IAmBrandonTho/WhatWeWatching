export const AppState = {
  role: "viewer",
  connection: "disconnected",
  streaming: false,
  video: { hasStream:false, stream:null },
  peers: [],
  timeline: {
    hostTime:0,
    duration:0,
    paused:true,
    receivedAt:0
  }
};