/* Synvera Viewer Stabilizer
   Keeps viewers aligned without fighting playback
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastApplied = 0;

  bus.on("time:filtered", (time) => {

    // host never self-corrects
    if (window.Synvera.role === "host") return;

    const video = window.Synvera.player.element;
    if (!video) return;

    const drift = Math.abs(video.currentTime - time);

    // ignore tiny differences
    if (drift < 0.35) return;

    // avoid rapid corrections
    const now = performance.now();
    if (now - lastApplied < 800) return;

    lastApplied = now;

    video.currentTime = time;

    console.log("[Synvera] Viewer correction applied");
  });

  console.log("[Synvera] Viewer stabilizer active");

})();