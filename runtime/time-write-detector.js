/* Synvera Unified Time Gateway
   Replaces detector + authority safely
   - logs time writes
   - routes all writes through one place
   - DOES NOT change behavior yet
*/

(function () {

  if (!window.Synvera) return;
  if (window.Synvera.timeGatewayAttached) return;

  window.Synvera.timeGatewayAttached = true;

  function attach(video) {
    if (!video || video.__synveraGatewayHook) return;
    video.__synveraGatewayHook = true;

    const desc = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "currentTime"
    );

    if (!desc || !desc.set) {
      console.warn("[Synvera] Unable to hook currentTime");
      return;
    }

    // store original setter once
    const originalSetter = (v) => desc.set.call(video, v);

    // public gateway (future authority point)
window.Synvera.requestTimeChange = function (
  value,
  source = "legacy"
) {

  const role = window.Synvera.role || "unknown";

  if (role === "viewer") {
    console.log("[Synvera] Viewer attempted time change:", value);
  } else if (role === "host") {
    console.log("[Synvera] Host time update:", value);
  } else {
    console.log("[Synvera] Time request (unknown role):", value);
  }

  // still allow everything (no behavior change yet)
  originalSetter(value);
};

    Object.defineProperty(video, "currentTime", {
      get() {
        return desc.get.call(this);
      },
      set(value) {
        const stack =
          new Error().stack.split("\n")[2]?.trim() || "unknown";

        console.log(
          "[Synvera] Time write detected:",
          value,
          stack
        );

        window.Synvera.requestTimeChange(
          value,
          "legacy-writer"
        );
      }
    });

    console.log("[Synvera] Unified time gateway active");
  }

  function waitForVideo() {
    const video = document.querySelector("video");
    if (video) attach(video);
    else requestAnimationFrame(waitForVideo);
  }

  waitForVideo();

})();