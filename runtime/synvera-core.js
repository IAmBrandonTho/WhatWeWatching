/* =========================================================
   SYNVERA CORE CONTROLLER
   Central playback authority + stabilization layer
   ========================================================= */

(function () {

  if (!window.Synvera) return;

  const S = window.Synvera;
  const bus = S.bus;
  const player = S.player;

  if (!bus || !player) {
    console.warn("[Synvera] Core waiting for dependencies");
    return;
  }

  console.log("[Synvera] Core controller starting");

  /* -------------------------------------------------------
     INTERNAL STATE
  ------------------------------------------------------- */

  let lastHumanIntent = 0;
  let lastSeekStamp = 0;
  let lastSeekValue = -1;
  let redirecting = false;

  /* -------------------------------------------------------
     HUMAN INTENT TRACKING
  ------------------------------------------------------- */

  document.addEventListener("pointerdown", () => {
    lastHumanIntent = performance.now();
  }, true);

  function isHumanIntent() {
    return performance.now() - lastHumanIntent < 500;
  }

  /* -------------------------------------------------------
     AUTHORITY RULES
  ------------------------------------------------------- */

  function allowAction(req) {

    // host always allowed
    if (S.role === "host") return true;

    // viewers cannot drive timeline
    if (req.action === "seek") return false;
    if (req.action === "play") return false;
    if (req.action === "pause") return false;

    return true;
  }

  /* -------------------------------------------------------
     SEEK DEDUPE + STABILIZATION
  ------------------------------------------------------- */

  function shouldIgnoreSeek(time) {

    const now = performance.now();

    if (
      Math.abs(time - lastSeekValue) < 0.02 &&
      now - lastSeekStamp < 120
    ) {
      return true;
    }

    lastSeekValue = time;
    lastSeekStamp = now;
    return false;
  }

  /* -------------------------------------------------------
     MAIN PLAYBACK ROUTER
  ------------------------------------------------------- */

  bus.on("playback:request", (req) => {

    if (!req) return;

    // attach intent info
    req.human = isHumanIntent();

    if (!allowAction(req)) {
      console.log("[Synvera] Action blocked:", req.action);
      return;
    }

    if (req.action === "seek") {
      if (shouldIgnoreSeek(req.time)) return;
    }

    if (redirecting) return;
    redirecting = true;

    try {

      if (req.action === "play") {
        player.play();
      }

      if (req.action === "pause") {
        player.pause();
      }

      if (req.action === "seek") {
        player.seek(req.time);
      }

    } finally {
      redirecting = false;
    }

  });

  /* -------------------------------------------------------
     HOST CLOCK PRIORITY
  ------------------------------------------------------- */

  let lastHostUpdate = 0;

  bus.on("host:time", () => {
    lastHostUpdate = performance.now();
  });

  bus.on("time:filtered", (time) => {

    if (S.role === "host") return;

    const video = player.element;
    if (!video) return;

    const drift = Math.abs(video.currentTime - time);

    if (drift < 0.35) return;
    if (performance.now() - lastHostUpdate < 400) return;

    video.currentTime = time;
  });

  /* -------------------------------------------------------
     LEGACY LOOP SUPPRESSION
  ------------------------------------------------------- */

  let lastStateEvent = 0;

  bus.on("host:state", () => {
    const now = performance.now();
    if (now - lastStateEvent < 60) return;
    lastStateEvent = now;
  });

  console.log("[Synvera] Core controller active");

})();