/* Synvera Session State
   Central playback snapshot
*/

(function () {

  if (!window.Synvera) return;

  window.Synvera.session = {
    time: 0,
    duration: 0,
    paused: true,
    state: "paused"
  };

  window.Synvera.bus.on("host:time", (data) => {
    Object.assign(window.Synvera.session, {
      time: data.time,
      duration: data.duration,
      paused: data.paused
    });
  });

  window.Synvera.bus.on("host:state", (state) => {
    window.Synvera.session.state = state;
  });

  console.log("[Synvera] Session state active");

})();