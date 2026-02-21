/*
  SAFE HEADER GUARD
  - Runs a few times after load
  - NO MutationObserver (prevents freeze)
  - Never clones/replaces nodes
  - Enforces topbar order: Host, Viewer, Share, Disconnect, Connected pill
*/
(function(){
  function fixHeader(){
    const host = document.getElementById('btnHost');
    const viewer = document.getElementById('btnViewer');
    const share = document.getElementById('btnShare');
    const disconnect = document.getElementById('btnDisconnect');
    const statusPill = document.getElementById('statusPill');
    if(!host || !viewer || !share) return;

    const row = host.closest('.row');
    if(!row) return;

    [host, viewer, share, disconnect, statusPill].forEach(el=>{
      if(!el) return;
      // Keep buttons/pill visible
      el.style.display = '';
      el.hidden = false;
      el.removeAttribute('aria-hidden');
    });

    // enforce order without replacing nodes
    ;[host, viewer, share, disconnect, statusPill].forEach(el=>{
      if(el && el.parentNode === row){
        row.appendChild(el);
      }
    });
  }

  // run a few times only (prevents infinite loops)
  let runs = 0;
  function schedule(){
    if(runs++ > 8) return;
    fixHeader();
    requestAnimationFrame(schedule);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  } else {
    schedule();
  }
})();


