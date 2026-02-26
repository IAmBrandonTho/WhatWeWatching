/* Synvera Authority Bridge
   Makes Synvera the reference playback authority
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastAction = null;

  bus.on("playback:request", (req) => {
    lastAction = {
      action: req.action,
      time: req.time ?? null,
      source: req.source ?? "unknown",
      stamp: performance.now()
    };
  });

  Object.defineProperty(window.Synvera, "authorityAction", {
    get() {
      return lastAction;
    }
  });

  console.log("[Synvera] Authority bridge active");

})();