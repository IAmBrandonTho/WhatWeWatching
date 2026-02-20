export const AppState = {
  role: "viewer",
  connection: "disconnected",
  streaming: false,
  video: { paused: true, hasStream: false, stream: null },
  peers: [],
  ui: { peopleOpen: false, qualityOpen: false }
};
