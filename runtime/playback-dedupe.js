/* Synvera Playback De-duplication
   Prevents duplicate playback reactions
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastAction = null;
  let lastStamp = 0;

  bus.on("playback:request", (req) => {

    const now = performance.now();

    // ignore identical rapid repeats
    if (
      lastAction &&
      req.action === lastAction.action &&
      Math.abs((req.time ?? 0) - (lastAction.time ?? 0)) < 0.02 &&
      now - lastStamp < 120
    ) {
      console.log("[Synvera] Duplicate playback ignored");
      return;
    }

    lastAction = req;
    lastStamp = now;
  });

  console.log("[Synvera] Playback dedupe active");

})();