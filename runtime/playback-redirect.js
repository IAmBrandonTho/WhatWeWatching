/* Synvera Playback Redirect
   Legacy playback now flows through Synvera first
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;
  const player = window.Synvera.player;

  if (!bus || !player) return;

  let redirecting = false;

  bus.on("playback:request", (req) => {

    // prevent recursion
    if (redirecting) return;

    redirecting = true;

    try {

      if (req.action === "play") {
        player.play();
      }

      if (req.action === "pause") {
        player.pause();
      }

      if (req.action === "seek" && typeof req.time === "number") {
        player.seek(req.time);
      }

    } finally {
      redirecting = false;
    }

  });

  console.log("[Synvera] Playback redirect active");

})();