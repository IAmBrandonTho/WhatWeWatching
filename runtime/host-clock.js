/* Synvera Host Clock
   Observes real playback time
*/

(function () {

  if (!window.Synvera) return;

  function findVideo() {
    return document.querySelector("video");
  }

  function attach(video) {
    if (!video || video.__synveraClock) return;
    video.__synveraClock = true;

    console.log("[Synvera] Host clock attached");

    const tick = () => {

      // only host publishes authority
      if (window.Synvera.role !== "host") return;

      const t = video.currentTime || 0;
      const d = video.duration || 0;
      const paused = video.paused;

      window.Synvera.bus.emit("host:time", {
        time: t,
        duration: d,
        paused
      });
    };

    video.addEventListener("timeupdate", tick);
    video.addEventListener("play", tick);
    video.addEventListener("pause", tick);
    video.addEventListener("seeking", tick);

    setInterval(tick, 500);
  }

  const observer = new MutationObserver(() => {
    const v = findVideo();
    if (v) attach(v);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();