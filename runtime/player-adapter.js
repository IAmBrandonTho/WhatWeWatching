/* Synvera Player Adapter
   Provides stable access to the real player
*/

(function () {

  if (!window.Synvera) return;

  function getVideo() {
    return document.querySelector("video");
  }

  window.Synvera.player = {

    get element() {
      return getVideo();
    },

    play() {
      const v = getVideo();
      if (v) v.play();
    },

    pause() {
      const v = getVideo();
      if (v) v.pause();
    },

    seek(time) {
      const v = getVideo();
      if (v) v.currentTime = time;
    }

  };

  console.log("[Synvera] Player adapter ready");

})();