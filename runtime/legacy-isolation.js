/* Synvera Legacy Isolation
   Prevents legacy code from becoming authority again
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  // Track who last issued playback intent
  let lastAuthority = "unknown";

  bus.on("playback:request", (req) => {
    lastAuthority = req.source || "unknown";
  });

  // expose read-only authority state
  Object.defineProperty(window.Synvera, "lastAuthority", {
    get() {
      return lastAuthority;
    }
  });

  console.log("[Synvera] Legacy isolation active");

})();