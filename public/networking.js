import { dispatch } from "./actions.js";

export function startNetworking() {
  console.log("Networking initialized. Hook worker signaling here.");

  // Simulated lifecycle for sanity
  dispatch({ type: "CONNECTING" });

  setTimeout(() => {
    dispatch({ type: "CONNECTED" });
  }, 500);
}
