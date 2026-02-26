/* Synvera Playback Guard
   Detects rapid chained playback reactions
*/

(function () {

  if (!window.Synvera) return;

  let lastEvent = 0;

  window.Synvera.bus.on("host:state", () => {
    const now = performance.now();

    if (now - lastEvent < 60) {
      console.warn(
        "[Synvera] Rapid playback chain detected"
      );
    }

    lastEvent = now;
  });

  window.Synvera.bus.on("host:time", () => {
    const now = performance.now();

    if (now - lastEvent < 20) {
      console.warn(
        "[Synvera] Rapid time mutation detected"
      );
    }

    lastEvent = now;
  });

  console.log("[Synvera] Playback guard active");

})();