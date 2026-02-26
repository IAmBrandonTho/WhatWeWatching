/* Synvera Playback State
   Publishes clean playback state events
*/

(function () {

  if (!window.Synvera) return;

  function attach(video) {
    if (!video || video.__synveraState) return;
    video.__synveraState = true;

    console.log("[Synvera] Playback state tracking active");

    function emit(state) {
      window.Synvera.bus.emit("host:state", state);
    }

    video.addEventListener("play", () => emit("playing"));
    video.addEventListener("pause", () => emit("paused"));
    video.addEventListener("seeking", () => emit("seeking"));
    video.addEventListener("ended", () => emit("ended"));
  }

  const observer = new MutationObserver(() => {
    const v = document.querySelector("video");
    if (v) attach(v);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();