/* Synvera Authority Preference
   Host clock becomes preferred timing source
*/

(function () {

  if (!window.Synvera) return;

  const bus = window.Synvera.bus;

  let lastHostUpdate = 0;

  // track real host authority
  bus.on("host:time", () => {
    lastHostUpdate = performance.now();
  });

  // intercept filtered time before others react
  bus.on("time:filtered", (time) => {

    const now = performance.now();

    // if host recently updated, ignore legacy influence
    if (now - lastHostUpdate < 500) {
      window.Synvera.session.time = time;
    }

  });

  console.log("[Synvera] Authority preference active");

})();