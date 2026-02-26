/* ============================================================
   Synvera Bootstrap (Legacy Disabled)
   ------------------------------------------------------------
   Index8 bootstrap is now retired.
   Synvera core handles initialization.
   ============================================================ */

(function () {

  if (window.__SYNVERA_BOOTSTRAP__) return;
  window.__SYNVERA_BOOTSTRAP__ = true;

  console.log("[Synvera] Bootstrap layer active (legacy disabled)");

  /*
    OLD BEHAVIOR REMOVED:
    - legacy startup sequencing
    - inline dependency ordering
    - numeric boot stages (source of '5 is not defined')
    - Index8 mutation boot logic

    Synvera runtime now owns startup.
  */
);

})();