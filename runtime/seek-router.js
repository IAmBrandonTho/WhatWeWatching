/* ============================================================
   Synvera — Seek Router (Authority Safe)
   ------------------------------------------------------------
   Purpose:
   Prevent legacy code from attaching to player.currentTime
   after Synvera authority lock is active.
   ============================================================ */

(function () {

  if (window.__SYNVERA_SEEK_ROUTER__) return;
  window.__SYNVERA_SEEK_ROUTER__ = true;

  const log = (...a) => console.log("[Synvera] Seek router", ...a);

  function protectPlayer(player) {
    if (!player) return;

    try {
      const desc = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(player),
        "currentTime"
      );

      // Already protected
      if (!desc || desc.configurable === false) {
        log("player already protected");
        return;
      }

      Object.defineProperty(player, "currentTime", {
        configurable: false,
        enumerable: true,

        get() {
          return desc.get.call(this);
        },

        set(v) {
          // Only host authority may write time
          if (window.__SYNVERA_IS_HOST__) {
            desc.set.call(this, v);
          } else {
            log("blocked legacy time write (viewer)");
          }
        }
      });

      log("authority lock applied");

    } catch (e) {
      console.warn("[Synvera] seek-router lock skipped:", e.message);
    }
  }

  function attachWhenReady() {
    const video =
      document.querySelector("video") ||
      document.querySelector("canvas");

    if (!video) {
      requestAnimationFrame(attachWhenReady);
      return;
    }

    protectPlayer(video);
  }

  attachWhenReady();

})();