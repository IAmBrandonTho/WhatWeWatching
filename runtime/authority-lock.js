/* Synvera Authority Lock
   Centralizes playback actions
*/

(function () {

  if (!window.Synvera) return;

  window.Synvera.authority = {
    allow(action) {
      // phase 1: allow all
      return true;
    }
  };

  // monitor requests passing through gateway
  const original = window.Synvera.requestTimeChange;

  window.Synvera.requestTimeChange = function (value, source) {

    if (!window.Synvera.authority.allow("seek")) {
      console.warn("[Synvera] Seek blocked");
      return;
    }

    return original(value, source);
  };

  console.log("[Synvera] Authority lock ready");

})();