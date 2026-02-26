/* Synvera Playback Router
   Central routing for playback actions
   Phase 1: mirror-only (no blocking)
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;
  const player = window.Synvera.player;

  if (!bus || !player) return;

  window.Synvera.playback = {

    play(source = "unknown") {
      bus.emit("playback:request", {
        action: "play",
        source
      });

      player.play();
    },

    pause(source = "unknown") {
      bus.emit("playback:request", {
        action: "pause",
        source
      });

      player.pause();
    },

    seek(time, source = "unknown") {
      bus.emit("playback:request", {
        action: "seek",
        time,
        source
      });

      player.seek(time);
    }

  };

  console.log("[Synvera] Playback router ready");

})();