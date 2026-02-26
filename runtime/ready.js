/* Synvera Runtime Ready Gate — Phase 1.5
   Purpose:
   Establish a single stable "app ready" signal
   WITHOUT modifying Index8 behavior.
*/

(function () {

  if (!window.Synvera) return;

  let ready = false;
  const listeners = [];

  function fireReady() {
    if (ready) return;
    ready = true;

    console.log("[Synvera] Runtime ready");

    listeners.forEach(fn => {
      try { fn(); } catch(e){ console.error(e); }
    });

    listeners.length = 0;
  }

  // expose API
  window.Synvera.onReady = function (fn) {
    if (ready) fn();
    else listeners.push(fn);
  };

  // We consider app ready when DOM + video element exist
  function check() {
    const v = document.getElementById("video");
    if (document.readyState !== "loading" && v) {
      fireReady();
    }
  }

  document.addEventListener("DOMContentLoaded", check);
  window.addEventListener("load", check);

  // fallback polling (safe)
  const t = setInterval(() => {
    if (ready) return clearInterval(t);
    check();
  }, 250);

})();