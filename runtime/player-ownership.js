/* ============================================================
   Synvera Player Ownership
   ------------------------------------------------------------
   Claims video element before legacy systems attach
   ============================================================ */

(function(){

  if (window.__SYNVERA_PLAYER_OWNER__) return;
  window.__SYNVERA_PLAYER_OWNER__ = true;

  const log = (...a)=>console.log("[Synvera] Player ownership:", ...a);

  const wait = setInterval(()=>{

    const v = document.querySelector("video");
    if(!v) return;

    if(v.__SYNVERA_OWNED__) {
      clearInterval(wait);
      return;
    }

    v.__SYNVERA_OWNED__ = true;

    // Mark as externally controlled
    Object.defineProperty(v,"__pwExternalClock",{
      value:true,
      configurable:false,
      writable:false
    });

    log("video element claimed");

    clearInterval(wait);

  },50);

})();