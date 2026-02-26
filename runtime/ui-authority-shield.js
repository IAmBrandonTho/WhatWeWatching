/* Synvera UI Authority Shield
   Prevents UI reactions from re-triggering playback loops
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastIntentStamp = 0;

  // mark intentional user actions
  document.addEventListener("pointerdown", () => {
    lastIntentStamp = performance.now();
  }, true);

  bus.on("playback:request", (req) => {

    const now = performance.now();

    // tag whether action was human initiated
    req.human =
      (now - lastIntentStamp) < 500;

  });

  console.log("[Synvera] UI authority shield active");

})();