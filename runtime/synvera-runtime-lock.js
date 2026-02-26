/* ============================================================
   Synvera — Runtime Lock (Finalized)
   ------------------------------------------------------------
   Purpose:
   Allow Synvera protection while safely ignoring
   legacy mutation attempts from Index8/app.v5.
   ============================================================ */

(function () {

  if (window.__SYNVERA_RUNTIME_LOCK__) return;
  window.__SYNVERA_RUNTIME_LOCK__ = true;

  const log = (...a) => console.log("[Synvera] Runtime lock", ...a);

  function safeFreeze(obj) {
    if (!obj || typeof obj !== "object") return obj;

    try {
      if (!Object.isExtensible(obj)) return obj;

      Object.preventExtensions(obj);
    } catch (_) {}

    return obj;
  }

  /* ----------------------------------
     Protect critical globals
  ---------------------------------- */

  const targets = [
    window.HTMLMediaElement?.prototype,
    window.HTMLVideoElement?.prototype,
    window
  ];

  targets.forEach(t => safeFreeze(t));

  /* ----------------------------------
     Legacy compatibility layer
     (prevents crash when old code tries
     to attach __locked or similar flags)
  ---------------------------------- */

  const originalDefine = Object.defineProperty;

  Object.defineProperty = function (obj, prop, desc) {

    try {
      if (!Object.isExtensible(obj)) {
        // silently ignore legacy writes
        return obj;
      }

      return originalDefine(obj, prop, desc);

    } catch (_) {
      return obj;
    }
  };

  log("active (compatibility mode)");

})();