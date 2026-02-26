/* Synvera Legacy Seek Dampener
   Stops duplicate legacy seek reactions
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastSeekTime = -1;
  let lastSeekStamp = 0;

  bus.on("playback:request", (req) => {

    if (req.action !== "seek") return;

    const now = performance.now();

    // ignore near-identical rapid seeks
    if (
      Math.abs(req.time - lastSeekTime) < 0.02 &&
      now - lastSeekStamp < 120
    ) {
      console.log("[Synvera] Duplicate seek suppressed");
      return;
    }

    lastSeekTime = req.time;
    lastSeekStamp = now;
  });

  console.log("[Synvera] Legacy seek dampener active");

})();