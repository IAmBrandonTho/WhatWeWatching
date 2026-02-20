import { dispatch } from "./actions.js";

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

    console.log("Networking initialized. Hook worker signaling here.");

  } catch (err) {
    console.error(err);
    dispatch({ type: "DISCONNECTED" });
  }
}
