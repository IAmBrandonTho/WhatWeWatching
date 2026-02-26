/* =========================================================
   SYNVERA LEGACY STABILIZER
   Neutralizes redundant Index8 timing behaviour
   ========================================================= */

(function () {

  if (!window.Synvera) return;

  const S = window.Synvera;
  const bus = S.bus;
  const player = S.player;

  if (!bus || !player) return;

  console.log("[Synvera] Legacy stabilizer starting");

  /* -------------------------------------------------------
     INTERNAL TRACKING
  ------------------------------------------------------- */

  let lastPlayStamp = 0;
  let lastPauseStamp = 0;
  let lastSeekStamp = 0;
  let lastSeekValue = -1;

  function tooSoon(last, ms) {
    return performance.now() - last < ms;
  }

  /* -------------------------------------------------------
     PLAY / PAUSE DEDUPE
  ------------------------------------------------------- */

  bus.on("playback:request", (req) => {

    if (!req) return;

    if (req.action === "play") {

      if (tooSoon(lastPlayStamp, 150)) {
        console.log("[Synvera] play suppressed");
        return;
      }

      lastPlayStamp = performance.now();
    }

    if (req.action === "pause") {

      if (tooSoon(lastPauseStamp, 150)) {
        console.log("[Synvera] pause suppressed");
        return;
      }

      lastPauseStamp = performance.now();
    }

  });

  /* -------------------------------------------------------
     SEEK BURST CONTROL (frame stepping fix)
  ------------------------------------------------------- */

  bus.on("playback:request", (req) => {

    if (req.action !== "seek") return;

    const now = performance.now();

    if (
      Math.abs(req.time - lastSeekValue) < 0.015 &&
      now - lastSeekStamp < 140
    ) {
      console.log("[Synvera] seek burst suppressed");
      return;
    }

    lastSeekValue = req.time;
    lastSeekStamp = now;
  });

  /* -------------------------------------------------------
     LEGACY UI ECHO PREVENTION
  ------------------------------------------------------- */

  let lastVideoState = null;

  bus.on("host:state", (state) => {

    if (state === lastVideoState) return;
    lastVideoState = state;

    // prevents UI listeners from re-triggering playback
    const video = player.element;
    if (!video) return;

    if (state === "playing" && video.paused) {
      video.play().catch(()=>{});
    }

    if (state === "paused" && !video.paused) {
      video.pause();
    }

  });

  /* -------------------------------------------------------
     VIEWER DRIFT HARD LIMIT
  ------------------------------------------------------- */

  bus.on("time:filtered", (time) => {

    if (S.role === "host") return;

    const video = player.element;
    if (!video) return;

    const drift = Math.abs(video.currentTime - time);

    // only correct real drift
    if (drift > 0.6) {
      video.currentTime = time;
      console.log("[Synvera] drift correction");
    }

  });

  console.log("[Synvera] Legacy stabilizer active");

})();