import { startNetworking } from "./networking.js";
import { dispatch } from "./actions.js";

window.addEventListener("DOMContentLoaded", () => {
  dispatch({ type: "DISCONNECTED" });
  startNetworking();
});
