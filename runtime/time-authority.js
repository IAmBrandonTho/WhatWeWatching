/* Synvera Soft Time Authority
   Phase 1 — routes time writes through one place
   DOES NOT block legacy behavior
*/

(function () {

  if (!window.Synvera) return;
  if (window.Synvera.timeAuthorityAttached) return;

  window.Synvera.timeAuthorityAttached = true;

  window.Synvera.requestTimeChange = function (video, value, source = "unknown") {
    console.log("[Synvera] Time authority request:", source, value);

    // For now we allow everything
    video.__synveraOriginalSetTime(value);
  };

  function attach(video) {
    if (!video || video.__synveraAuthorityHook) return;
    video.__synveraAuthorityHook = true;

    const desc = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "currentTime"
    );

    video.__synveraOriginalSetTime = (v) => {
      desc.set.call(video, v);
    };

    Object.defineProperty(video, "currentTime", {
      get() {
        return desc.get.call(this);
      },
      set(value) {
        window.Synvera.requestTimeChange(
          video,
          value,
          "legacy-writer"
        );
      }
    });

    console.log("[Synvera] Time authority active");
  }

  function wait() {
    const video = document.querySelector("video");
    if (video) attach(video);
    else requestAnimationFrame(wait);
  }

  wait();

})();