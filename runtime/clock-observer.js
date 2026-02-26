/* Synvera Clock Observer — Phase 1
   SAFE: Observes playback without modifying it
   Purpose: Prepare host-authority runtime layer
*/

(function () {

  if (!window.Synvera) return;
  if (window.Synvera.clockObserverAttached) return;

  window.Synvera.clockObserverAttached = true;

  function findVideo() {
    return document.querySelector('video');
  }

  function attach(video) {
    if (!video || video.__synveraClockAttached) return;

    video.__synveraClockAttached = true;

    const state = {
      lastTime: 0,
      lastUpdate: performance.now()
    };

    function update() {
      state.lastTime = video.currentTime;
      state.lastUpdate = performance.now();

      // store for future runtime use
      window.Synvera.clock = {
        time: state.lastTime,
        playing: !video.paused,
        rate: video.playbackRate,
        updatedAt: state.lastUpdate
      };
    }

    video.addEventListener('play', update);
    video.addEventListener('pause', update);
    video.addEventListener('ratechange', update);
    video.addEventListener('seeked', update);
    video.addEventListener('timeupdate', update);

    update();

    console.log("[Synvera] Clock observer attached");
  }

  function waitForVideo() {
    const video = findVideo();
    if (video) {
      attach(video);
    } else {
      requestAnimationFrame(waitForVideo);
    }
  }

  waitForVideo();

})();