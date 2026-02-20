import { dispatch } from "./actions.js";

/*
  Networking bridge extracted from legacy app.v5.js.
  UI logic removed intentionally.

  Responsibilities:
  - connect signaling
  - create RTCPeerConnection
  - dispatch lifecycle actions
*/

let pc = null;

export async function startNetworking() {
  dispatch({ type: "CONNECTING" });

  try {
    pc = new RTCPeerConnection();

    pc.addEventListener("track", (ev) => {
      const stream = ev.streams?.[0];
      if (stream) {
        dispatch({ type: "STREAM_STARTED", stream });
      }
    });

    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "connected") {
        dispatch({ type: "CONNECTED" });
      }
      if (["failed","disconnected","closed"].includes(pc.connectionState)) {
        dispatch({ type: "DISCONNECTED" });
      }
    });

    // TODO:
    // Hook existing worker signaling here.
    // Send offers/answers via worker messages.
    console.log("Networking initialized (awaiting worker signaling)");

  } catch (e) {
    console.error(e);
    dispatch({ type: "DISCONNECTED" });
  }
}
