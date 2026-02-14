/* Minimal polyfills / safe fallbacks for 'most browsers'.
   Keep this file tiny to avoid masking real runtime issues. */

(function () {
  // crypto.randomUUID fallback (not cryptographically perfect, but good enough for client IDs)
  if (typeof crypto !== "undefined" && !crypto.randomUUID) {
    crypto.randomUUID = function () {
      var d = new Date().getTime();
      var d2 = (typeof performance !== "undefined" && performance.now && (performance.now() * 1000)) || 0;
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    };
  }

  // requestIdleCallback fallback (used occasionally by some apps; safe no-op scheduling)
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function (cb) {
      return setTimeout(function () {
        cb({ didTimeout: false, timeRemaining: function () { return 0; } });
      }, 1);
    };
    window.cancelIdleCallback = function (id) { clearTimeout(id); };
  }
})();

