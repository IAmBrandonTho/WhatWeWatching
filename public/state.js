export const AppState = {
  role: "viewer",
  connection: "disconnected",
  streaming: false,
  video: { paused: true, hasStream: false },
  peers: [],
  reconnect: { roomId:null, lastRole:null },
  ui: { peopleOpen:true, qualityOpen:false }
};

const listeners = new Set();

export function subscribe(fn){
  listeners.add(fn);
}

export function setState(patch){
  Object.assign(AppState, patch);
  listeners.forEach(fn=>fn(AppState));
}