/* Synvera Behavioral Role Detector
   Determines role from authority behavior
*/

(function () {

  if (!window.Synvera) return;

  let lastWrite = 0;

  const WRITE_WINDOW = 2000; // ms

  function evaluateRole() {
    const now = performance.now();

    const role =
      (now - lastWrite) < WRITE_WINDOW
        ? "host"
        : "viewer";

    if (window.Synvera.role !== role) {
      window.Synvera.role = role;
      console.log("[Synvera] Role detected:", role);
    }

    requestAnimationFrame(evaluateRole);
  }

  // hook into gateway
  const originalRequest = window.Synvera.requestTimeChange;

  window.Synvera.requestTimeChange = function (value, source) {
    lastWrite = performance.now();
    originalRequest(value, source);
  };

  evaluateRole();

})();