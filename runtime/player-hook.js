/* ============================================================
   Synvera — Player Hook (Single Authority Adapter)
   ------------------------------------------------------------
   Purpose:
   Stop legacy multi-attach hooks from fighting Synvera.
   Only one controlled attachment is allowed.
   ============================================================ */

(function () {

  if (window.__SYNVERA_PLAYER_HOOK__) return;
  window.__SYNVERA_PLAYER_HOOK__ = true;

  const log = (...a) => console.log("[Synvera] Player hook", ...a);

  let attached = false;

  function findPlayer() {
    return (
      document.querySelector("video") ||
      document.querySelector("canvas")
    );
  }

  function attach(player) {
    if (!player || attached) return;
    attached = true;

    log("attached (authority mode)");

    /* ----------------------------------
       Host → emits authoritative updates
    ---------------------------------- */
    player.addEventListener("timeupdate", () => {
      if (!window.__SYNVERA_IS_HOST__) return;

      window.dispatchEvent(
        new CustomEvent("synvera:host-time", {
          detail: {
            time: player.currentTime || 0
          }
        })
      );
    });

    /* ----------------------------------
       Viewer → never writes time
    ---------------------------------- */
    window.addEventListener("synvera:apply-time", (e) => {
      if (window.__SYNVERA_IS_HOST__) return;

      try {
        player.currentTime = e.detail.time;
      } catch (_) {}
    });
  }

  function waitForPlayer() {
    const player = findPlayer();

    if (!player) {
      requestAnimationFrame(waitForPlayer);
      return;
    }

    attach(player);
  }

  waitForPlayer();

})();