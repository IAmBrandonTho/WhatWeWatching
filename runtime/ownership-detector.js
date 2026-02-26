/* Synvera Ownership Detector
   Watches for host ↔ viewer transitions
*/

(function () {

  if (!window.Synvera) return;

  let lastRole = null;

  function check() {
    const role = window.Synvera.role || "unknown";

    if (role !== lastRole) {
      console.log("[Synvera] Ownership state:", role);
      window.Synvera.roomOwner = role === "host";
      lastRole = role;
    }

    requestAnimationFrame(check);
  }

  check();

})();