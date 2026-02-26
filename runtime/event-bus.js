/* Synvera Event Bus
   Neutral communication layer
*/

(function () {

  if (!window.Synvera) return;
  if (window.Synvera.bus) return;

  const listeners = {};

  window.Synvera.bus = {

    on(event, fn) {
      (listeners[event] ||= []).push(fn);
    },

    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] =
        listeners[event].filter(f => f !== fn);
    },

    emit(event, data) {
      if (!listeners[event]) return;
      for (const fn of listeners[event]) {
        try { fn(data); }
        catch (e) {
          console.warn("[Synvera] bus error", e);
        }
      }
    }

  };

  console.log("[Synvera] Event bus ready");

})();