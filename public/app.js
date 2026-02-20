import { initUIBindings } from "./uiBindings.js";
import { startNetworking } from "./networking.js";

/*
 UI must boot first so controls always work
 even if networking fails.
*/
initUIBindings();

/*
 Networking must never block UI.
*/
Promise.resolve()
  .then(() => startNetworking())
  .catch(err => {
    console.error("Networking failed:", err);
  });
