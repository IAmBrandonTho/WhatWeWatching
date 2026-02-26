/* ============================================================
   Synvera Legacy Neutralizer
   ------------------------------------------------------------
   Disables Index8 correction behaviors without removing code
   ============================================================ */

(function () {

  if (window.__SYNVERA_NEUTRALIZER__) return;
  window.__SYNVERA_NEUTRALIZER__ = true;

  const log = (...a)=>console.log("[Synvera] Neutralizer:", ...a);

  function noop(){}

  // Wait until app.v5 attaches its globals
  const wait = setInterval(()=>{

    const v = document.querySelector("video");
    if(!v) return;

    try {

      // Prevent legacy viewer correction
      v.__pwApplyCtrl = noop;
      v.__pwHostSeekTo = noop;

      // Prevent legacy drift fixes
      v.__pwSync = noop;

      log("legacy viewer correction neutralized");

      clearInterval(wait);

    } catch(e){}

  },100);

})();