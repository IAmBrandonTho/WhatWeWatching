// Synvera — Seek Intent Detector
// Converts legacy currentTime writes into authorized host actions

(function () {

  if (window.__synveraSeekIntentInstalled) return;
  window.__synveraSeekIntentInstalled = true;

  console.log("[Synvera] Seek router attached (authority mode)");

  function isHost() {
    return window.synveraRole === "host" ||
           document.body?.dataset?.role === "host";
  }

function attach(video) {

  if (!video) return;

  // another layer already owns currentTime
  if (video.__synveraSeekHooked ||
      Object.getOwnPropertyDescriptor(video, "currentTime")) {
    return;
  }

  video.__synveraSeekHooked = true;

    const proto = Object.getPrototypeOf(video);
    const desc = Object.getOwnPropertyDescriptor(proto, "currentTime");

    if (!desc || !desc.set) return;

    Object.defineProperty(video, "currentTime", {
      configurable: true,

      get() {
        return desc.get.call(this);
      },

      set(value) {

        // VIEWER → never allowed to seek
        if (!isHost()) {
          console.log("[Synvera] Viewer attempted seek → blocked");
          return;
        }

        // HOST → route through authority gateway
        if (window.Synvera?.requestTimeChange) {
          console.log("[Synvera] Host authorized seek:", value);
          window.Synvera.requestTimeChange(value, "human-seek");
          return;
        }

        // fallback (early boot only)
        desc.set.call(this, value);
      }
    });
  }

  function watch() {
    const video = document.querySelector("video");
    if (video) attach(video);
  }

  // initial attempt
  watch();

  // watch DOM for player recreation
  const mo = new MutationObserver(watch);
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

})();