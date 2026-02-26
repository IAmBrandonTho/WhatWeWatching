/* Synvera Time Filter
   Prevents duplicate time updates
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastTime = -1;
  let lastStamp = 0;

  bus.on("host:time", (time) => {

    const now = performance.now();

    // ignore identical or ultra-rapid updates
    if (
      Math.abs(time - lastTime) < 0.01 &&
      now - lastStamp < 40
    ) {
      return;
    }

    lastTime = time;
    lastStamp = now;

    bus.emit("time:filtered", time);
  });

  console.log("[Synvera] Time filter active");

})();