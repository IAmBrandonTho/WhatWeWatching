/* Synvera Legacy Time Guard
   Reduces repeated legacy time reactions
*/

(function () {

  if (!window.Synvera) return;

  const videoGetter = () => window.Synvera.player?.element;

  let lastEmit = 0;
  let lastTime = -1;

  function monitor() {

    const video = videoGetter();
    if (!video) {
      requestAnimationFrame(monitor);
      return;
    }

    const t = video.currentTime;
    const now = performance.now();

    // ignore micro changes triggering legacy listeners
    if (
      Math.abs(t - lastTime) < 0.015 &&
      now - lastEmit < 50
    ) {
      requestAnimationFrame(monitor);
      return;
    }

    lastTime = t;
    lastEmit = now;

    requestAnimationFrame(monitor);
  }

  monitor();

  console.log("[Synvera] Legacy time guard active");

})();