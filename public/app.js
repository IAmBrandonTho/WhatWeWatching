// Extracted from the original self-contained index.html
// Runs as a classic (non-module) script for broad compatibility.

window.addEventListener('DOMContentLoaded', () => {
  "use strict";

  // -----------------------------
  // Utilities
  // -----------------------------
  const $ = (sel) => document.querySelector(sel);
  const safeParseJSON = (s, fallback) => {
    try { return JSON.parse(s); } catch { return fallback; }
  };

  const logEl = $("#log");
  const toastEl = $("#toast");
  const chatTitleEl = $("#chatTitle");

  // Hardened event binding: avoids 'Cannot read properties of null' if DOM changes.
  const on = (el, ev, fn, opts) => {
    if(!el) { try{ addLog(`Missing element for event: ${ev}`, 'err'); } catch {} return false; }
    el.addEventListener(ev, fn, opts);
    return true;
  };

  // Surface runtime errors in the on-page log so issues don't silently break all controls.
  window.addEventListener('error', (e)=>{
    try{
      // Many browsers report cross-origin script failures as the unhelpful literal "Script error."
      // Avoid spamming the UI (e.g. on repeated key events) while still surfacing actionable info.
      const msg = e && e.message ? String(e.message) : '';
      const fname = e && e.filename ? String(e.filename) : '';
      const lineno = (e && typeof e.lineno === 'number') ? e.lineno : null;
      const colno = (e && typeof e.colno === 'number') ? e.colno : null;

      if(msg === 'Script error.' && !fname && (lineno === null || lineno === 0)){
        window.__scriptErrorOnce = window.__scriptErrorOnce || 0;
        if(window.__scriptErrorOnce++ === 0){
          addLog('JS error: Script error. (Cross-origin script threw or failed to load; open DevTools Console/Network for details.)', 'err');
        }
        return;
      }
      addLog(`JS error: ${msg}${fname ? ` @ ${fname}:${lineno ?? ''}:${colno ?? ''}` : ''}`, 'err');
    }catch{}
  });
  window.addEventListener('unhandledrejection', (e)=>{
    try{ addLog(`Promise rejection: ${e.reason?.message || e.reason}`, 'err'); }catch{}
  });

  function now(){ return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}); }
  function addLog(msg, type="t"){
    const div = document.createElement('div');
    div.innerHTML = `<span class="t">[${now()}]</span> ${escapeHtml(msg)}`;
    if(type === "sys") div.classList.add('line-sys');
    if(type === "me") div.classList.add('line-me');
    if(type === "err") div.classList.add('line-err');
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function addChatLine(from, textMsg, who="t", fromId=null){
    const div = document.createElement('div');
    div.classList.add('chatLine');
    if(fromId) div.dataset.clientId = String(fromId);

    const tSpan = document.createElement('span');
    tSpan.className = 't';
    tSpan.textContent = `[${now()}] `;
    div.appendChild(tSpan);

    const strong = document.createElement('strong');
    strong.className = 'chatName';
    strong.textContent = `${String(from || 'Friend').trim()}: `;
    div.appendChild(strong);

    const msgSpan = document.createElement('span');
    msgSpan.textContent = String(textMsg ?? '');
    div.appendChild(msgSpan);

    if(who === "sys") div.classList.add('line-sys');
    if(who === "me") div.classList.add('line-me');
    if(who === "err") div.classList.add('line-err');

    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function toast(msg){
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(()=> toastEl.style.display='none', 1800);
  }
  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function clampStr(s, maxLen){
    const t = String(s ?? '').trim();
    return t.length > maxLen ? t.slice(0, maxLen) : t;
  }

  // Like clampStr, but does NOT trim whitespace (so inputs can contain spaces while typing).
  function clampLenNoTrim(s, maxLen){
    const t = String(s ?? '');
    return t.length > maxLen ? t.slice(0, maxLen) : t;
  }
  async function copyToClipboard(text){
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(String(text ?? ''));
      }else{
        // Fallback for older browsers / insecure origins
        const ta = document.createElement('textarea');
        ta.value = String(text ?? '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast('Copied');
    }catch(err){
      addLog('Clipboard copy failed (try HTTPS): ' + (err?.message || err), 'err');
      toast('Copy failed');
    }
  }


  function fmtTime(sec){
    sec = Math.max(0, Number(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const mm = String(m).padStart(2,'0');
    const ss = String(s).padStart(2,'0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  let isScrubbing = false;

  // Viewer-side: last known authoritative host playback state.
  const hostAuthState = { paused: true, t: 0, rate: 1, updatedAt: 0 };
  let _applyingHostAuth = false;

  // Viewer-side: enforce host state (used when viewer tries to click controls).
  
function applyHostAuthoritativeState(forceSeekUI=false){
    if(mode !== 'viewer') return;
    if(_applyingHostAuth) return;
	    // If host state is stale, don't rubber-band the viewer (prevents jitter/bad seeks).
	    const fresh = (Date.now() - (hostAuthState.updatedAt || 0)) < 8000;
	    if(!fresh) return;
    _applyingHostAuth = true;
    try{
      try{ video.playbackRate = hostAuthState.rate || 1; }catch{}
      if(Number.isFinite(hostAuthState.t)){
        const dt = Math.abs((video.currentTime || 0) - hostAuthState.t);
	        // Allow small drift; the periodic sync loop handles fine-grain correction.
	        if(dt > 0.5) {
          try{ video.currentTime = hostAuthState.t; }catch{}
        }
      }
      if(hostAuthState.paused) {
        try{ video.pause(); }catch{}
      } else {
        try{ video.play().catch(()=>{}); }catch{}
      }
      if(forceSeekUI) syncSeekUIToVideo();
    } finally {
      _applyingHostAuth = false;
    }
  }

  function syncSeekUI(){
    if(!seek) return;
    const dur = Number(video.duration || 0);

    if(!isFinite(dur) || dur <= 0){
      if(timeCur) timeCur.textContent = '--:--';
      if(timeDur) timeDur.textContent = '--:--';
      paintRange(seek);
      return;
    }

    if(!isScrubbing){
      seek.value = String(Math.round((video.currentTime / dur) * Number(seek.max)));
      paintRange(seek);
    }
    if(timeCur) timeCur.textContent = fmtTime(video.currentTime);
    if(timeDur) timeDur.textContent = fmtTime(dur);
  }

  // Force the seek slider UI back to the actual video currentTime.
  // Used to "snap back" any viewer-side seek attempts.
  function syncSeekUIToVideo(){
    const was = isScrubbing;
    isScrubbing = false;
    syncSeekUI();
    isScrubbing = was;
  }

// -----------------------------
  // UI elements
  // -----------------------------
  const video = $("#video");

// Viewer: lock all media gestures/shortcuts (leave UI visible, but make it inert).
// We capture events to prevent browser-default media shortcuts from affecting playback.
const viewerBlockedKeys = new Set([
  " ", "Spacebar", "k", "K", "j", "J", "l", "L",
  "ArrowLeft", "ArrowRight",
  "Home", "End", "0","1","2","3","4","5","6","7","8","9"
]);

document.addEventListener("keydown", (e)=>{
  try{
    if(mode !== "viewer") return;
    if(e.ctrlKey || e.metaKey) return;
    if(e.key === "F5" || e.key === "F12") return;
    if(viewerBlockedKeys.has(e.key) || (e.code === "Space")){
      e.preventDefault();
      e.stopPropagation();
      applyHostAuthoritativeState(true);
    }
  }catch(err){
    try{ addLog(`Key handler error: ${err?.message || err}`, 'err'); }catch{}
    // Prevent bubbling into global error handler loops
    try{ e.preventDefault(); e.stopPropagation(); }catch{}
  }
}, true);

// Prevent "click-to-toggle" / seeking / rate changes from any native gesture paths.
on(video, "seeking", ()=>{ if(mode==="viewer") applyHostAuthoritativeState(true); }, {capture:true});

// Extra hard lock: block common pointer/touch/mouse gestures on the viewer side.
// Controls remain visible, but user gestures do nothing.
const viewerGestureBlock = (e)=>{
  if(mode !== "viewer") return;
  // Let volume slider work (handled elsewhere); block the rest.
  e.preventDefault();
  e.stopPropagation();
  applyHostAuthoritativeState(true);
};

// Capture phase prevents built-in <video> behaviors (double click fullscreen, etc.)
["pointerdown","pointerup","mousedown","mouseup","touchstart","touchend","dblclick","contextmenu","wheel"].forEach((ev)=>{
  video?.addEventListener(ev, viewerGestureBlock, { capture:true, passive:false });
});

// If the browser tries to seek/play/pause via native media UI/hardware keys, snap back.
["play","pause","seeking","seeked","ratechange"].forEach((ev)=>{
  video?.addEventListener(ev, ()=>{
    if(mode !== "viewer") return;
    if(_applyingHostAuth) return;
    // Small debounce: give host updates a moment to land
    applyHostAuthoritativeState(true);
  }, { capture:true });
});

on(video, "play", ()=>{ if(mode==="viewer") applyHostAuthoritativeState(true); }, {capture:true});
on(video, "pause", ()=>{ if(mode==="viewer") applyHostAuthoritativeState(true); }, {capture:true});
on(video, "ratechange", ()=>{ if(mode==="viewer") applyHostAuthoritativeState(true); }, {capture:true});
on(video, "contextmenu", (e)=>{ if(mode==="viewer"){ e.preventDefault(); e.stopPropagation(); } }, {capture:true});



  function syncPlayButtons(){
  if(!btnPlayPause) return;
  const playing = !video.paused;
  btnPlayPause.classList.toggle('isOn', playing);
  btnPlayPause.title = playing ? 'Pause (Space)' : 'Play (Space)';
  btnPlayPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}


  function paintRange(el){
    if(!el) return;
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const v = Number(el.value || 0);
    const pct = (v - min) / (max - min);
    const p = Math.max(0, Math.min(1, pct)) * 100;
    el.style.background = `linear-gradient(90deg, var(--accentA) 0%, var(--accentB) ${p}%, var(--trackBg) ${p}%)`;
  }

  function setRateLabel(){
    const txt = `${Number(video.playbackRate || 1).toFixed(2)}×`;
    if(rateVal) rateVal.textContent = txt;
    const rateLabel2 = $("#rateLabel2");
    if(rateLabel2) rateLabel2.textContent = txt;
  }

  function applyControlTheme(){
    const p = safeParseJSON(localStorage.getItem('peerwatch_prefs') || '{}', {});
    paintRange(seek);
    paintRange(vol);
    setRateLabel();

    // UI scale
    const usp = Number(p.uiScalePct ?? 100);
    if(uiScale) uiScale.value = String(usp);
    applyUiScale(usp, false);

    // Video messages (local)
    if('videoMessagesEnabled' in p) setVideoMessagesEnabled(!!p.videoMessagesEnabled, false);
    syncMuteIcon();
  }

  // Fullscreen controls show/hide
  let fsTimer = null;
  function showFsControls(){
    if(!document.fullscreenElement) return;
    if(!pwControls) return;
    pwControls.classList.add('show');
    clearTimeout(fsTimer);
    fsTimer = setTimeout(()=> pwControls.classList.remove('show'), 2200);
  }

  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('isFullscreen', !!document.fullscreenElement);
    // Show controls immediately when entering fullscreen
    if(document.fullscreenElement){
      showFsControls();
    }else{
      if(pwControls) pwControls.classList.remove('show');
    }
  });



  // -----------------------------
  // On-video chat messages overlay
  // -----------------------------
  let _vmActive = 0;
  let _vmHideT = null;
  let _vmLastShownAt = 0;
  let _vmLastNorm = '';
  let _vmLastNormAt = 0;

  function setVideoMessagesEnabled(enabled, doSave=true){
    videoMessagesEnabled = !!enabled;
    if(videoMsgsToggle) videoMsgsToggle.checked = videoMessagesEnabled;

    if(videoMsgOverlay){
      videoMsgOverlay.classList.toggle('on', videoMessagesEnabled);
    }
    if(!videoMessagesEnabled){
      clearTimeout(_vmHideT);
      _vmHideT = null;
      if(videoMsgA) videoMsgA.classList.remove('show');
      if(videoMsgB) videoMsgB.classList.remove('show');
    }

    if(doSave) savePrefs();
  }

  function updateVideoMsgMetrics(){
    // Use rendered video size so percentages match what the user sees
    const r = video?.getBoundingClientRect?.();
    const w = r?.width || stage?.clientWidth || 0;
    const h = r?.height || stage?.clientHeight || 0;
    if(!w || !h) return;

    const fontPx = Math.max(12, Math.min(72, h * 0.02));
    const topPx = Math.max(6, h * 0.03);
    const rightPx = Math.max(6, w * 0.03);

    const root = document.documentElement;
    root.style.setProperty('--vmFont', fontPx.toFixed(2) + 'px');
    root.style.setProperty('--vmTop', topPx.toFixed(2) + 'px');
    root.style.setProperty('--vmRight', rightPx.toFixed(2) + 'px');
  }

  function showVideoMessage(from, text){
    if(!videoMessagesEnabled) return;

    // 1s cooldown to prevent rapid spam
    const now = Date.now();
    if(now - _vmLastShownAt < 1000) return;

    // Basic spam filter: ignore repeated identical messages for a short window
    const norm = String(text ?? '')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
    if(!norm) return;
    if(norm === _vmLastNorm && (now - _vmLastNormAt) < 10000) return;

    _vmLastShownAt = now;
    _vmLastNorm = norm;
    _vmLastNormAt = now;

    const msg = `${String(from || 'Friend').trim()}: ${String(text ?? '')}`.trim();
    if(!msg) return;

    updateVideoMsgMetrics();

    const a = videoMsgA, b = videoMsgB;
    if(!a || !b) return;

    const next = (_vmActive === 0) ? b : a;
    const prev = (_vmActive === 0) ? a : b;

    // Crossfade: show new while fading out old
    prev.classList.remove('show');
    next.textContent = msg;
    next.classList.remove('show');

    // Force a layout flush so transitions reliably fire
    void next.offsetWidth;
    requestAnimationFrame(()=> next.classList.add('show'));

    _vmActive = (_vmActive === 0) ? 1 : 0;

    clearTimeout(_vmHideT);
    _vmHideT = setTimeout(()=>{
      next.classList.remove('show');
    }, 5000);
  }
  


  const stage = $("#stage");
  const overlay = $("#overlay");
  const subsOverlay = $("#subsOverlay");
  const videoMsgOverlay = $("#videoMsgOverlay");
  const videoMsgA = $("#videoMsgA");
  const videoMsgB = $("#videoMsgB");
  const videoMsgComposer = $("#videoMsgComposer");
  const videoMsgComposeInput = $("#videoMsgComposeInput");
  const videoMsgComposeSend = $("#videoMsgComposeSend");
  const videoMsgComposeCancel = $("#videoMsgComposeCancel");
  const dropHint = $("#dropHint");

  const roleLabel = $("#roleLabel");
  const netDot = $("#netDot");
  const netText = $("#netText");

  const btnHost = $("#btnHost");
  const btnViewer = $("#btnViewer");

  const btnPlayPause = $("#btnPlayPause");
  const btnStepBack = $("#btnStepBack");
  const btnStepFwd = $("#btnStepFwd");
  const btnRewind = $("#btnRewind");
  const btnFwd = $("#btnFwd");
  const btnSync = $("#btnSync");
  const btnMute = $("#btnMute");
  const vol = $("#vol");
  const btnVolDown = $("#btnVolDown");
  const btnVolUp = $("#btnVolUp");
  const btnRateDown2 = $("#btnRateDown2");
  const btnRateUp2 = $("#btnRateUp2");
  const uiScale = $("#uiScale");
  const uiScaleLabel = $("#uiScaleLabel");
  const videoMsgsToggle = $("#videoMsgsToggle");
  const audioSourceSelect = $("#audioSourceSelect");

  function applyUiScale(pct, doSave=true){
    const v = Math.max(70, Math.min(160, Number(pct)||100));
    document.documentElement.style.setProperty('--uiScale', String(v/100));
    if(uiScaleLabel) uiScaleLabel.textContent = v + '%';
    if(doSave) savePrefs();
  }
  on(uiScale,'input', ()=> applyUiScale(uiScale.value, true));
  on(uiScale,'change', ()=> applyUiScale(uiScale.value, true));

  on(videoMsgsToggle,'change', ()=> setVideoMessagesEnabled(!!videoMsgsToggle.checked, true));
  on(audioSourceSelect,'change', ()=>{
    const next = audioSourceSelect?.value === 'external' ? 'external' : 'video';
    audioMode = next;
    applyDesiredAudioState();
    applyAudioRouting();
    // Ensure the newly selected output is actually audible immediately (no extra mute toggle needed)
    if(next === 'video'){
      try{ if(!desiredMuted && Number(desiredVolume) > 0) video.muted = false; }catch{}
    }else{
      try{
        if(audioEl && audioEl.src){
          if(!desiredMuted && Number(desiredVolume) > 0) audioEl.muted = false;
          // If the video is currently playing, start external audio right away
          if(!video.paused) audioEl.play().catch(()=>{});
        }
      }catch{}
    }
    if(mode === 'host'){
      updateOutgoingStreamAndPeers();
      broadcastCtrl({type:'audioSrc', mode: audioMode});
    }
  });



  const seek = $("#seek");
  const timeCur = $("#timeCur");
  const timeDur = $("#timeDur");
  const playerShell = $("#playerShell");
  const rateVal = $("#rateVal");

  const btnFullscreen = $("#btnFullscreen");
  // NOTE: HTML id is "btnPiP" (capital i + P). Keep selector exact to avoid null + crashing init.
  const btnPip = $("#btnPiP");

  const displayName = $("#displayName");
  const roomName = $("#roomName");
  const roomNameRow = $("#roomNameRow");
  const playerTitle = $("#playerTitle");
  const themeSel = $("#themeSel");

  // Custom theme picker (fade + gray hover, avoids native select blue highlight)
  const themePicker = $("#themePicker");
  const themeBtn = $("#themeBtn");
  const themeBtnLabel = $("#themeBtnLabel");
  const themeMenu = $("#themeMenu");

  function syncThemePickerUI(){
    if(!themeBtnLabel || !themeMenu || !themeSel) return;
    const opt = themeSel.options[themeSel.selectedIndex];
    themeBtnLabel.textContent = opt ? opt.textContent : (themeSel.value || 'Theme');

    for(const el of Array.from(themeMenu.children)){
      const selected = el.dataset.value === themeSel.value;
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
    }
  }

  function closeThemeMenu(){
    if(!themePicker || !themeBtn) return;
    themePicker.classList.remove('open');
    themeBtn.setAttribute('aria-expanded','false');
  }
  function toggleThemeMenu(){
    if(!themePicker || !themeBtn) return;
    const willOpen = !themePicker.classList.contains('open');
    if(willOpen){
      themePicker.classList.add('open');
      themeBtn.setAttribute('aria-expanded','true');
    }else{
      closeThemeMenu();
    }
  }

  function initThemePicker(){
    if(!themeMenu || !themeSel) return;

    // Build menu from <select> options so it stays in sync if you add themes later
    themeMenu.innerHTML = "";
    for(const opt of Array.from(themeSel.options)){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pwSelectOpt';
      b.role = 'option';
      b.dataset.value = opt.value;
      b.textContent = opt.textContent;
      b.addEventListener('click', ()=>{
        themeSel.value = opt.value;
        themeSel.dispatchEvent(new Event('change', {bubbles:true}));
        closeThemeMenu();
      });
      themeMenu.appendChild(b);
    }

    themeBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      toggleThemeMenu();
    });

    // Close on outside click
    document.addEventListener('pointerdown', (e)=>{
      if(!themePicker) return;
      if(!themePicker.contains(e.target)) closeThemeMenu();
    });

    // Esc to close
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeThemeMenu();
    });

    syncThemePickerUI();
  }

  // Custom font picker (match Theme dropdown styling)
  function syncSubsFontPickerUI(){
    if(!subsFontBtnLabel || !subsFontMenu || !subsFontSelect) return;
    const opt = subsFontSelect.options[subsFontSelect.selectedIndex];
    subsFontBtnLabel.textContent = opt ? opt.textContent : 'Font';
    for(const el of Array.from(subsFontMenu.children)){
      const selected = el.dataset.value === subsFontSelect.value;
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
    }
  }

  function closeSubsFontMenu(){
    if(!subsFontPicker || !subsFontBtn) return;
    subsFontPicker.classList.remove('open');
    subsFontBtn.setAttribute('aria-expanded','false');
  }
  function toggleSubsFontMenu(){
    if(!subsFontPicker || !subsFontBtn) return;
    const willOpen = !subsFontPicker.classList.contains('open');
    if(willOpen){
      subsFontPicker.classList.add('open');
      subsFontBtn.setAttribute('aria-expanded','true');
    }else{
      closeSubsFontMenu();
    }
  }

  function initSubsFontPicker(){
    if(!subsFontMenu || !subsFontSelect) return;

    subsFontMenu.innerHTML = '';
    for(const opt of Array.from(subsFontSelect.options)){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pwSelectOpt';
      b.role = 'option';
      b.dataset.value = opt.value;
      b.textContent = opt.textContent;
      b.addEventListener('click', ()=>{
        subsFontSelect.value = opt.value;
        subsFontSelect.dispatchEvent(new Event('change', {bubbles:true}));
        syncSubsFontPickerUI();
        closeSubsFontMenu();
      });
      subsFontMenu.appendChild(b);
    }

    subsFontBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      toggleSubsFontMenu();
    });

    document.addEventListener('pointerdown', (e)=>{
      if(!subsFontPicker) return;
      if(!subsFontPicker.contains(e.target)) closeSubsFontMenu();
    });

    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeSubsFontMenu();
    });

    syncSubsFontPickerUI();
  }

  const btnLoad = $("#btnLoad");
  const btnLoadAudio = $("#btnLoadAudio");
  const audioPick = $("#audioPick");
  const audioEl = $("#audioEl");

  const btnLoadVtt = $("#btnLoadVtt");
  const btnToggleSubs = $("#btnToggleSubs");
  const subsTrackSel = $("#subsTrackSel");

  const btnSend = $("#btnSend");
  const chatMsg = $("#chatMsg");

  const btnSnapshot = $("#btnSnapshot");
  const btnStats = $("#btnStats");
  const btnDisconnect = $("#btnDisconnect");

  const btnShare = $("#btnShare");

  const roomCode = $("#roomCode");
  const btnNewRoom = $("#btnNewRoom");
  const joinRoomInput = $("#joinRoomInput");
  const btnJoinRoom = $("#btnJoinRoom");


// Join room input niceties:
// - Auto-format as "1234 5678" while still joining with raw 8 digits
// - Press Enter to join
function formatJoinRoomInput(){
  if(!joinRoomInput) return;
  const oldVal = String(joinRoomInput.value || '');
  const oldPos = joinRoomInput.selectionStart ?? oldVal.length;

  const digits = oldVal.replace(/\D/g,'').slice(0,8);
  const formatted = digits.length > 4 ? (digits.slice(0,4) + ' ' + digits.slice(4)) : digits;

  // How many digits were before the caret?
  const digitsBefore = oldVal.slice(0, oldPos).replace(/\D/g,'').length;
  // New caret position accounts for the inserted space after 4 digits
  const newPos = digitsBefore <= 4 ? digitsBefore : digitsBefore + 1;

  joinRoomInput.value = formatted;
  try{ joinRoomInput.setSelectionRange(newPos, newPos); }catch(_){}
}

if(joinRoomInput){
  on(joinRoomInput, 'input', formatJoinRoomInput);
  on(joinRoomInput, 'keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      btnJoinRoom?.click?.();
    }
  });
  on(joinRoomInput, 'focus', ()=>{ try{ joinRoomInput.select(); }catch(_){ } });
}


  const filePick = $("#filePick");
  const vttPick = $("#vttPick");

  const membersEl = $("#members");


  // Keep on-video message sizing/positioning in sync with video size
  on(window,'resize', updateVideoMsgMetrics);
  on(video,'loadedmetadata', updateVideoMsgMetrics);
  on(video,'loadeddata', updateVideoMsgMetrics);
  if(window.ResizeObserver && stage){
    try{
      const ro = new ResizeObserver(()=> updateVideoMsgMetrics());
      ro.observe(stage);
    }catch(_){}
  }

  // -----------------------------
  // State
  // -----------------------------
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  let mode = null; // 'host' | 'viewer'
  let localStream = null; // host video+audio
  
  let videoStream = null; // captureStream() from <video>
  let externalAudioStream = null; // captureStream() from <audio>
  let outgoingStream = null; // composed stream sent to peers

  // Track the current blob URL so we can revoke it when switching modes / loading a new file.
  let currentObjectUrl = null;

  function clearLocalMedia(){
    try{ video.pause(); }catch(_){}
    if(currentObjectUrl){
      try{ URL.revokeObjectURL(currentObjectUrl); }catch(_){}
      currentObjectUrl = null;
    }
    try{
      video.removeAttribute('src');
      video.srcObject = null;
      video.load();
    }catch(_){}
    videoStream = null;
    outgoingStream = null;
    localStream = null;
  }
  let audioMode = "video"; // "video" | "external"
  // Desired output volume/mute (applied to either video or external audio)
  let desiredVolume = 0.8;
  let desiredMuted = false;
let remoteStream = new MediaStream(); // viewer receives into this

  const subsBank = []; // {id, name, vtt, source:'host'|'local'|'remote'}
  let activeSubsId = null;

  let vttText = null;
  let subsEnabled = true;
  let currentTrack = null;

  // On-video chat messages (local preference)
  let videoMessagesEnabled = true;

  const peers = new Map(); // peerId => {pc, dc, name, role}
  let authoritativeHostPeerId = null; // viewer: which peer's host controls we accept
  let activePeerId = null; // for generating offer/answer in UI


  // -----------------------------
  // 1-click signaling via WebSocket
  // -----------------------------
  const LS_KEY = 'peerwatch_session_v2';
  const LS_ID_KEY = 'peerwatch_clientId';
  const getClientId = () => {
    let id = localStorage.getItem(LS_ID_KEY);
    if(!id){
      id = (crypto?.randomUUID?.() || ('c_' + Math.random().toString(16).slice(2) + Date.now().toString(16))).slice(0, 36);
      localStorage.setItem(LS_ID_KEY, id);
    }
    return id;
  };
  const clientId = getClientId();
  const LS_NAME_KEY = "www_display_name";
  const namesById = new Map();

  function setNameFor(id, name){
    if(!id) return;
    const nm = clampStr(name, 30) || "Friend";
    namesById.set(String(id), nm);
    // Update any existing chat lines authored by this id
    document.querySelectorAll(`.chatLine[data-client-id="${String(id)}"] .chatName`).forEach(el=>{
      el.textContent = `${nm}: `;
    });
  }

  function parseRoomFromUrl(){
    const u = new URL(location.href);
    // Prefer hash: #room=abc (keeps it out of server logs), then ?room=
    let room = '';
    if(u.hash && u.hash.includes('room=')){
      const m = u.hash.match(/room=([^&]+)/);
      room = m ? decodeURIComponent(m[1]) : '';
    }
    if(!room) room = u.searchParams.get('room') || '';
    room = clampStr(room, 64).replace(/[^a-zA-Z0-9_-]/g,'');
    return room;
  }
  function normalizeRoomId(r){
    // Keep ONLY digits; users often paste with spaces or dashes.
    r = String(r || '').replace(/\D/g,'').slice(0,8);
    return (r.length === 8) ? r : '';
  }

  function setRoomInAddressBar(roomId){
    try{
      const u = new URL(location.href);
      const rid = normalizeRoomId(roomId);
      if(rid){
        u.searchParams.set('room', rid);
      }else{
        u.searchParams.delete('room');
      }
      // Keep hash empty (we use ?room= for refresh-friendly join)
      u.hash = '';
      history.replaceState(null, '', u.toString());
    }catch(_){ }
  }

  function parseWsFromUrl(){
    const u = new URL(location.href);
    const w = u.searchParams.get('ws') || '';
    return w ? String(w) : '';
  }
  function makeRoomId(){
    // 8-digit numeric room id
    try{
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return String(a[0] % 100000000).padStart(8,'0');
    }catch(_){
      return String(Math.floor(Math.random()*100000000)).padStart(8,'0');
    }
  }

  // Signaling WebSocket endpoint
  // Override with:
  //   - ?ws=wss://... (or ws://...)
  //   - <meta name="signal-url" content="wss://...">
  const metaSignal = document.querySelector('meta[name="signal-url"]')?.getAttribute('content')?.trim();
  const DEFAULT_SIGNAL_URL = metaSignal || 'wss://whatwewatching-signal.lilbrandon2008.workers.dev';
  const SIGNAL_URL = parseWsFromUrl() || DEFAULT_SIGNAL_URL;

  function buildSignalWsUrl(base, roomId){
    const u = new URL(base.replace(/^ws/i,'http'));
    // If caller already provided a room in the URL, keep it
    if(!u.searchParams.get('room')) u.searchParams.set('room', roomId);
    return u.toString().replace(/^http/i,'ws');
  }

  let ws = null;
  let wsReady = false;
  let wsManualClose = false;
  let sessionRoomId = '';
  let hostIdInRoom = null;

  function saveSession(){
    const payload = {
      v: 2,
      at: Date.now(),
      role: mode || '',
      roomId: sessionRoomId || '',
      displayName: clampStr(displayName?.value || '', 30) || ''
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }
  function loadSession(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }catch{ return {}; }
  }

  function updateRoomUI(){
    const rid = sessionRoomId || '';
    if(roomCode){
      // Display as "XXXX XXXX" for readability, but keep the underlying room id normalized.
      roomCode.value = (rid && rid.length===8) ? (rid.slice(0,4) + ' ' + rid.slice(4)) : rid;
    }
    if(joinRoomInput){
      // Do not auto-overwrite the Join box; users may paste/keep a different room number.
    }
  }

  function wsSend(obj){
    if(!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(obj));
  }


  function closeSignaling(reason=''){
    // Gracefully close the signaling WebSocket and mark it as a manual close so
    // the onclose handler won't overwrite UI state unexpectedly.
    try{
      if(ws){
        wsManualClose = true;
        try{ ws.close(1000, clampStr(reason || 'close', 40)); }catch{ ws?.close?.(); }
      }
    }finally{
      wsReady = false;
      ws = null;
      wsManualClose = false;
    }
  }

  function connectSignaling(role, roomId){
    wsManualClose = false;
    sessionRoomId = roomId || '';
    if(!sessionRoomId) return;

    // Reset previous connection
    try{ wsManualClose = true; ws?.close?.(); }catch{}
    wsManualClose = false;
    ws = new WebSocket(buildSignalWsUrl(SIGNAL_URL, sessionRoomId));
    wsReady = false;

    ws.addEventListener('open', ()=>{
      wsReady = true;
      setStatus(true, 'Signaling connected');
      wsSend({
        type: 'hello',
        v: 1,
        roomId: sessionRoomId,
        role,
        clientId,
        name: clampStr(displayName?.value || localStorage.getItem(LS_NAME_KEY) || '', 30) || (role === 'host' ? 'Host' : 'Viewer')
      });
      saveSession();
      if(role === 'host') updateShareLinkUI();
    });

    ws.addEventListener('error', ()=>{
      wsReady = false;
      setStatus(false, 'Signaling error');
    });

    ws.addEventListener('close', (ev)=>{
      if(wsManualClose) return;

      wsReady = false;
      setStatus(false, 'Disconnected');
    });

    ws.addEventListener('message', async (ev)=>{
      let msg;
      try{ msg = JSON.parse(ev.data); }catch{ return; }

      if(msg.type === 'welcome'){
        hostIdInRoom = msg.hostId || hostIdInRoom;
        if(mode === 'viewer' && hostIdInRoom) authoritativeHostPeerId = hostIdInRoom;
        addLog(`Joined room ${sessionRoomId}`, 'sys');
        setNameFor(clientId, clampStr(displayName?.value || localStorage.getItem(LS_NAME_KEY) || '', 30) || (mode === 'host' ? 'Host' : 'Viewer'));
        renderMembersFromSignal(msg);
        return;
      }

      if(msg.type === 'peerlist'){
        renderMembersFromSignal(msg);
        return;
      }

      // WebSocket-relayed room title updates (works even with no active WebRTC peers)
      if(msg.type === 'room'){
        if(mode !== 'host'){
          currentRoomName = clampStr(msg.name, 30) || 'Room';
          syncRoomName(false);
          updateChatTitle(currentRoomName);
        }
        return;
      }

      // WebSocket-relayed chat (keeps chat alive even before WebRTC is established)
      if(msg.type === 'chat'){
        // The signaling server may echo the sender's message back to them.
        // We already render locally on send, so ignore our own echo.
        if(msg.clientId && String(msg.clientId) === String(clientId)) return;
        const from = clampStr(msg.from || 'Friend', 30);
        const text = String(msg.text ?? '');
        if(msg.clientId) setNameFor(msg.clientId, from);
        addChatLine(from, text, 't', msg.clientId || null);
        showVideoMessage(from, text);
        return;
      }

      if(msg.type === 'viewer-join' && mode === 'host'){
        // A viewer wants to connect. Create a dedicated peer connection for them and send offer.
        const vid = String(msg.viewerId || '');
        if(!vid) return;
        await hostCreateOfferForViewer(vid, msg.name || 'Viewer');
        return;
      }

      if(msg.type === 'offer' && mode === 'viewer'){
        await viewerHandleOffer(msg);
        return;
      }

      if(msg.type === 'answer' && mode === 'host'){
        await hostApplyAnswer(msg);
        return;
      }

      if(msg.type === 'peer-left'){
        const pid = String(msg.clientId || '');
        if(peers.has(pid)){
          try{ peers.get(pid).pc?.close?.(); }catch{}
          peers.delete(pid);
          renderMembers();
        }
        return;
      }
    });
  }

  function buildShareLink(){
    const u = new URL(location.href);
    u.searchParams.set('room', sessionRoomId);
    // Carry signaling endpoint only if overridden
    const wsOverride = parseWsFromUrl() || '';
    if(wsOverride) u.searchParams.set('ws', wsOverride);
    else u.searchParams.delete('ws');
    u.hash = '';
    return u.toString();
  }

  function updateShareLinkUI(){ /* removed */ }

  function renderMembersFromSignal(msg){
    // Reuse existing members UI, but keep it simple: host + viewers based on server peer list.
    if(!membersEl) return;
    membersEl.innerHTML = '';
    const arr = Array.isArray(msg.peers) ? msg.peers : [];
    for(const p of arr){
      if(p && p.id) setNameFor(p.id, p.name || (p.role === 'host' ? 'Host' : 'Viewer'));
      const el = document.createElement('div');
      el.className = 'member';
      el.textContent = (p.role === 'host' ? '👑 ' : '') + (p.name || (p.role === 'host' ? 'Host' : 'Viewer'));
      membersEl.appendChild(el);
    }
  }

  const RTC_CFG = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }
    ]
  };

  const MSG = {
    hello: "hello",
    chat: "chat",
    ctrl: "ctrl",
    vtt: "vtt",
    subsStyle: "subsStyle",
    ping: "ping",
    pong: "pong",
    members: "members",
    hostTaken: "hostTaken",
  };
  // Sync timers
  let reportTimer = null;


  let syncTimer = null;
  let lastPingAt = 0;
  let rttMs = null;

  // -----------------------------
  // Theme + prefs (FIXED)
  // -----------------------------
  function applyTheme(theme){
    document.documentElement.dataset.theme = theme || 'mono';
    // Refresh any derived CSS vars (e.g., sliders) after theme change
    syncAccentDerived();
  }

  
  function syncAccentDerived(){
    // Derive a harmonious accent gradient from the active theme accent.
    const cs = getComputedStyle(document.documentElement);
    const a = (cs.getPropertyValue('--accent') || '').trim();
    if(!a) return;

    const rgbA = toRGB(a) || {r:122,g:162,b:255};
    // Mix accent toward white a bit for the gradient end (prevents "random" yellow highlights).
    const rgbB = mix(rgbA, {r:255,g:255,b:255}, 0.35);

    document.documentElement.style.setProperty('--accentA', `rgb(${rgbA.r} ${rgbA.g} ${rgbA.b})`);
    document.documentElement.style.setProperty('--accentB', `rgb(${rgbB.r} ${rgbB.g} ${rgbB.b})`);
    document.documentElement.style.setProperty('--accentRGB', `${rgbA.r},${rgbA.g},${rgbA.b}`);
    document.documentElement.style.setProperty('--accentBRGB', `${rgbB.r},${rgbB.g},${rgbB.b}`);

    applyControlTheme();
  }


  function loadPrefs(){
    const p = safeParseJSON(localStorage.getItem('peerwatch_prefs') || '{}', {});
    displayName.value = (p.displayName || localStorage.getItem(LS_NAME_KEY) || '');
    if(roomName) roomName.value = p.roomName || '';

    const theme = p.theme || 'mono';
    themeSel.value = theme;
    applyTheme(theme);
    syncThemePickerUI();

    vol.value = (p.vol ?? 1);
    desiredVolume = Number(vol.value);
    video.volume = desiredVolume;

    desiredMuted = !!p.muted;
    video.muted = desiredMuted;
    applyDesiredAudioState();
const prefRate = (p.rate ?? 1);
    video.playbackRate = Number(prefRate);
    setRateLabel();

    // On-video chat messages toggle (default on)
    videoMessagesEnabled = (p.videoMessagesEnabled !== false);
    setVideoMessagesEnabled(videoMessagesEnabled, false);

    // Normalize missing keys so theme/name persist reliably
    savePrefs();
  }
  function savePrefs(){
    localStorage.setItem('peerwatch_prefs', JSON.stringify({
      displayName: clampStr(displayName.value, 30),
      roomName: clampStr(roomName?.value || '', 30),
      theme: themeSel.value,

      vol: Number(vol.value),
      muted: !!desiredMuted,
      rate: Number(video.playbackRate || 1),
      uiScalePct: Number(uiScale?.value || 100),
      videoMessagesEnabled: !!videoMessagesEnabled
    }));
  }

  themeSel.addEventListener('change', () => {
    applyTheme(themeSel.value);
    savePrefs();
    syncAccentDerived();
    toast('Theme: ' + themeSel.value);
    syncThemePickerUI();
  });

  window.addEventListener('beforeunload', savePrefs);

  displayName.addEventListener('input', () => {
    displayName.value = clampStr(displayName.value, 30);
    clearTimeout(displayName._debounceT);
    displayName._debounceT = setTimeout(() => {
      const nm = clampStr(displayName.value, 30) || (mode === 'host' ? 'Host' : 'Viewer');
      localStorage.setItem(LS_NAME_KEY, nm);
      setNameFor(clientId, nm);
      // Notify signaling so peer list updates + future chat uses new name
      if(wsReady){
        try{ ws.send(JSON.stringify({ type: "set-name", roomId: sessionRoomId, clientId, name: nm })); }catch{}
      }
    }, 5000);
  });

  if(roomName){
    roomName.addEventListener('input', () => {
      // Don't trim while typing (fixes the "can't type spaces" issue)
      roomName.value = clampLenNoTrim(roomName.value, 30);
      syncRoomName(false);

      // Debounce updates: 5 seconds after typing stops
      clearTimeout(roomName._debounceT);
      roomName._debounceT = setTimeout(() => {
        // Trim on commit
        const nm = clampStr(roomName.value, 30) || 'Room';
        // Keep input visually aligned with the committed value, but only after pause
        roomName.value = nm;
        syncRoomName(true);
        updateChatTitle(nm);

        // Relay over signaling so viewers see title changes even before WebRTC is up.
        if(mode === 'host' && wsReady){
          wsSend({type:'room', name: nm, roomId: sessionRoomId, clientId});
        }
        savePrefs();
      }, 5000);
      savePrefs();
    });
    roomName.addEventListener('change', () => {
      // On blur/enter, commit immediately
      roomName.value = clampStr(roomName.value, 30);
      const nm = roomName.value || 'Room';
      syncRoomName(true);
      updateChatTitle(nm);
      if(mode === 'host' && wsReady){
        wsSend({type:'room', name: nm, roomId: sessionRoomId, clientId});
      }
      savePrefs();
    });
  }

  // Clicking the "Player" title focuses Room Name (host only)
  on(playerTitle, 'click', ()=>{
    if(mode === 'host') roomName?.focus();
  });

  vol.addEventListener('input', () => {
    if(mode !== 'host'){
      // Viewers: lock to host-controlled volume
      try{ vol.value = String(desiredVolume); paintRange(vol); }catch(_){ }
      return;
    }
    desiredVolume = Number(vol.value);
    // Sliding volume implies unmute (matching prior behavior)
    desiredMuted = false;
    applyDesiredAudioState();
    // If using external audio and video is playing, ensure external audio is playing too
    try{
      if(audioMode === 'external' && audioEl && audioEl.src && !video.paused){
        if(audioEl.paused) audioEl.play().catch(()=>{});
      }
    }catch{}
    paintRange(vol);
    syncMuteIcon();
// Host volume is authoritative
savePrefs();
  });

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function mix(c1, c2, t){
    const cl = (n)=>Math.max(0, Math.min(255, Math.round(n)));
    return {
      r: cl(c1.r + (c2.r - c1.r) * t),
      g: cl(c1.g + (c2.g - c1.g) * t),
      b: cl(c1.b + (c2.b - c1.b) * t),
    };
  }

  function toRGB(str){
    if(!str) return null;
    const s = String(str).trim();

    // #rgb / #rrggbb
    let m = s.match(/^#([0-9a-f]{3})$/i);
    if(m){
      const h = m[1];
      return {
        r: parseInt(h[0]+h[0],16),
        g: parseInt(h[1]+h[1],16),
        b: parseInt(h[2]+h[2],16),
      };
    }
    m = s.match(/^#([0-9a-f]{6})$/i);
    if(m){
      const h = m[1];
      return {
        r: parseInt(h.slice(0,2),16),
        g: parseInt(h.slice(2,4),16),
        b: parseInt(h.slice(4,6),16),
      };
    }

    // rgb()/rgba()
    m = s.match(/^rgba?\(([^)]+)\)$/i);
    if(m){
      const parts = m[1].split(',').map(p=>p.trim()).filter(Boolean);
      if(parts.length >= 3){
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        if([r,g,b].every(n=>Number.isFinite(n))) return {r,g,b};
      }
    }
    return null;
  }


  function bumpVolume(delta){
    if(mode !== 'host') return;
    const v = clamp((Number(video.volume) || 0) + delta, 0, 1);
    if(v > 0) video.muted = false;
    video.volume = v;
    vol.value = String(v);
    paintRange(vol);
    syncMuteIcon();
// Host volume is authoritative
savePrefs();
  }

  on(btnVolDown, 'click', () => bumpVolume(-0.05));
  on(btnVolUp, 'click', () => bumpVolume(0.05));

  function setPlaybackRate(next){
    const r = clamp(Number(next || 1), 0.25, 2);
    // Snap to 0.05 steps
    const snapped = Math.round(r / 0.05) * 0.05;
    video.playbackRate = Number(snapped.toFixed(2));
    setRateLabel();
    syncSeekUI();
    syncPlayButtons();
    applyControlTheme();
    if(mode === 'host') broadcastCtrl({type:'rate', rate: video.playbackRate});
    savePrefs();
  }



  // Playback rate controls in the Player section
  on(btnRateDown2, 'click', () => setPlaybackRate((video.playbackRate || 1) - 0.05));
  on(btnRateUp2, 'click', () => setPlaybackRate((video.playbackRate || 1) + 0.05));


  function syncMuteIcon(){
  if(!btnMute) return;
  const muted = !!desiredMuted || Number(desiredVolume) === 0;
btnMute.classList.toggle('muted', muted);
  btnMute.classList.toggle('isOn', muted);
  btnMute.title = muted ? 'Unmute (M)' : 'Mute (M)';
  btnMute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
}

  if(btnMute){
    btnMute.addEventListener('click', () => {
      // Toggle desired mute; do not force source-specific side effects
      desiredMuted = !desiredMuted;
      if(!desiredMuted && Number(desiredVolume) === 0) desiredVolume = 0.8;
      applyDesiredAudioState();
vol.value = String(desiredVolume);
      paintRange(vol);
      syncMuteIcon();
savePrefs();
    });
  }


  // Seek bar (host drives)
  if(seek){
    seek.addEventListener('input', () => {
      isScrubbing = true;
      const dur = Number(video.duration || 0);
      if(!isFinite(dur) || dur <= 0) return;
      const t = (Number(seek.value) / Number(seek.max)) * dur;
      if(timeCur) timeCur.textContent = fmtTime(t);
      paintRange(seek);

      // Viewer: snap the seek bar back immediately (viewer has no seek control).
      if(mode !== 'host'){
        syncSeekUIToVideo();
      }
    });

    seek.addEventListener('change', () => {
      const dur = Number(video.duration || 0);
      isScrubbing = false;
      if(!isFinite(dur) || dur <= 0) return;
      const t = (Number(seek.value) / Number(seek.max)) * dur;

      if(mode === 'host'){
        video.currentTime = t;
        broadcastCtrl({type:'seek', t: video.currentTime, paused: video.paused});
      }else{
        // Viewer: snap back on release too.
        syncSeekUIToVideo();
      }
    });
  }

  // -----------------------------
  // Role management
  // -----------------------------

  function resetPlaybackPosition(){
    // Do not remember or restore playback position between hosting sessions.
    try{ video.pause(); }catch{}
    try{ video.currentTime = 0; }catch{}
  }


  // Default room name when none is provided
  let currentRoomName = 'Room';

  function updateChatTitle(name){
    if(!chatTitleEl) return;
    const base = clampStr(name || '', 30);
    chatTitleEl.textContent = base ? `${base} Chat` : 'Chat';
  }

  function syncRoomName(broadcast){
    // Host sets the room name; viewers display what host last sent.
    if(mode === 'host'){
      // While typing, don't trim whitespace (fixes the "can't type spaces" issue).
      currentRoomName = clampLenNoTrim(roomName?.value || '', 30) || 'Room';
      if(playerTitle) playerTitle.textContent = currentRoomName || 'Room';
      if(broadcast && mode === 'host') broadcastCtrl({type:'room', name: clampStr(currentRoomName, 30) || 'Room'});
    }else{
      if(playerTitle) playerTitle.textContent = currentRoomName || 'Room';
    }
  }
  function setStatus(ok, txt){
    netDot.className = 'dot' + (ok ? ' ok' : (txt==='Not connected' ? '' : ' bad'));
    netText.textContent = txt;
  }

  function setMode(newMode){
    const prevMode = mode;
    if(newMode === prevMode) return;
    // Single-host rule: if a host is already connected, don't allow becoming host.
    if(newMode === 'host'){
      for(const [pid, p] of peers.entries()){
        if(p?.role === 'host'){
          toast('A host is already active in this room. You are a Viewer.');
          newMode = 'viewer';
          authoritativeHostPeerId = pid;
          break;
        }
      }
    }
    if(newMode === 'viewer' && !authoritativeHostPeerId){
      for(const [pid, p] of peers.entries()){
        if(p?.role === 'host'){ authoritativeHostPeerId = pid; break; }
      }
    }
    if(newMode === 'host'){
      authoritativeHostPeerId = null;
    }
    mode = newMode;
    document.body.classList.toggle('isHost', mode === 'host');
    if(roleLabel) roleLabel.textContent = '';

    // Stronger glow on the active mode button
    try{ btnHost?.classList.toggle('activeMode', mode === 'host'); }catch{}
    try{ btnViewer?.classList.toggle('activeMode', mode === 'viewer'); }catch{}
    dropHint.innerHTML = mode === 'host'
      ? `Drop a video file here • You are the <b>Host</b>\n<div class="mini" style="margin-top:6px">Tip: Drop a .vtt subtitles file too</div>`
      : `Waiting for host stream…\n<div class="mini" style="margin-top:6px">Open a host link to auto-join</div>`;
    // Host-only buttons
    if(btnSync) btnSync.disabled = (mode !== 'host');
    if(btnLoad){ btnLoad.disabled = (mode !== 'host'); btnLoad.style.display = (mode === 'host') ? '' : 'none'; }


    const maybeDisable = [btnStepBack, btnStepFwd, btnRewind, btnFwd, seek];
    maybeDisable.forEach(b => b.disabled = (mode === 'viewer'));

    setStatus(false, 'Not connected');

    if(prevMode === 'host' && newMode === 'viewer'){
      clearLocalMedia();
    }

    disconnectAll();

    if(newMode === 'host'){
      const hasMedia = !!video.src || !!videoStream;
      if(!hasMedia) resetPlaybackPosition();
    }

    // Keep signaling connected in the current room so metadata/chat stay live
    // even when there is no active media stream yet.
    if(sessionRoomId){
      try{ ws?.close?.(); }catch{}
      ws = null; wsReady = false; hostIdInRoom = null;
      connectSignaling(mode, sessionRoomId);
    }

    if(mode === 'viewer'){
      video.srcObject = remoteStream;
      updateDropHintForMedia();
      video.controls = false;
      video.autoplay = true;
      // Allow autoplay in most browsers; user can unmute after playback starts.
      video.muted = true;
      showOverlay(true);
    } else {
      video.srcObject = null;
      video.controls = false;
      const hasMedia = !!video.src || !!videoStream;
      showOverlay(!hasMedia);
      updateDropHintForMedia();
    }

    updateSubsUiForRole();
    renderMembers();
  }

  on(btnHost,'click', ()=> setMode('host'));
  on(btnViewer,'click', ()=> setMode('viewer'));

  // Viewer: click video/stage to start playback/unmute if autoplay was blocked.
  on(video,'click', ()=>{
    if(mode !== 'viewer') return;
    if(video.muted){
      video.muted = false;
      toast('Unmuted');
    }
    video.play().catch(()=>{});
  });

  // -----------------------------
  // Drag & drop media
  // -----------------------------
  function showOverlay(show){ overlay.style.display = show ? 'flex' : 'none'; }

  function setDropHintVisible(show){
    try{ dropHint.style.display = show ? '' : 'none'; }catch(_){ }
  }
  function updateDropHintForMedia(){
    const hasMedia = !!video.srcObject || !!video.src;
    // If media is playing/available, never cover the video with the hint.
    if(hasMedia) setDropHintVisible(false);
    else setDropHintVisible(true);
  }

  on(stage,'dragover', (e)=>{ e.preventDefault(); stage.style.outline = '2px solid rgba(255,255,255,.35)'; });
  on(stage,'dragleave', ()=>{ stage.style.outline = 'none'; });

  on(stage,'drop', async (e)=>{
    e.preventDefault(); stage.style.outline = 'none';
    const files = [...(e.dataTransfer?.files || [])];
    if(!files.length) return;

    const vtt = files.find(f => {
      const n = (f.name || '').toLowerCase();
      return n.endsWith('.vtt') || n.endsWith('.srt');
    });
    const vid = files.find(f => (f.type || '').startsWith('video/'));

    if(vtt) await loadSubtitleFile(vtt);
    if(vid){
      if(mode !== 'host'){
        toast('Only host can load the video');
        return;
      }
      await loadVideoFile(vid);
    }
  });


  on(dropHint,'click', ()=>{ if(mode === 'host') filePick?.click(); });
  on(btnLoad,'click', ()=>{ if(mode === 'host') filePick?.click(); else toast('Only host can load the video'); });
  on(btnLoadAudio,'click', ()=>{ if(mode === 'host') audioPick?.click(); else toast('Only host can load audio'); });

  // Double-click the player to toggle fullscreen
  on(stage,'dblclick', (e)=>{
    if(e.button !== 0) return;
    btnFullscreen?.click();
  });
  on(filePick,'change', async () => {
    const f = filePick.files?.[0];
    if(!f) return;
    if(mode !== 'host') return toast('Only host can load video');
    await loadVideoFile(f);
  });

on(audioPick,'change', async () => {
  const f = audioPick.files?.[0];
  if(!f) return;
  if(mode !== 'host') return toast('Only host can load audio');
  if(!audioEl){
    addLog('Audio element missing.', 'err');
    return;
  }
  const url = URL.createObjectURL(f);
  audioEl.src = url;
  try{ audioEl.load(); }catch{}
  // Try to start aligned with the video
  try{ audioEl.currentTime = video.currentTime || 0; }catch{}
  try{ audioEl.playbackRate = video.playbackRate || 1; }catch{}
  try{ audioEl.volume = video.volume; }catch{}
  try{ audioEl.muted = video.muted; }catch{}
  // capture audio stream for WebRTC
  if(audioEl.captureStream){
    externalAudioStream = audioEl.captureStream();
  }else{
    addLog('Your browser does not support audio.captureStream(); external audio will be local-only.', 'warn');
    externalAudioStream = null;
  }
  toast('Audio loaded');
  addLog(`Loaded audio: ${f.name}`, 'sys');

  // Switch to external audio automatically
  if(audioSourceSelect){
    audioSourceSelect.value = 'external';
  }
  audioMode = 'external';
  applyAudioRouting();
  updateOutgoingStreamAndPeers();
  if(mode === 'host') broadcastCtrl({type:'audioSrc', mode: audioMode});
});


  async function loadVideoFile(file){
    try{
      try{ video.pause(); } catch{}
      if(currentObjectUrl){
        try{ URL.revokeObjectURL(currentObjectUrl); } catch{}
        currentObjectUrl = null;
      }
      // Show local preview immediately (host UX) while we segment/upload in background.
      try{
        currentObjectUrl = URL.createObjectURL(file);
        try{ video.srcObject = null; }catch{}
        video.src = currentObjectUrl;
        video.playsInline = true;
        // Don't auto-mute; respect user's choice.
        try{ video.load(); }catch{}
        try{ await video.play(); }catch{}
      }catch(e){
        // preview is best-effort
      }
      try{ setDropHintVisible(false); }catch{}
      try{ updateDropHintForMedia(); }catch{}

      // OPTION B: segmented upload + MSE playback.
      // Requires MP4Box.js (browser-side fragmentation) and MP4 input.
      // If MP4Box is not present, we fall back to the legacy single-shot upload.
      try{
        await getFfmpeg(); // will log detailed diagnostics & retry automatically
        await hostUploadSegmentedAndPlay(file);
        return;
      }catch(e){
        const msg = (e && e.message) ? e.message : String(e);
        if(e && e.heavyInput){
          const p = e.probe || {};
          addLog(`Heavy source detected (${p.videoCodec||"?"} ${p.width||"?"}x${p.height||"?"} ${p.pixFmt||""}). Skipping segmentation and streaming directly via WebRTC captureStream (no progressive seek).`, "warn");
          await hostPlayAndStreamDirect(file);
          return;
        }
        addLog(`FFmpeg.wasm unavailable; using legacy /upload (no progressive seek). Reason: ${msg}`, 'warn');
      }
      // Legacy compatibility: single-shot upload used by the existing UI (/upload)
      const uploadBase = SIGNAL_URL.replace(/^ws/i, "http");
      const u = new URL(uploadBase);
      u.pathname = "/upload";
      u.search = "";
      const res = await fetch(u.toString(), {
        method: "POST",
        body: file,
        mode: "cors",
        headers: { "Content-Type": (file.type || "video/mp4") }
      });
      if(!res.ok){
        const t = await res.text().catch(()=> "");
        addLog(`Upload failed: ${res.status} ${res.statusText} ${t}`, "err");
        toast("Upload failed");
        return;
      }
      const data = await res.json();
      currentObjectUrl = null;
      video.srcObject = null;
      video.src = data.url;
      showOverlay(false);
      toast("Video uploaded");
      broadcastCtrl({ type: "load-url", url: data.url });
      if(mode === 'host' && btnShare) btnShare.disabled = false;
      addLog(`Loaded video: ${file.name}`, 'sys');

      if(!video.captureStream){
        addLog('Your browser does not support video.captureStream(); try Chrome/Edge.', 'err');
        return;
      }

      videoStream = video.captureStream();
      updateOutgoingStreamAndPeers();
      applyAudioRouting();

      // If viewers connected earlier (datachannel-only), re-offer now so media tracks attach.
      if(mode === 'host'){
        const viewers = Array.from(peers.entries())
          .filter(([pid,p])=> pid && p && p.role === 'viewer')
          .map(([pid,p])=> ({pid, name: p.name || 'Viewer'}));
        for(const v of viewers){
          await hostCreateOfferForViewer(v.pid, v.name);
        }
      }

      const base = file.name.replace(/\.[^.]+$/, '');
      const guess = base + '.vtt';
      try{
        const res = await fetch(guess, {cache:'no-store'});
        if(res.ok){
          const txt = await res.text();
          const id = (crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : String(Date.now()));
          addSubsTrack({id, name: guess, vtt: txt, source: 'host', broadcast: true});
          addLog(`Auto-loaded subtitles: ${guess}`, 'sys');
        }
      } catch(_){/* ignore */}

      broadcastState();

    } catch(err){
      console.error(err);
      addLog('Failed to load video: ' + err.message, 'err');
    }
  }

  // ---------------------------------------------------------------------------
  // Option B helpers (Segmented upload + MSE playback)
  //
  // This code expects CMAF-style fMP4 output:
  //   - init.mp4 (ftyp+moov)
  //   - seg-XXXXXX.m4s (moof+mdat)
  // where each segment is decodable on its own boundary (RAP aligned).
  //
  // How to generate segments:
  //   - Recommended: ffmpeg.wasm (works for MKV->MP4 too)
  //   - Alternative: mp4box.js if you only support MP4, but you will likely
  //     need separate SourceBuffers per track.
  //
  // Server-side endpoints are implemented in worker stream.js:
  //   POST /seg/init, POST /seg/put, GET /seg/init/:id, GET /seg/seg/:id/:n
  // ---------------------------------------------------------------------------

  function getHttpBase(){
    return SIGNAL_URL.replace(/^ws/i, 'http');
  }

  
// -----------------------------
// -----------------------------
// Host-side: Option B upload (ffmpeg.wasm -> init.mp4 + fMP4 segments)
// -----------------------------
let _ffmpegSingleton = null;
let _ffmpegLoading = null;

// Prefer same-origin (Pages) paths. You can swap these to your R2 URLs if desired.
const FFCORE_PRIMARY = "/ffmpeg/ffmpeg-core.js";
const FFWASM_PRIMARY = "https://whatwewatching-ffmpeg.lilbrandon2008.workers.dev/ffmpeg/ffmpeg-core.wasm";

// Optional fallback URLs (e.g., R2). Keep as null/empty to disable.
const FFCORE_FALLBACK = null;
const FFWASM_FALLBACK = null;

function _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

// Quick sanity check so we don't "silently fallback" when a URL is actually returning HTML/404.
async function _probeAsset(url, kind){
  // kind: "js" | "wasm"
  const expect = (kind === "wasm")
    ? ["application/wasm", "application/octet-stream"]
    : ["application/javascript", "text/javascript"];

  // 1) HEAD (fast, no body)
  try{
    const h = await fetch(url, { method: "HEAD", cache: "no-store" });
    const ct = (h.headers.get("content-type") || "").toLowerCase();
    if(!h.ok){
      throw new Error(`HTTP ${h.status} ${h.statusText}`);
    }
    if(ct.includes("text/html")){
      throw new Error(`Got text/html (likely a 404/fallback page), not ${kind}`);
    }
    if(ct && !expect.some(e => ct.includes(e))){
      // Not always fatal (some CDNs omit/lie), but warn loudly.
      addLog(`FFmpeg asset MIME looks wrong for ${kind}: ${ct} @ ${url}`, "warn");
    }
    return { ok:true, ct };
  }catch(headErr){
    // 2) Range GET (lets us detect HTML even if HEAD blocked)
    try{
      const g = await fetch(url, {
        method: "GET",
        headers: { "Range": "bytes=0-255" },
        cache: "no-store"
      });
      const ct = (g.headers.get("content-type") || "").toLowerCase();
      if(!g.ok){
        throw new Error(`HTTP ${g.status} ${g.statusText}`);
      }
      const buf = await g.arrayBuffer();
      const prefix = new TextDecoder("utf-8").decode(buf).toLowerCase();
      if(prefix.includes("<!doctype") || prefix.includes("<html")){
        throw new Error(`Got HTML content (likely a 404/fallback page), not ${kind}`);
      }
      if(ct && ct.includes("text/html")){
        throw new Error(`Got text/html (likely a 404/fallback page), not ${kind}`);
      }
      if(ct && !expect.some(e => ct.includes(e))){
        addLog(`FFmpeg asset MIME looks wrong for ${kind}: ${ct} @ ${url}`, "warn");
      }
      return { ok:true, ct };
    }catch(getErr){
      throw new Error(`Asset probe failed for ${url}: ${headErr?.message || headErr} / ${getErr?.message || getErr}`);
    }
  }
}

function _getFfmpegGlobals(){
  // Support multiple UMD/global shapes.
  // Newer @ffmpeg/ffmpeg UMD exposes FFmpegWASM.FFmpeg (class) instead of createFFmpeg/fetchFile.
  const g = window;
  const ffWasm = g.FFmpegWASM || null;
  const ffOld = (g.FFmpeg && (g.FFmpeg.createFFmpeg || g.FFmpeg.fetchFile)) ? g.FFmpeg
    : (ffWasm && (ffWasm.createFFmpeg || ffWasm.fetchFile)) ? ffWasm
    : null;

  return {
    FFmpegClass: ffWasm?.FFmpeg || null,
    createFFmpeg: ffOld?.createFFmpeg || g.createFFmpeg || null,
    fetchFile: ffOld?.fetchFile || g.fetchFile || null
  };
}

async function _fetchFileAny(input){
  if(input instanceof Uint8Array) return input;
  if(input instanceof ArrayBuffer) return new Uint8Array(input);
  if(typeof input === "string"){
    const res = await fetch(input);
    if(!res.ok) throw new Error(`fetch failed ${res.status} for ${input}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const ab = await res.arrayBuffer();
    const head = new TextDecoder().decode(ab.slice(0,64)).toLowerCase();
    if(ct.includes("text/html") || head.includes("<!doctype") || head.includes("<html")){
      throw new Error(`Got HTML instead of binary for ${input} (content-type: ${ct||"unknown"})`);
    }
    return new Uint8Array(ab);
  }
  if(input && typeof input.arrayBuffer === "function"){
    return new Uint8Array(await input.arrayBuffer());
  }
  throw new Error("fetchFileAny: unsupported input");
}

async function _tryLoadFfmpegOnce(coreURL, wasmURL){
  const { FFmpegClass, createFFmpeg } = _getFfmpegGlobals();

  // Probes make errors obvious (wrong path, wrong MIME, Pages serving index.html, etc.)
  await _probeAsset(coreURL, "js");
  if(wasmURL) await _probeAsset(wasmURL, "wasm");

  if(FFmpegClass){
    // New API (class)
    const ff = new FFmpegClass();
    try{
      ff.on?.("log", ({ message }) => addLog(`[FFmpeg] ${message}`, "dim"));
      ff.on?.("progress", (p) => {
        if(p && typeof p === "object" && "ratio" in p){
          addLog(`[FFmpeg] ${(p.ratio*100).toFixed(1)}%`, "dim");
        }
      });
    }catch{}
    await ff.load({ coreURL, wasmURL, workerURL: "/ffmpeg/814.ffmpeg.js" });
    // Provide a fetchFile helper for later steps
    window.__FFMPEG_FETCHFILE = _fetchFileAny;
    return ff;
  }

  if(!createFFmpeg){
    throw new Error("FFmpeg UMD not present (FFmpeg class / createFFmpeg missing). Make sure /ffmpeg/ffmpeg.js loads and is not HTML.");
  }

  // Old API
  const ffmpeg = createFFmpeg({ log: true, corePath: coreURL });
  await ffmpeg.load();
  // If old API provides fetchFile use it; else fallback.
  window.__FFMPEG_FETCHFILE = (_getFfmpegGlobals().fetchFile) ? _getFfmpegGlobals().fetchFile : _fetchFileAny;
  return ffmpeg;
}

async function getFfmpeg(){
  if(_ffmpegSingleton) return _ffmpegSingleton;
  if(_ffmpegLoading) return _ffmpegLoading;

  _ffmpegLoading = (async ()=>{
    const attempts = [
      { core: FFCORE_PRIMARY, wasm: FFWASM_PRIMARY, label: "primary" },
      ...(FFCORE_FALLBACK ? [{ core: FFCORE_FALLBACK, wasm: FFWASM_FALLBACK, label: "fallback" }] : [])
    ];

    const maxRetriesPerAttempt = 3; // retries for transient network hiccups
    let lastErr = null;

    addLog("Loading FFmpeg.wasm core (first time can download ~30MB)...", "warn");

    for(const a of attempts){
      for(let i=0;i<maxRetriesPerAttempt;i++){
        const delay = 250 * (2 ** i);
        try{
          const ffmpeg = await _tryLoadFfmpegOnce(a.core, a.wasm);
          addLog(`FFmpeg.wasm loaded (${a.label}).`, "ok");
          _ffmpegSingleton = ffmpeg;
          return ffmpeg;
        }catch(e){
          lastErr = e;
          const msg = (e && e.message) ? e.message : String(e);
          addLog(`FFmpeg load failed (${a.label}, try ${i+1}/${maxRetriesPerAttempt}): ${msg}`, "err");
          // Retry only if we have more tries left for this attempt.
          if(i < maxRetriesPerAttempt-1){
            addLog(`Retrying FFmpeg load in ${delay}ms…`, "warn");
            await _sleep(delay);
          }
        }
      }
    }

    // Loud, non-silent failure — still allow legacy upload but the user will know why.
    addLog("FFmpeg.wasm failed to load. Progressive seek/segmented upload disabled. See console for details.", "err");
    console.error("FFmpeg load failure (last error):", lastErr);
    throw lastErr || new Error("FFmpeg load failed for unknown reasons.");
  })();

  return _ffmpegLoading;
}

function pad6(n){ return String(n).padStart(6, "0"); }

// ---- FFmpeg FS compatibility layer ----
// Old API (createFFmpeg) exposes ffmpeg.FS(cmd,...). Newer API (FFmpeg class) exposes async writeFile/readFile/deleteFile.
// We normalize to async helpers used throughout segmented upload / progressive seek.
async function ff_fs_write(ffmpeg, path, data){
  if(ffmpeg && typeof ffmpeg.FS === "function"){ ffmpeg.FS("writeFile", path, data); return; }
  if(ffmpeg && typeof ffmpeg.writeFile === "function"){ await ffmpeg.writeFile(path, data); return; }
  throw new Error("FFmpeg FS writeFile not available");
}
async function ff_fs_read(ffmpeg, path){
  if(ffmpeg && typeof ffmpeg.FS === "function"){ return ffmpeg.FS("readFile", path); }
  if(ffmpeg && typeof ffmpeg.readFile === "function"){ return await ffmpeg.readFile(path); }
  throw new Error("FFmpeg FS readFile not available");
}
async function ff_fs_unlink(ffmpeg, path){
  try{
    if(ffmpeg && typeof ffmpeg.FS === "function"){ ffmpeg.FS("unlink", path); return; }
    if(ffmpeg && typeof ffmpeg.deleteFile === "function"){ await ffmpeg.deleteFile(path); return; }
  }catch{ /* ignore */ }
}
async function ff_fs_exists(ffmpeg, path){
  try{
    if(ffmpeg && typeof ffmpeg.FS === "function"){ ffmpeg.FS("stat", path); return true; }
    // New API: best-effort existence check by attempting readFile
    await ff_fs_read(ffmpeg, path);
    return true;
  }catch{
    return false;
  }
}
// ---------------------------------------




// FFmpeg command runner compatibility:
// - createFFmpeg() API exposes: ffmpeg.run(...args)
// - new FFmpegWASM.FFmpeg API exposes: ffmpeg.exec(argsArray)
async function ff_run(ffmpeg, ...args){
  if(ffmpeg && typeof ffmpeg.exec === "function"){
    return await ffmpeg.exec(args);
  }
  if(ffmpeg && typeof ffmpeg.run === "function"){
    return await ffmpeg.run(...args);
  }
  throw new Error("FFmpeg runner not available (missing exec/run)");
}

async function segmentWithFmp4Hls(ffmpeg, file, segSec){
    const fetchFile = window.__FFMPEG_FETCHFILE || _getFfmpegGlobals().fetchFile || _fetchFileAny;

  // Clean any leftovers from prior runs (best-effort).
  const safeUnlink = async (p)=>{ await ff_fs_unlink(ffmpeg, p); };
  await safeUnlink("input");
  await safeUnlink("out.m3u8");
  await safeUnlink("init.mp4");
  for(let i=0;i<200000;i++){
    const name = `seg-${pad6(i)}.m4s`;
    if(await ff_fs_exists(ffmpeg, name)){ await safeUnlink(name); } else { break; }
  }

  await ff_fs_write(ffmpeg, "input", await fetchFile(file));

  const baseArgs = [
    "-i", "input",
    "-f", "hls",
    "-hls_time", String(segSec),
    "-hls_playlist_type", "event",
    "-hls_segment_type", "fmp4",
    "-hls_fmp4_init_filename", "init.mp4",
    "-hls_segment_filename", "seg-%06d.m4s",
    "out.m3u8"
  ];

  // Prefer stream copy (fast). If codecs are incompatible with MP4/fMP4, fall back to transcode.
  try{
    await ff_run(ffmpeg, 
      ...["-hide_banner", "-y", "-nostdin", "-c", "copy", ...baseArgs]
    );
    return { transcoded: false };
  }catch(e){
    addLog("Stream copy failed; falling back to transcode (slower but more compatible).", "warn");
    // Re-run with a conservative H.264/AAC encode.
    await ff_run(ffmpeg, 
      "-hide_banner","-y","-nostdin",
      "-i","input",
      "-c:v","libx264","-profile:v","baseline","-level","3.0","-pix_fmt","yuv420p",
      "-c:a","aac","-b:a","128k",
      "-f","hls",
      "-hls_time",String(segSec),
      "-hls_playlist_type","event",
      "-hls_segment_type","fmp4",
      "-hls_fmp4_init_filename","init.mp4",
      "-hls_segment_filename","seg-%06d.m4s",
      "out.m3u8"
    );
    return { transcoded: true };
  }
}

async function probeInputCodecs(ffmpeg, file){
  // Best-effort "ffprobe-lite" using ffmpeg -i input, parsing stderr.
  // Returns { videoCodec, audioCodec } such as { h264, aac } when detectable.    const fetchFile = window.__FFMPEG_FETCHFILE || _getFfmpegGlobals().fetchFile || _fetchFileAny;

  // Write to FS temporarily
  await ff_fs_unlink(ffmpeg, "probe");
  await ff_fs_write(ffmpeg, "probe", await fetchFile(file));

  let logs = [];
  const prevLogger = ffmpeg.setLogger ? ffmpeg.setLogger : null;
  if(ffmpeg.setLogger){
    ffmpeg.setLogger(({ type, message })=>{
      logs.push(String(message||""));
    });
  }
  try{
    // This will fail (no output), but still prints stream info.
    try{
      await ff_run(ffmpeg, "-hide_banner","-nostdin","-i","probe","-f","null","-");
    }catch{}
  }finally{
    if(ffmpeg.setLogger){
      ffmpeg.setLogger(({type,message})=>{ /* default logging stays enabled elsewhere */ });
    }
    await ff_fs_unlink(ffmpeg, "probe");
  }

  const txt = logs.join("\n");
  const v = /Video:\s*([a-z0-9_]+)/i.exec(txt);
  const a = /Audio:\s*([a-z0-9_]+)/i.exec(txt);
  const dim = /,\s*(\d+)x(\d+)/.exec(txt);
  const pix = /Video:\s*[a-z0-9_]+[^,]*,\s*([^,\s]+)/i.exec(txt);
  return {
    videoCodec: v ? v[1].toLowerCase() : "",
    audioCodec: a ? a[1].toLowerCase() : "",
    width: dim ? parseInt(dim[1],10) : 0,
    height: dim ? parseInt(dim[2],10) : 0,
    pixFmt: pix ? pix[1].toLowerCase() : ""
  };
}

async function segmentWindowHlsFmp4(ffmpeg, mode, segSec, startSeg, countSeg){
  // Generates fMP4 segments named seg-%06d.m4s, with numbering aligned to global timeline.
  // Uses ffmpeg HLS muxer with fMP4 segments.
  //
  // mode:
  //  - "copy" => -c copy
  //  - "transcode" => baseline H.264 + AAC
  const startTime = Math.max(0, startSeg * segSec);
  // Limit ffmpeg work to just this window so uploads can start immediately.
  // Small pad helps ensure the last segment boundary lands.
  const dur = Math.max(segSec, (countSeg * segSec) + 0.10);

  // Clean outputs for this run (best-effort)
  await ff_fs_unlink(ffmpeg, "out.m3u8");
  // Do NOT delete init.mp4 here; it may already be uploaded and identical.
  for(let i=startSeg;i<startSeg+countSeg;i++){
    const name = `seg-${pad6(i)}.m4s`;
    await ff_fs_unlink(ffmpeg, name);
  }

  const common = [
    "-hide_banner","-y","-nostdin",
    "-ss", String(startTime),
    "-i","input",
    "-t", String(dur),
  ];

  const hlsArgs = [
    "-f","hls",
    "-hls_time", String(segSec),
    "-hls_playlist_type","event",
    "-hls_segment_type","fmp4",
    "-hls_fmp4_init_filename","init.mp4",
    "-start_number", String(startSeg),
    "-hls_segment_filename", "seg-%06d.m4s",
    "out.m3u8"
  ];

  if(mode === "copy"){
    await ff_run(ffmpeg, ...common, "-c", "copy", ...hlsArgs);
    return;
  }

  // Transcode: baseline H.264 + AAC for widest compatibility
  await ff_run(ffmpeg, 
    ...common,
    "-vf","scale=w=1280:h=-2:force_original_aspect_ratio=decrease",
    "-c:v","libx264",
    "-preset","ultrafast","-tune","zerolatency","-crf","28",
    "-profile:v","baseline","-level","3.1","-pix_fmt","yuv420p",
    "-maxrate","2500k","-bufsize","5000k",
    "-g", String(Math.max(48, Math.round(2/segSec*48))), // keep GOP reasonable; best-effort
    "-c:a","aac","-b:a","128k",
    ...hlsArgs
  );
}


// -----------------------------
// Bulletproof segment watcher + upload helpers
// -----------------------------
async function _withRetry(fn, opts){
  const tries = Math.max(1, opts?.tries || 3);
  const baseDelay = Math.max(50, opts?.baseDelayMs || 200);
  let lastErr = null;
  for(let a=1;a<=tries;a++){
    try{ return await fn(a); }
    catch(e){
      lastErr = e;
      const d = baseDelay * Math.pow(2, a-1);
      addLog(`Retry ${a}/${tries} failed: ${e?.message || e}. Waiting ${d}ms...`, "warn");
      await new Promise(r=>setTimeout(r, d));
    }
  }
  throw lastErr;
}

function ff_fs_readdir_root(ffmpeg){
  try{
    if(ffmpeg && typeof ffmpeg.FS === "function"){ return ffmpeg.FS("readdir", "/"); }
  }catch{}
  // Newer API has no directory listing; return empty and rely on known filenames.
  return [];
}

async function ff_fs_read_stable(ffmpeg, name, opts){
  // Read a file that may be mid-write. We wait until size is stable for multiple samples
  // *and* exceeds a minimum threshold to avoid uploading tiny partial buffers (e.g. 24B).
  const tries = Math.max(3, opts?.tries || 12);
  const delay = Math.max(25, opts?.delayMs || 60);
  const minBytes = Math.max(0, opts?.minBytes || 0);

  let lastLen = -1;
  let stableCount = 0;

  for(let i=1;i<=tries;i++){
    try{
      const bytes = await ff_fs_read(ffmpeg, name);
      const len = bytes?.byteLength || bytes?.length || 0;

      if(len > 0 && len === lastLen){
        stableCount++;
      }else{
        stableCount = 0;
      }
      lastLen = len;

      // Require 2 consecutive stable observations and a sane minimum size.
      if(len > 0 && stableCount >= 2 && len >= minBytes){
        return bytes;
      }
    }catch(e){
      // ignore until tries exhausted
    }
    await new Promise(r=>setTimeout(r, delay));
  }

  // Final attempt (let error surface if any)
  return await ff_fs_read(ffmpeg, name);
}

async function uploadInitBulletproof(uploadBase, videoId, ffmpeg, initName, mime){
  await _withRetry(async ()=>{
    addLog(`[UPLOAD] init ${initName}…`, "sys");
    // init.mp4 can be small, but never *tiny*. Keep a floor to avoid partial uploads.
    const initBuf = await ff_fs_read_stable(ffmpeg, initName, { tries: 16, delayMs: 60, minBytes: 512 });
    const putInit = new URL(uploadBase);
    putInit.pathname = "/seg/put";
    putInit.searchParams.set("videoId", videoId);
    putInit.searchParams.set("kind", "init");
    const res = await fetch(putInit.toString(), {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": mime || "video/mp4" },
      body: initBuf
    });
    if(!res.ok){
      const t = await res.text().catch(()=> "");
      throw new Error(`seg/put init failed: ${res.status} ${res.statusText} ${t}`);
    }
    addLog(`[UPLOAD] init ok (${initBuf.byteLength || initBuf.length} bytes)`, "ok");
  }, { tries: 3, baseDelayMs: 250 });
}

async function uploadSegmentsBulletproof(uploadBase, videoId, ffmpeg, indices, uploadedSet, opts){
  const concurrency = Math.max(1, Math.min(8, opts?.concurrency || 4));
  const deleteAfter = !!opts?.deleteAfter;
  const cachePut = typeof opts?.cachePut === "function" ? opts.cachePut : null;

  // Build payloads (read stable)
  const segs = [];
  for(const idx of indices){
    if(uploadedSet && uploadedSet.has(idx)) continue;
    const name = `seg-${pad6(idx)}.m4s`;
    try{
      // Segments should never be a few dozen bytes; enforce a floor to avoid partial reads.
      const bytes = await ff_fs_read_stable(ffmpeg, name, { tries: 18, delayMs: 60, minBytes: 4096 });
      segs.push({ index: idx, bytes, name });
      if(cachePut) cachePut(idx, bytes);
    }catch{}
  }
  if(!segs.length) return;

  addLog(`[UPLOAD] ${segs.length} segment(s) → /seg/put (concurrency=${concurrency})`, "sys");

  // Upload with retry (whole batch)
  await _withRetry(async ()=>{
    await putSegmentsConcurrent(uploadBase, videoId, segs.map(s=>({index:s.index, bytes:s.bytes})), {
      concurrency,
      onUploaded: (idx)=> { if(uploadedSet) uploadedSet.add(idx); },
    });
  }, { tries: 3, baseDelayMs: 250 });

  addLog(`[UPLOAD] segments ok: ${segs[0].index}..${segs[segs.length-1].index}`, "ok");

  if(deleteAfter){
    for(const s of segs){
      await ff_fs_unlink(ffmpeg, s.name);
    }
  }
}

async function putInitFile(uploadBase, videoId, ffmpeg, initName, mime){
  const putInit = new URL(uploadBase);
  putInit.pathname = "/seg/put";
  putInit.searchParams.set("videoId", videoId);
  putInit.searchParams.set("kind", "init");

  const initBuf = await ff_fs_read(ffmpeg, initName);
  const res = await fetch(putInit.toString(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": mime || "video/mp4" },
    body: initBuf
  });
  if(!res.ok){
    const t = await res.text().catch(()=> "");
    throw new Error(`seg/put init failed: ${res.status} ${res.statusText} ${t}`);
  }
}

async function putSegmentsConcurrent(uploadBase, videoId, segs, opts){
  const concurrency = Math.max(1, Math.min(8, opts?.concurrency || 4));
  const onUploaded = typeof opts?.onUploaded === "function" ? opts.onUploaded : ()=>{};

  let i = 0;
  const worker = async ()=>{
    for(;;){
      const j = i++;
      if(j >= segs.length) return;
      const seg = segs[j];

      const u = new URL(uploadBase);
      u.pathname = "/seg/put";
      u.searchParams.set("videoId", videoId);
      u.searchParams.set("kind", "seg");
      u.searchParams.set("index", String(seg.index));

      const res = await fetch(u.toString(), {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "video/iso.segment" },
        body: seg.bytes
      });
      if(!res.ok){
        const t = await res.text().catch(()=> "");
        throw new Error(`seg/put index=${seg.index} failed: ${res.status} ${res.statusText} ${t}`);
      }
      onUploaded(seg.index);
    }
  };

  const runners = Array.from({length: concurrency}, ()=>worker());
  await Promise.all(runners);
}

async function putSegmentRangeFromFs(uploadBase, videoId, ffmpeg, startSeg, countSeg, opts){
  const concurrency = Math.max(1, Math.min(8, opts?.concurrency || 4));
  const deleteAfter = !!opts?.deleteAfter;

  const segs = [];
  for(let i=startSeg;i<startSeg+countSeg;i++){
    const name = `seg-${pad6(i)}.m4s`;
    try{
      const bytes = await ff_fs_read(ffmpeg, name);
      segs.push({ index: i, bytes });
    }catch{}
  }
  if(!segs.length) return;

  await putSegmentsConcurrent(uploadBase, videoId, segs, { concurrency });

  if(deleteAfter){
    for(const s of segs){
      const name = `seg-${pad6(s.index)}.m4s`;
      await ff_fs_unlink(ffmpeg, name);
    }
  }
}

async function hostUploadSegmentedAndPlay(file){
  // "Dream mode" (Option B): time-based segmented upload + MSE playback.
  //
  // Key properties:
  // - fMP4 init + 2s segments
  // - Host uploads segments in a priority window around current playhead:
  //     behind = 10s, ahead = 60s
  // - When host seeks, uploader reprioritizes immediately
  // - Uses "windowed segmentation" to avoid generating a whole 2+ hour movie up front.
  //
  // Caveat:
  // - Browsers typically require H.264 + AAC for widest MSE support.
  //   We attempt stream-copy first; if it fails, we transcode to baseline H.264 + AAC.

  const segDurMs = 2000;
  const segDurSec = segDurMs / 1000;

  // Default codecs string (used when we transcode to baseline H.264/AAC).
  const BASELINE_CODECS = 'avc1.42E01E,mp4a.40.2';
  const mime = "video/mp4";

  const uploadBase = SIGNAL_URL.replace(/^ws/i, "http");

  // Stop any prior segmented uploader
  if(segmentedCtl?.stop){ try{ segmentedCtl.stop(); }catch{} }

  // 1) Create server-side meta/session
  const initUrl = new URL(uploadBase);
  initUrl.pathname = "/seg/init";

  const initRes = await fetch(initUrl.toString(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segmentDurationMs: segDurMs, mime, codecs: BASELINE_CODECS })
  });

  if(!initRes.ok){
    const t = await initRes.text().catch(()=> "");
    throw new Error(`seg/init failed: ${initRes.status} ${initRes.statusText} ${t}`);
  }
  const { videoId } = await initRes.json();
  addLog(`Segmented session created: ${videoId}`, "sys");

  // 2) Prepare ffmpeg + write input once
  const ffmpeg = await getFfmpeg();

  // Capture probe output to decide whether stream-copy is likely to work.
  const probe = await probeInputCodecs(ffmpeg, file).catch(()=>({}));
  const likelyH264Aac = !!(probe.videoCodec === "h264" && (probe.audioCodec === "aac" || !probe.audioCodec));


  // If the input requires heavy transcoding (e.g., HEVC/10-bit/very high resolution),
  // client-side FFmpeg.wasm HLS generation can be too slow and will result in a black screen
  // while segments trickle out. In that case, fall back to legacy /upload.
  const needsTranscode = !likelyH264Aac;
  const veryHighRes = (probe.width && probe.height) ? (probe.width > 1920 || probe.height > 1080) : false;
  const hevcLike = (probe.videoCodec === "hevc" || probe.videoCodec === "h265");
  const tenBit = (probe.pixFmt && probe.pixFmt.includes("10"));
  if(needsTranscode && (veryHighRes || hevcLike || tenBit)){
    const err = new Error(`Input is ${probe.videoCodec||"unknown"} ${probe.width||"?"}x${probe.height||"?"} ${probe.pixFmt||""}; client-side segmentation would be extremely slow.`);
    err.heavyInput = true;
    err.probe = probe;
    throw err;
  }
  // Write input to FS (once)
    const fetchFile = window.__FFMPEG_FETCHFILE || _getFfmpegGlobals().fetchFile || _fetchFileAny;
  await ff_fs_unlink(ffmpeg, "input");
  await ff_fs_write(ffmpeg, "input", await fetchFile(file));

  // 3) Generate + upload init.mp4 (and a small initial window) so viewers can attach immediately
  addLog("Generating init + first segments…", "sys");
  const initWindow = { startSeg: 0, countSeg: 8 }; // 16s bootstrap

  // Try stream-copy first if likely compatible; else go straight to transcode.
  let mode = (likelyH264Aac ? "copy" : "transcode");
  try{
    await segmentWindowHlsFmp4(ffmpeg, mode, segDurSec, initWindow.startSeg, initWindow.countSeg);
  }catch(e){
    // If copy fails, fall back to transcode.
    if(mode === "copy"){
      addLog("Stream-copy segmentation failed; transcoding to H.264/AAC (slower, but most compatible).", "warn");
      mode = "transcode";
      await segmentWindowHlsFmp4(ffmpeg, mode, segDurSec, initWindow.startSeg, initWindow.countSeg);
    }else{
      throw e;
    }
  }

  // Upload init.mp4 (bulletproof)
  await uploadInitBulletproof(uploadBase, videoId, ffmpeg, "init.mp4", mime);

  // Upload the initial window segments (helps first-play) (bulletproof watcher)
  const initIdx = [];
  for(let i=initWindow.startSeg;i<initWindow.startSeg+initWindow.countSeg;i++) initIdx.push(i);
  await uploadSegmentsBulletproof(uploadBase, videoId, ffmpeg, initIdx, null, { concurrency: 4, deleteAfter: true });

  // Codecs for viewers:
  // - If we transcoded, we *know* baseline works.
  // - If we stream-copied and probe says h264/aac, we can safely advertise baseline-ish.
  //   (Exact profile might differ; most browsers still accept the generic avc1/mp4a string.)
  const codecs = (mode === "transcode" || likelyH264Aac) ? BASELINE_CODECS : BASELINE_CODECS;

  // 4) Tell everyone to load this segmented stream
  broadcastCtrl({
    type: "load-seg",
    videoId,
    segmentDurationMs: segDurMs,
    startTime: 0,
    mime,
    codecs
  });

  // 5) Priority uploader (windowed generation + concurrent uploads)
  const uploaded = new Set();     // segment indices known uploaded
  for(let i=initWindow.startSeg;i<initWindow.startSeg+initWindow.countSeg;i++) uploaded.add(i);

  let stop = false;
  let lastPlannedCenter = -1;

  // Keep a small local cache budget (mainly to avoid re-reading FS repeatedly)
  const cache = new Map(); // idx -> Uint8Array
  let cacheBytes = 0;
  const CACHE_BUDGET = 256 * 1024 * 1024; // 256MB

  const cachePut = (idx, bytes)=>{
    if(cache.has(idx)) return;
    cache.set(idx, bytes);
    cacheBytes += bytes.byteLength || bytes.length || 0;
    // Evict oldest until under budget
    while(cacheBytes > CACHE_BUDGET && cache.size > 8){
      const firstKey = cache.keys().next().value;
      const b = cache.get(firstKey);
      cache.delete(firstKey);
      cacheBytes -= (b?.byteLength || b?.length || 0);
    }
  };

  const cacheGet = (idx)=> cache.get(idx) || null;

  const windowForTime = (t)=>{
    const cur = Math.max(0, Math.floor((t || 0) / segDurSec));
    const behind = Math.ceil(10 / segDurSec);
    const ahead = Math.ceil(60 / segDurSec);
    const lo = Math.max(0, cur - behind);
    const hi = cur + ahead;
    return { lo, hi, cur };
  };

  const ensureWindowGenerated = async (lo, hi)=>{
    // Generate a window if we don't already have most of it.
    // We generate starting at lo, count = (hi-lo+1). This writes seg-<index>.m4s files.
    const count = (hi - lo + 1);
    if(count <= 0) return;

    // If the current center hasn't changed much, avoid spamming ffmpeg.
    const center = Math.floor((lo + hi) / 2);
    if(Math.abs(center - lastPlannedCenter) <= 2){
      // Still, if we have a big gap (none uploaded), proceed.
      let missing = 0;
      for(let i=lo;i<=hi;i++) if(!uploaded.has(i)) { missing++; if(missing>=4) break; }
      if(missing < 4) return;
    }
    lastPlannedCenter = center;

    // Clean any leftover segment files in this range (best-effort)
    for(let i=lo;i<=hi;i++){
      const name = `seg-${pad6(i)}.m4s`;
      await ff_fs_unlink(ffmpeg, name);
    }
    // Run ffmpeg for this time window.
    await segmentWindowHlsFmp4(ffmpeg, mode, segDurSec, lo, count);
    // Immediately upload the generated window segments (bulletproof watcher)
    const idxs = [];
    for(let i=lo;i<=hi;i++) idxs.push(i);
    await uploadSegmentsBulletproof(uploadBase, videoId, ffmpeg, idxs, uploaded, { concurrency: 4, deleteAfter: true, cachePut });
  };

  const pump = async ()=>{
    addLog("Segmented uploader running (priority window: -10s/+60s; upload concurrency: 4; cache: 256MB).", "ok");

    while(!stop){
      const t = video.currentTime || 0;
      const { lo, hi, cur } = windowForTime(t);

      // If host jumped, generate the needed window quickly.
      await ensureWindowGenerated(lo, hi);

      // Build priority order: cur, cur+1..hi, cur-1..lo
      const order = [];
      order.push(cur);
      for(let i=cur+1;i<=hi;i++) order.push(i);
      for(let i=cur-1;i>=lo;i--) order.push(i);

      // Upload in small batches with bounded concurrency.
      const batch = [];
      for(const idx of order){
        if(stop) break;
        if(uploaded.has(idx)) continue;

        // Prefer cache, else read from FS if present.
        let bytes = cacheGet(idx);
        if(!bytes){
          const name = `seg-${pad6(idx)}.m4s`;
          try{
            bytes = await ff_fs_read(ffmpeg, name);
            cachePut(idx, bytes);
          }catch{
            // Not generated yet; will be caught on next loop / after window gen.
            continue;
          }
        }

        batch.push({ index: idx, bytes });
        if(batch.length >= 24) break;
      }

      if(batch.length){
        await _withRetry(async ()=>{
          await putSegmentsConcurrent(uploadBase, videoId, batch, {
            concurrency: 4,
            onUploaded: (idx)=> { uploaded.add(idx); },
          });
        }, { tries: 3, baseDelayMs: 250 });

        // Delete uploaded segment files from FS to keep wasm FS small.
        for(const s of batch){
          const name = `seg-${pad6(s.index)}.m4s`;
          await ff_fs_unlink(ffmpeg, name);
        }
      }

      // Keep feeding a bit forward if the window is satisfied
      // (helps buffer out in case of temporary upload pauses)
      const forward = [];
      for(let i=hi+1;i<hi+16;i++){
        if(stop) break;
        if(uploaded.has(i)) continue;
        // Generate a tiny forward window on demand
        await ensureWindowGenerated(i, i+7);
        for(let j=i;j<=i+7;j++){
          if(uploaded.has(j)) continue;
          const name = `seg-${pad6(j)}.m4s`;
          try{
            const bytes = await ff_fs_read(ffmpeg, name);
            cachePut(j, bytes);
            forward.push({ index: j, bytes });
          }catch{}
          if(forward.length >= 16) break;
        }
        if(forward.length >= 16) break;
      }
      if(forward.length){
        await _withRetry(async ()=>{
          await putSegmentsConcurrent(uploadBase, videoId, forward, {
            concurrency: 4,
            onUploaded: (idx)=> { uploaded.add(idx); },
          });
        }, { tries: 3, baseDelayMs: 250 });
        for(const s of forward){
          const name = `seg-${pad6(s.index)}.m4s`;
          await ff_fs_unlink(ffmpeg, name);
        }
      }

      await new Promise(r=>setTimeout(r, 200));
    }
  };

  pump().catch((e)=>{
    console.error(e);
    addLog(`Uploader error: ${e?.message || e}`, "err");
  });

  segmentedCtl = { stop: ()=>{ stop = true; } };
}

  let segmentedCtl = null;

  async function startSegmentedPlayback(payload){
    const videoId = payload?.videoId;
    if(!videoId) throw new Error('Missing videoId');

    const segDurMs = Number(payload.segmentDurationMs || 2000);
    const startTime = Number(payload.startTime || 0);
    const mime = String(payload.mime || 'video/mp4');
    const codecs = String(payload.codecs || '');
    const mimeCodec = codecs ? `${mime}; codecs="${codecs}"` : mime;

    if(!('MediaSource' in window)) throw new Error('MediaSource not supported in this browser');
    if(codecs && !MediaSource.isTypeSupported(mimeCodec)){
      throw new Error(`Unsupported MIME/codec for MSE: ${mimeCodec}`);
    }

    // Tear down previous MSE session if any
    try{
      if(segmentedCtl?.url){ URL.revokeObjectURL(segmentedCtl.url); }
    }catch{}
    segmentedCtl = { videoId, segDurMs, startTime, mime, codecs, mimeCodec };

    const base = getHttpBase();
    const ms = new MediaSource();
    const url = URL.createObjectURL(ms);
    segmentedCtl.mediaSource = ms;
    segmentedCtl.url = url;

    video.srcObject = null;
    video.src = url;
    showOverlay(false);
    updateDropHintForMedia();

    await new Promise((resolve, reject)=>{
      ms.addEventListener('sourceopen', resolve, { once:true });
      ms.addEventListener('error', ()=> reject(new Error('MediaSource error')), { once:true });
    });

    const sb = ms.addSourceBuffer(mimeCodec);
    segmentedCtl.sb = sb;

    const append = (buf)=>new Promise((res,rej)=>{
      const sbNow = segmentedCtl?.sb;
      if(!sbNow) return rej(new Error('SourceBuffer missing'));
      const onEnd = ()=>res();
      const onErr = ()=>rej(new Error('SourceBuffer error'));
      try{
        sbNow.addEventListener('updateend', onEnd, { once:true });
        sbNow.addEventListener('error', onErr, { once:true });
        sbNow.appendBuffer(buf);
      }catch(e){ rej(e); }
    });

    const isBufferDetached = (err) => {
      const msg = String(err?.message || err || "");
      return msg.includes("SourceBuffer has been removed") ||
             msg.includes("removed from the parent media source") ||
             msg.includes("InvalidStateError");
    };

    const rebuildMSE = async (fromSeg, why) => {
      if(segmentedCtl.rebuilding) return;
      segmentedCtl.rebuilding = true;
      try{
      addLog(`[MSE] rebuilding pipeline at seg ${fromSeg} (${why||"unknown"})`, "warn");
      // best-effort teardown of old object URL
      try{ if(segmentedCtl?.url) URL.revokeObjectURL(segmentedCtl.url); }catch{}
      try{ video.pause(); }catch{}

      const ms2 = new MediaSource();
      const url2 = URL.createObjectURL(ms2);
      segmentedCtl.mediaSource = ms2;
      segmentedCtl.url = url2;

      video.srcObject = null;
      video.src = url2;

      await new Promise((resolve, reject)=>{
        ms2.addEventListener('sourceopen', resolve, { once:true });
        ms2.addEventListener('error', ()=> reject(new Error('MediaSource error')), { once:true });
      });

      const sb2 = ms2.addSourceBuffer(mimeCodec);
      segmentedCtl.sb = sb2;

      const append2 = (buf)=>new Promise((res,rej)=>{
        const sbNow = segmentedCtl?.sb;
        if(!sbNow) return rej(new Error('SourceBuffer missing'));
        const onEnd = ()=>res();
        const onErr = ()=>rej(new Error('SourceBuffer error'));
        try{
          sbNow.addEventListener('updateend', onEnd, { once:true });
          sbNow.addEventListener('error', onErr, { once:true });
          sbNow.appendBuffer(buf);
        }catch(e){ rej(e); }
      });

      // re-append init
      const initRes2 = await fetch(`${base}/seg/init/${videoId}`, { cache:'no-store' });
      if(!initRes2.ok) throw new Error(`Init missing: ${initRes2.status}`);
      await append2(await initRes2.arrayBuffer());

      segmentedCtl.nextSeg = Math.max(0, fromSeg);
      segmentedCtl._append = append2;
      segmentedCtl.seg404 = 0;

      try{ await video.play(); }catch{}
      } finally {
        segmentedCtl.rebuilding = false;
      }
    };

    // init
    const initRes = await fetch(`${base}/seg/init/${videoId}`, { cache:'no-store' });
    if(!initRes.ok) throw new Error(`Init missing: ${initRes.status}`);
    await (segmentedCtl._append||append)(await initRes.arrayBuffer());

    // start near requested time
    const startSeg = Math.max(0, Math.floor((startTime * 1000) / segDurMs));
    segmentedCtl.nextSeg = startSeg;

    // Small helper to keep a forward buffer filled.
    const ensureBufferLoop = async ()=>{
      const token = (segmentedCtl.loopToken = Math.random().toString(36).slice(2));
      segmentedCtl.seg404 = 0;
      while(segmentedCtl && segmentedCtl.videoId === videoId && segmentedCtl.loopToken === token){
        const sbNow = segmentedCtl.sb;
        if(!sbNow){ await new Promise(res=>setTimeout(res,50)); continue; }
        const ahead = 25;
        const ct = video.currentTime || 0;
        const bufferedEnd = getBufferedEnd(ct);
        if(bufferedEnd - ct < ahead && !sbNow.updating && !segmentedCtl.rebuilding){
          const idx = segmentedCtl.nextSeg;
          const segUrl = `${base}/seg/seg/${videoId}/${idx}`;
          try{
            const r = await fetch(segUrl, { cache:'no-store' });
            if(r.status === 404){
              segmentedCtl.seg404 = Math.min(segmentedCtl.seg404 + 1, 30);
              const wait = Math.min(250 + segmentedCtl.seg404 * 200, 3000);
              await new Promise(res=> setTimeout(res, wait));
              continue;
            }
            if(!r.ok){
              addLog(`[MSE] seg ${idx} HTTP ${r.status}`, 'warn');
              await new Promise(res=> setTimeout(res, 800));
              continue;
            }
            segmentedCtl.seg404 = 0;
            const ab = await r.arrayBuffer();
            try{
              const doAppend = (segmentedCtl._append || append);
              await doAppend(ab);
              segmentedCtl.nextSeg++;
            }catch(e){
              const msg = String(e?.message||e);
              addLog(`[MSE] append failed at seg ${idx} (${ab?.byteLength||0} bytes): ${msg}`, 'err');
              if(msg.includes('still processing')){ await new Promise(res=>setTimeout(res,30)); continue; }
              if(isBufferDetached(e) || (segmentedCtl.mediaSource && segmentedCtl.mediaSource.readyState !== 'open') || msg.includes('removed from the parent media source')){
                await rebuildMSE(idx, msg);
              }else{
                await new Promise(res=> setTimeout(res, 500));
              }
            }
          }catch(e){
            addLog(`[MSE] fetch failed seg ${idx}: ${e?.message||e}`, 'warn');
            await new Promise(res=> setTimeout(res, 500));
          }
        }else{
          await new Promise(res=> setTimeout(res, 200));
        }
      }
    };

    // Start playback (might be blocked by autoplay policy)
    video.play().catch(()=>{});
    // Seek after init append to align time (may clamp if not buffered yet)
    try{ video.currentTime = startTime; }catch{}
    ensureBufferLoop();
  }

  function getBufferedEnd(t){
    try{
      const b = video.buffered;
      for(let i=0;i<b.length;i++){
        const start = b.start(i), end = b.end(i);
        if(t >= start && t <= end) return end;
      }
      return 0;
    }catch{ return 0; }
  }

  // -----------------------------
  // Subtitles handling
  // -----------------------------

  // Subtitle bank (multiple tracks per client)
  function ensureSubsSelect(){
    if(!subsTrackSel) return;
    if(!subsBank.length){
      subsTrackSel.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No subtitles';
      subsTrackSel.appendChild(opt);
      subsTrackSel.value = '';
      return;
    }
    // Keep selection if possible
    const cur = activeSubsId;
    subsTrackSel.innerHTML = '';
    for(const tr of subsBank){
      const opt = document.createElement('option');
      opt.value = tr.id;
      opt.textContent = tr.name + (tr.source === 'host' ? ' (host)' : (tr.source === 'remote' ? ' (shared)' : ''));
      subsTrackSel.appendChild(opt);
    }
    if(cur && subsBank.some(t=>t.id===cur)) subsTrackSel.value = cur;
    else subsTrackSel.value = subsBank[0].id;
  }

  function addSubsTrack({id, name, vtt, source, broadcast}){
    const track = {id, name, vtt, source: source || 'local'};
    subsBank.push(track);
    // Auto-select newly added track
    activeSubsId = id;
    ensureSubsSelect();
    if(subsTrackSel) subsTrackSel.value = id;
    selectSubsTrack(id);
    if(broadcast && mode === 'host'){
      broadcastVttTrack(track);
    }
  }

  function selectSubsTrack(id){
    const tr = subsBank.find(t=>t.id===id);
    if(!tr){
      vttText = null;
      subsCues = [];
      updateSubsOverlay();
      return;
    }
    activeSubsId = tr.id;
    applyVttText(tr.vtt, tr.name);
      savePrefs();
}

  on(subsTrackSel,'change', ()=>{
    const id = subsTrackSel?.value || '';
    if(!id){ activeSubsId = null; vttText=null; subsCues=[]; updateSubsOverlay(); return; }
    selectSubsTrack(id);
    savePrefs();
  });

  on(btnLoadVtt,'click', ()=> vttPick?.click());
  on(vttPick,'change', async ()=>{
    const f = vttPick.files?.[0];
    if(!f) return;
    await loadSubtitleFile(f);
  });

  async function loadSubtitleFile(file){
    const fname = (file.name || 'subtitles').trim();
    const lower = fname.toLowerCase();
    const raw = await file.text();

    let vtt = null;
    if(lower.endsWith('.vtt')){
      vtt = raw;
    } else if(lower.endsWith('.srt')){
      vtt = srtToVtt(raw);
    } else {
      toast('Unsupported subtitles (use .vtt or .srt)');
      return;
    }

    const id = (crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : String(Date.now()));
    addSubsTrack({
      id,
      name: fname,
      vtt,
      source: (mode === 'host') ? 'host' : 'local',
      broadcast: (mode === 'host')
    });

    addLog(`Loaded subtitles: ${fname}${lower.endsWith('.srt') ? ' (converted from SRT)' : ''}`, 'sys');
  }

  function srtToVtt(srt){
    const BOM = String.fromCharCode(0xFEFF);
    let text = String(srt || '').replace(BOM, '').trim();

    // Normalize newlines
    text = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");

    const lines = text.split("\n");
    const out = ["WEBVTT", ""]; 

    for(const line of lines){
      const t = line.trim();
      if(t && t.split("").every(ch => ch >= "0" && ch <= "9")) continue;

      if(line.includes("-->")){
        out.push(line.replaceAll(",", ".").replace(/\s+-->\s+/g, " --> "));
        continue;
      }

      out.push(line);
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  }

  async function applyVttText(txt, label='Subtitles'){
    vttText = txt || '';
    subsCues = parseVttToCues(vttText);

    // Remove any existing native tracks; we render our own overlay so we can style/position.
    try{
      for(const el of Array.from(video.querySelectorAll('track[kind="subtitles"], track[kind="captions"]'))){
        el.remove();
      }
    }catch(_){}

    // Always disable native rendering; our overlay handles display.
    for(const t of video.textTracks) t.mode = 'disabled';

    updateSubsOverlay();
  }

  function setSubsEnabled(on, silent=false){
    subsEnabled = !!on;
    btnToggleSubs.textContent = subsEnabled ? 'On' : 'Off';
    // Disable native
    for(const t of video.textTracks) t.mode = 'disabled';
    subsOverlay.classList.toggle('on', subsEnabled);

    if(!silent) toast(subsEnabled ? 'Subtitles on' : 'Subtitles off');
    savePrefs();

    if(mode === 'host') broadcastCtrl({type:'subs', enabled: subsEnabled});
    updateSubsOverlay();
  }

  on(btnToggleSubs,'click', ()=> setSubsEnabled(!subsEnabled));

  // --- Custom subtitle renderer (so we can fully style + position) ---
  let subsCues = [];
  let activeCueIndex = -1;

  function parseVttTime(t){
    // Supports: HH:MM:SS.mmm or MM:SS.mmm
    const parts = t.trim().split(':');
    let h = 0, m = 0, s = 0;
    if(parts.length === 3){
      h = parseInt(parts[0]||'0',10);
      m = parseInt(parts[1]||'0',10);
      s = parseFloat(parts[2]||'0');
    } else if(parts.length === 2){
      m = parseInt(parts[0]||'0',10);
      s = parseFloat(parts[1]||'0');
    } else {
      s = parseFloat(parts[0]||'0');
    }
    return h*3600 + m*60 + s;
  }

  function parseVttToCues(text){
    const out = [];
    if(!text) return out;
    const lines = String(text).replace(/\r/g,'').split('\n');
    let i = 0;

    // Skip WEBVTT header and metadata
    if(lines[i] && lines[i].startsWith('WEBVTT')) i++;
    while(i < lines.length){
      const line = (lines[i]||'').trim();

      // Skip blank lines
      if(!line){ i++; continue; }

      // Optional cue identifier line
      let timeLine = line;
      if(!line.includes('-->')){
        i++;
        timeLine = (lines[i]||'').trim();
      }

      if(!timeLine.includes('-->')){ i++; continue; }

      const [a,bRaw] = timeLine.split('-->').map(s=>s.trim());
      const b = (bRaw||'').split(/\s+/)[0]; // ignore settings
      const start = parseVttTime(a);
      const end = parseVttTime(b);

      i++;
      const textLines = [];
      while(i < lines.length && (lines[i]||'').trim() !== ''){
        textLines.push(lines[i]);
        i++;
      }
      out.push({start, end, text: textLines.join('\n')});
      i++;
    }
    return out;
  }

  function findActiveCueIndex(t){
    if(!subsCues.length) return -1;
    if(activeCueIndex >= 0){
      const c = subsCues[activeCueIndex];
      if(t >= c.start && t <= c.end) return activeCueIndex;
    }
    for(let k=0;k<subsCues.length;k++){
      const c = subsCues[k];
      if(t >= c.start && t <= c.end) return k;
    }
    return -1;
  }

  function renderCueText(raw){
    return String(raw||'').replace(/<[^>]*>/g,'');
  }

  function updateSubsOverlay(){
    if(!subsEnabled){ subsOverlay.innerHTML = ''; activeCueIndex = -1; return; }
    const t0 = video.currentTime || 0;
    const t = t0 - ((Number(subsStyle.timeOffsetMs)||0) / 1000);
    const idx = findActiveCueIndex(t);
    if(idx === activeCueIndex) return;

    activeCueIndex = idx;
    subsOverlay.innerHTML = '';
    if(idx < 0) return;

    const cue = subsCues[idx];
    const box = document.createElement('div');
    box.className = 'subsBox';

    const top = clampNum(subsStyle.topPct, 0, 45);
    const left = clampNum(subsStyle.leftPct, 0, 45);
    const right = clampNum(subsStyle.rightPct, 0, 45);
    const bottom = clampNum(subsStyle.bottomPct, 0, 45);
    box.style.top = top + '%';
    box.style.left = left + '%';
    box.style.right = right + '%';
    box.style.bottom = bottom + '%';

    const text = document.createElement('div');
    text.className = 'subsText';
    text.textContent = renderCueText(cue.text);

    box.appendChild(text);
    subsOverlay.appendChild(box);
  }

  on(video,'timeupdate', updateSubsOverlay);
  on(video,'seeked', updateSubsOverlay);
  on(video,'ratechange', updateSubsOverlay);
  on(video,'loadedmetadata', updateSubsOverlay);

  function clampNum(v, lo, hi){
    const n = Number(v);
    if(Number.isNaN(n)) return lo;
    return Math.min(hi, Math.max(lo, n));
  }

  // Subtitle styling settings (host syncs to viewers)
  const subsDefaults = {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    fontSizePct: 4.0,          // % of video height
    color: '#ffffff',
    bold: true,
    italic: false,
    underline: false,

    outlineColor: '#000000',
    outlinePx: 2.5,           // px          // % of video height

    shadowColor: '#000000',
    shadowPx: 4.5,            // px           // % of video height

    opacityPct: 100,

    bgColor: '#000000',
    bgOpacityPct: 0,

    padTopPct: 0.0,
    padRightPct: 0.0,
    padBottomPct: 0.0,
    padLeftPct: 0.0,

    topPct: 0,
    leftPct: 5,
    rightPct: 5,
    bottomPct: 8,

    timeOffsetMs: 0
  };

  const subsStyle = {...subsDefaults};

  function makeOutlineShadow(color, thick){
    const t = Math.max(0, Number(thick)||0);
    if(!t) return '0 0 0 rgba(0,0,0,0)';
    const o = t;
    const c = color || '#000';
    return [
      `${o}px 0 0 ${c}`, `-${o}px 0 0 ${c}`,
      `0 ${o}px 0 ${c}`, `0 -${o}px 0 ${c}`,
      `${o}px ${o}px 0 ${c}`, `${o}px -${o}px 0 ${c}`,
      `-${o}px ${o}px 0 ${c}`, `-${o}px -${o}px 0 ${c}`,
    ].join(', ');
  }

  function subsBasisPx(){
    // Use rendered video height when possible so "% of video" behaves intuitively.
    const r = video.getBoundingClientRect?.();
    const h = (r && r.height) ? r.height : 0;
    return h || window.innerHeight || 720;
  }

  function pctToPx(pct){
    const p = Number(pct)||0;
    return (subsBasisPx() * p) / 100;
  }

  function rgbaFromHex(hex, a){
    const h = String(hex||'').replace('#','').trim();
    if(h.length !== 6) return `rgba(0,0,0,${a})`;
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function applySubsStyle(style){
    // Back-compat: migrate older fields if they exist
    if(style && typeof style.fontSize === 'number' && style.fontSizePct == null){
      style.fontSizePct = Math.max(0.5, Math.min(15, (style.fontSize / subsBasisPx()) * 100));
    }
    if(style && typeof style.outlineThickness === 'number' && style.outlinePx == null){
            style.outlinePx = Math.max(0, Math.min(20, style.outlineThickness));
    }
    if(style && typeof style.shadowThickness === 'number' && style.shadowPx == null){
            style.shadowPx = Math.max(0, Math.min(30, style.shadowThickness));
    }
    if(style && typeof style.paddingPx === 'number' && style.padTopPct == null){
      const pct = (style.paddingPx / subsBasisPx()) * 100;
      style.padTopPct = style.padRightPct = style.padBottomPct = style.padLeftPct = Math.max(0, Math.min(5, pct));
    }

    Object.assign(subsStyle, style||{});

    const sizePx = pctToPx(clampNum(subsStyle.fontSizePct, 0.5, 15));
        const outlinePx = clampNum(subsStyle.outlinePx, 0, 20);
        const shadowPx = clampNum(subsStyle.shadowPx, 0, 30);

    const padT = pctToPx(clampNum(subsStyle.padTopPct, 0, 5));
    const padR = pctToPx(clampNum(subsStyle.padRightPct, 0, 5));
    const padB = pctToPx(clampNum(subsStyle.padBottomPct, 0, 5));
    const padL = pctToPx(clampNum(subsStyle.padLeftPct, 0, 5));

    subsOverlay.style.setProperty('--subs-font', subsStyle.fontFamily || '');
    subsOverlay.style.setProperty('--subs-size', sizePx.toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-color', subsStyle.color || '#fff');
    subsOverlay.style.setProperty('--subs-weight', subsStyle.bold ? '800' : '500');
    subsOverlay.style.setProperty('--subs-style', subsStyle.italic ? 'italic' : 'normal');
    subsOverlay.style.setProperty('--subs-deco', subsStyle.underline ? 'underline' : 'none');

    subsOverlay.style.setProperty('--subs-opacity', (clampNum(subsStyle.opacityPct, 0, 100)/100).toFixed(3));

    subsOverlay.style.setProperty('--subs-pad-t', padT.toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-pad-r', padR.toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-pad-b', padB.toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-pad-l', padL.toFixed(2) + 'px');

    const bgA = clampNum(subsStyle.bgOpacityPct, 0, 100)/100;
    subsOverlay.style.setProperty('--subs-bg', bgA > 0 ? rgbaFromHex(subsStyle.bgColor||'#000000', bgA) : 'transparent');

    // Drop Shadow: use thickness as blur + small y-offset
    subsOverlay.style.setProperty('--subs-shadow', shadowPx.toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-shadow-y', (shadowPx*0.35).toFixed(2) + 'px');
    subsOverlay.style.setProperty('--subs-shadow-color', subsStyle.shadowColor || 'rgba(0,0,0,0)');

    subsOverlay.style.setProperty('--subs-outline-shadow', makeOutlineShadow(subsStyle.outlineColor, outlinePx));

    updateSubsOverlay();
  }

  function broadcastSubsStyle(){
    if(mode !== 'host') return;
    const msg = {t: MSG.subsStyle, style: subsStyle};
    for(const peer of peers.values()){
      if(peer.dc?.readyState === 'open') peer.dc.send(JSON.stringify(msg));
    }
  }

  // UI wiring
  const subsFontSelect = $('#subsFontSelect');
  const subsFontPicker = $('#subsFontPicker');
  const subsFontBtn = $('#subsFontBtn');
  const subsFontBtnLabel = $('#subsFontBtnLabel');
  const subsFontMenu = $('#subsFontMenu');
  const subsFontCustom = $('#subsFontCustom');
  const subsFontSize = $('#subsFontSize');
  const subsBold = $('#subsBold');
  const subsItalic = $('#subsItalic');
  const subsUnderline = $('#subsUnderline');
  const subsColor = $('#subsColor');
  const subsColorText = $('#subsColorText');
  const subsOutlineColor = $('#subsOutlineColor');
  const subsOutlineThick = $('#subsOutlineThick');
  const subsShadowColor = $('#subsShadowColor');
  const subsShadowThick = $('#subsShadowThick');
  const subsOpacity = $('#subsOpacity');
  // Background color is fixed (no UI control)
  const subsBgOpacity = $('#subsBgOpacity');
  const subsBottom = $('#subsBottom');
  const subsHostHint = $('#subsHostHint');

  const btnSubsApply = $('#btnSubsApply');
  const btnSubsReset = $('#btnSubsReset');
  const subsOffsetLabel = $('#subsOffsetLabel');
  const btnSubsDelay1000 = $('#btnSubsDelay1000');
  const btnSubsDelay100 = $('#btnSubsDelay100');
  const btnSubsAdvance100 = $('#btnSubsAdvance100');
  const btnSubsAdvance1000 = $('#btnSubsAdvance1000');
  const btnSubsOffsetReset = $('#btnSubsOffsetReset');

  // Draft editing model: inputs modify draft; Apply commits + broadcasts
  let subsDraft = {...subsStyle};

  function setInputVal(el, v){
    if(!el) return;
    el.value = String(v ?? '');
  }

  function showOrHideCustomFont(){
    if(!subsFontSelect || !subsFontCustom) return;
    const isCustom = subsFontSelect.value === 'custom';
    subsFontCustom.style.display = isCustom ? 'block' : 'none';
  }

  function syncSubsUiFromDraft(){
    // Font
    const fam = subsDraft.fontFamily || subsDefaults.fontFamily;
    const known = Array.from(subsFontSelect.options).some(o => o.value === fam);
    subsFontSelect.value = known ? fam : 'custom';
    syncSubsFontPickerUI();
    subsFontCustom.value = known ? '' : fam;
    showOrHideCustomFont();

    setInputVal(subsFontSize, subsDraft.fontSizePct);
    subsBold.checked = !!subsDraft.bold;
    subsItalic.checked = !!subsDraft.italic;
    subsUnderline.checked = !!subsDraft.underline;

    setInputVal(subsColor, subsDraft.color);
    setInputVal(subsColorText, subsDraft.color);

    setInputVal(subsOutlineColor, subsDraft.outlineColor);
    setInputVal(subsOutlineThick, subsDraft.outlinePx);

    setInputVal(subsShadowColor, subsDraft.shadowColor);
    setInputVal(subsShadowThick, subsDraft.shadowPx);

    setInputVal(subsOpacity, subsDraft.opacityPct);
    setInputVal(subsBgOpacity, subsDraft.bgOpacityPct);
    setInputVal(subsBottom, subsDraft.bottomPct);

    if(subsOffsetLabel) subsOffsetLabel.textContent = String(Number(subsDraft.timeOffsetMs)||0) + 'ms';
  }

  function updateSubsUiForRole(){
    const isHost = (mode === 'host');
    const disable = !isHost;
    const ids = [
      subsFontSelect, subsFontCustom, subsFontSize, subsBold, subsItalic, subsUnderline,
      subsColor, subsColorText, subsOutlineColor, subsOutlineThick,
      subsShadowColor, subsShadowThick, subsOpacity, subsBgOpacity,
      subsBottom,
      btnSubsApply, btnSubsReset, btnSubsDelay1000, btnSubsDelay100, btnSubsAdvance100, btnSubsAdvance1000
    ];
    for(const el of ids){
      if(!el) continue;
      el.disabled = disable;
    }
    if(subsHostHint) subsHostHint.style.display = disable ? 'block' : 'none';
  }

  function normalizeHexColor(s){
    const v = String(s||'').trim();
    if(/^#[0-9a-fA-F]{6}$/.test(v)) return v;
    if(/^#[0-9a-fA-F]{3}$/.test(v)){
      return '#' + v[1]+v[1] + v[2]+v[2] + v[3]+v[3];
    }
    return null;
  }

  function readDraftFromInputs(){
    if(mode !== 'host') return;

    // Font
    showOrHideCustomFont();
    let fam = subsFontSelect.value;
    if(fam === 'custom'){
      fam = subsFontCustom.value.trim() || subsDraft.fontFamily || subsDefaults.fontFamily;
    }
    subsDraft.fontFamily = fam;

    subsDraft.fontSizePct = clampNum(subsFontSize.value, 0.5, 15);
    subsDraft.bold = !!subsBold.checked;
    subsDraft.italic = !!subsItalic.checked;
    subsDraft.underline = !!subsUnderline.checked;

    const c1 = normalizeHexColor(subsColor.value) || subsDraft.color;
    subsDraft.color = c1;
    subsColorText.value = c1;

    const cTxt = normalizeHexColor(subsColorText.value);
    if(cTxt){ subsDraft.color = cTxt; subsColor.value = cTxt; subsColorText.value = cTxt; }

    subsDraft.outlineColor = normalizeHexColor(subsOutlineColor.value) || subsDraft.outlineColor;
        subsDraft.outlinePx = clampNum(subsOutlineThick.value, 0, 20);

    subsDraft.shadowColor = normalizeHexColor(subsShadowColor.value) || subsDraft.shadowColor;
        subsDraft.shadowPx = clampNum(subsShadowThick.value, 0, 30);

    subsDraft.opacityPct = clampNum(subsOpacity.value, 0, 100);
    subsDraft.bgOpacityPct = clampNum(subsBgOpacity.value, 0, 100);
    subsDraft.bottomPct = clampNum(subsBottom.value, 0, 45);

    if(subsOffsetLabel) subsOffsetLabel.textContent = String(Number(subsDraft.timeOffsetMs)||0) + 'ms';
  }

  function commitDraft(){
    if(mode !== 'host') return;
    // Ensure latest UI values are captured even if the last field didn't fire an input event
    readDraftFromInputs();
    Object.assign(subsStyle, subsDraft);
    applySubsStyle(subsStyle);
  ensureSubsSelect(); 
    broadcastSubsStyle();
      savePrefs();
}

  function resetDraft(){
    if(mode !== 'host') return;
    subsDraft = {...subsDefaults};
    syncSubsUiFromDraft();
    Object.assign(subsStyle, subsDraft);
    applySubsStyle(subsStyle);
    broadcastSubsStyle();
    savePrefs();
  }

  function adjustOffset(delta){
    if(mode !== 'host') return;
    const cur = Number(subsDraft.timeOffsetMs)||0;
    subsDraft.timeOffsetMs = cur + delta;
    if(subsOffsetLabel) subsOffsetLabel.textContent = String(subsDraft.timeOffsetMs) + 'ms';
    savePrefs();
  }

  const bindEls = [
    subsFontSelect, subsFontCustom, subsFontSize, subsBold, subsItalic, subsUnderline,
    subsColor, subsColorText, subsOutlineColor, subsOutlineThick,
    subsShadowColor, subsShadowThick, subsOpacity, subsBgOpacity,
    subsBottom
  ];
  for(const el of bindEls){
    if(!el) continue;
    on(el,'input', () => { readDraftFromInputs(); });
    on(el,'change', () => { readDraftFromInputs(); });
  }

  on(subsFontSelect,'change', ()=>{ showOrHideCustomFont(); syncSubsFontPickerUI(); });

  on(btnSubsApply,'click', (e)=>{ e.preventDefault(); commitDraft(); });
  on(btnSubsReset,'click', (e)=>{ e.preventDefault(); resetDraft(); });

  on(btnSubsDelay1000,'click', (e)=>{ e.preventDefault(); adjustOffset(1000); });
  on(btnSubsDelay100,'click', (e)=>{ e.preventDefault(); adjustOffset(100); });
  on(btnSubsAdvance100,'click', (e)=>{ e.preventDefault(); adjustOffset(-100); });
  on(btnSubsAdvance1000,'click', (e)=>{ e.preventDefault(); adjustOffset(-1000); });
  on(btnSubsOffsetReset,'click', (e)=>{ e.preventDefault(); if(mode!=='host') return; subsDraft.timeOffsetMs = 0; if(subsOffsetLabel) subsOffsetLabel.textContent = '0ms'; savePrefs(); });

  // initial
  subsDraft = {...subsStyle};
  syncSubsUiFromDraft();
  applySubsStyle(subsStyle);
  // Recompute subtitle pixel sizes on resize/fullscreen (inputs are % based)
  window.addEventListener('resize', ()=> applySubsStyle(subsStyle));
  document.addEventListener('fullscreenchange', ()=> applySubsStyle(subsStyle));
  ensureSubsSelect();

  function broadcastVttTrack(track){
    if(mode !== 'host') return;
    if(!track?.vtt) return;
    const msg = {t: MSG.vtt, id: track.id, name: track.name, vtt: track.vtt};
    for(const peer of peers.values()){
      if(peer.dc?.readyState === 'open'){
        peer.dc.send(JSON.stringify(msg));
      }
    }
  }

  function sendAllHostVttsToDc(dc){
    if(mode !== 'host') return;
    if(!dc || dc.readyState !== 'open') return;
    const hostTracks = subsBank.filter(t => t.source === 'host');
    for(const tr of hostTracks){
      try{ dc.send(JSON.stringify({t: MSG.vtt, id: tr.id, name: tr.name, vtt: tr.vtt})); }catch{}
    }
  }

  // -----------------------------
  // Playback controls (host drives)
  // -----------------------------
  function broadcastCtrl(payload){
    if(mode !== 'host') return;
    const msg = {t: MSG.ctrl, at: Date.now(), payload};
    for(const peer of peers.values()){
      if(peer.dc?.readyState === 'open') peer.dc.send(JSON.stringify(msg));
    }
  }

  function broadcastState(){
    if(mode !== 'host') return;
    broadcastCtrl({
      type:'state',
      paused: video.paused,
      t: video.currentTime,
      rate: video.playbackRate,
      subs: subsEnabled
    });
  }

  function seekBy(delta){
    video.currentTime = Math.max(0, video.currentTime + delta);
    broadcastCtrl({type:'seek', t: video.currentTime});
  }

  function frameStep(dir){
    const step = 1/30;
    video.pause();
    video.currentTime = Math.max(0, video.currentTime + (dir * step));
    broadcastCtrl({type:'seek', t: video.currentTime, paused:true});
  } 
  btnPlayPause.addEventListener('click', async ()=>{
  if(mode === 'host'){
    if(video.paused){
      await video.play().catch(()=>{});
      broadcastCtrl({type:'play'});
    }else{
      video.pause();
      broadcastCtrl({type:'pause'});
    }
  }else{
    // Viewer: keep buttons visible, but disable interaction.
    // Snap back to the last host-auth state.
    applyHostAuthoritativeState(true);
  }
});

  // Click video area to toggle play/pause
  on(video,'click', (e)=>{
  if(mode !== 'host') return; // viewers use click only for autoplay-unlock/unmute
    e.preventDefault();
    btnPlayPause?.click();
  });

btnRewind.addEventListener('click', ()=> seekBy(-10));
  btnFwd.addEventListener('click', ()=> seekBy(10));
  btnStepBack.addEventListener('click', ()=> frameStep(-1));
  btnStepFwd.addEventListener('click', ()=> frameStep(1));
  btnSync.addEventListener('click', ()=> broadcastState());

  let scrubTimer = null;
  video.addEventListener('seeked', ()=>{
    if(mode !== 'host') return;
    clearTimeout(scrubTimer);
    scrubTimer = setTimeout(()=> broadcastCtrl({type:'seek', t: video.currentTime, paused: video.paused}), 120);
  });
  video.addEventListener('play', ()=>{ if(mode==='host') broadcastCtrl({type:'play'}); });
  video.addEventListener('pause', ()=>{ if(mode==='host') broadcastCtrl({type:'pause'}); });
  // Keep external audio in sync with video
  video.addEventListener('play', ()=>{ if(audioMode==='external') applyAudioRouting(); });
  video.addEventListener('pause', ()=>{ if(audioMode==='external'){ try{ audioEl.pause(); }catch{} } });
  video.addEventListener('seeking', ()=>{ if(audioMode==='external' && audioEl && audioEl.src){ try{ audioEl.currentTime = video.currentTime || 0; }catch{} } });
  video.addEventListener('ratechange', ()=>{ if(audioMode==='external' && audioEl && audioEl.src){ try{ audioEl.playbackRate = video.playbackRate || 1; }catch{} } });
  video.addEventListener('volumechange', ()=>{ if(audioEl){ try{ audioEl.volume = video.volume; audioEl.muted = video.muted; }catch{} } });


  // -----------------------------
  // Fullscreen / PiP
  // -----------------------------
  if(btnFullscreen){
    btnFullscreen.addEventListener('click', async ()=>{
      const el = playerShell || stage;
      if(document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen().catch(()=>{});
    });
  }


  
  // In fullscreen, reveal controls on interaction
  (playerShell || stage).addEventListener('mousemove', showFsControls);
  (playerShell || stage).addEventListener('touchstart', showFsControls, {passive:true});

  if(btnPip){
    btnPip.addEventListener('click', async ()=>{
      if(!document.pictureInPictureEnabled) return toast('PiP not supported');
      try{
        if(document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch {
        toast('PiP failed');
      }
    });
  }

  // -----------------------------
  // Keyboard shortcuts
  // -----------------------------
  window.addEventListener('keydown', (e)=>{
    try{
      const tag = (e.target && e.target.tagName ? String(e.target.tagName).toLowerCase() : '');
      if(tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      // Viewers: keep controls visible but make transport keys inert (volume keys still allowed).
      if(mode !== 'host'){
        // Never block browser/system shortcuts (refresh, devtools, new tab, etc.)
        if(e.ctrlKey || e.metaKey) return;
        // Allow function keys commonly used for refresh/devtools
        if(e.key === 'F5' || e.key === 'F12') return;

        const k = e.key;
        const code = e.code;
        // Block transport / seeking / fullscreen shortcuts for viewers
        const lower = (typeof k === 'string') ? k.toLowerCase() : '';
        const isBlocked = viewerBlockedKeys.has(k) || code === 'Space' || lower === 'f' || lower === 'm' || lower === ',' || lower === '.';
        if(isBlocked){
          e.preventDefault();
          e.stopPropagation();
          applyHostAuthoritativeState(true);
        }
        // Allow volume keys (ArrowUp/ArrowDown) to change local volume
        if(k === 'ArrowUp'){ e.preventDefault(); bumpVolume(e.shiftKey ? 0.10 : 0.05); }
        if(k === 'ArrowDown'){ e.preventDefault(); bumpVolume(e.shiftKey ? -0.10 : -0.05); }
        return;
      }

      // Host shortcuts
      if(e.code === 'Space'){
        e.preventDefault();
        btnPlayPause?.click?.();
        return;
      }
      if(e.key && e.key.toLowerCase() === 'f') btnFullscreen?.click?.();
      if(e.key && e.key.toLowerCase() === 'm'){ video.muted = !video.muted; syncMuteIcon(); }

      const shift = e.shiftKey;
      const step = shift ? 15 : 5;
      if(e.key === 'ArrowLeft'){ e.preventDefault(); seekBy(-step); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); seekBy(step); }

      // Volume (Up/Down) applies locally (host too)
      if(e.key === 'ArrowUp'){ e.preventDefault(); bumpVolume(e.shiftKey ? 0.10 : 0.05); }
      if(e.key === 'ArrowDown'){ e.preventDefault(); bumpVolume(e.shiftKey ? -0.10 : -0.05); }

      if(e.key === ','){ e.preventDefault(); frameStep(-1); }
      if(e.key === '.'){ e.preventDefault(); frameStep(1); }
    } catch(err){
      try{ addLog(`Key handler error: ${err?.message || err}`, 'err'); }catch{}
    }
  }, true);

  // -----------------------------
  // WebRTC: peer creation
  // -----------------------------
  function makePeerId(){
    return crypto.randomUUID().slice(0, 8);
  }

  function addMember(name){
    const div = document.createElement('div');
    div.className = 'member';
    div.textContent = name;
    membersEl.appendChild(div);
  }

  function renderMembers(){
    membersEl.innerHTML = '';

    const youName = clampStr(displayName.value, 30) || (mode === 'host' ? 'Host' : 'Viewer');
    if(mode === 'host'){
      addMember(`👑 ${youName} (you)`);
    }else if(mode === 'viewer'){
      addMember(`${youName} (you)`);
    }

    // Peers: show a crown for the active host
    for(const p of peers.values()){
      const nm = p.name || (p.role === 'host' ? 'Host' : 'Viewer');
      if(p.role === 'host') addMember(`👑 ${nm}`);
      else addMember(nm);
    }
  }


function createPeer({asHost, forcedPeerId=null}){
  const peerId = forcedPeerId || makePeerId();
  const pc = new RTCPeerConnection(RTC_CFG);

  // IMPORTANT: register peer record BEFORE creating/receiving a datachannel
  // so setupDataChannel() never sees an undefined peer.
  peers.set(peerId, {pc, dc: null, name: null});

  let dc = null;
  if(asHost){
    // FIX: Pre-create senders for stable media delivery
    const vTx = pc.addTransceiver("video", { direction: "sendonly" });
    const aTx = pc.addTransceiver("audio", { direction: "sendonly" });
    const peerRec = peers.get(peerId);
    if(peerRec) peerRec._senders = { video: vTx.sender, audio: aTx.sender };
    dc = pc.createDataChannel('peerwatch', {ordered:true});
    peers.get(peerId).dc = dc;
    setupDataChannel(peerId, dc);
  } else {
    pc.ondatachannel = (e)=>{
      dc = e.channel;
      // ensure we keep the latest dc reference
      const p = peers.get(peerId) || {pc, dc: null, name: null};
      p.pc = pc;
      p.dc = dc;
      peers.set(peerId, p);
      setupDataChannel(peerId, dc);
    };
  }

  pc.oniceconnectionstatechange = () => {
    const s = pc.iceConnectionState;
    if(s === 'connected' || s === 'completed'){
      setStatus(true, 'Connected');
      addLog(`Peer ${peerId}: ICE ${s}`, 'sys');
    }
    if(s === 'failed' || s === 'disconnected'){
      setStatus(false, `Connection ${s}`);
      addLog(`Peer ${peerId}: ICE ${s}`, 'err');
    }
  };

  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if(s === 'connected'){
      setStatus(true, 'Connected');
      addLog(`Peer ${peerId}: connected`, 'sys');
      if(mode === 'host'){
        sendAllHostVttsToDc(dc);
        broadcastStateToPeer(peerId);
      }
    }
    if(s === 'closed') addLog(`Peer ${peerId}: closed`, 'sys');
  };

  if(!asHost){
    pc.ontrack = (ev) => {
      // FIX: Some browsers fire ontrack with ev.streams empty; use ev.track as fallback.
      if(ev.streams && ev.streams[0]){
        for(const tr of ev.streams[0].getTracks()) remoteStream.addTrack(tr);
      } else if (ev.track) {
        remoteStream.addTrack(ev.track);
      }
      showOverlay(false);
      updateDropHintForMedia();
      // Autoplay can be flaky when tracks arrive after user interaction.
      // Try to start playback; if blocked, keep overlay visible so user can click play.
      video.play().catch(()=>{ showOverlay(true); });
    };
  }

  activePeerId = peerId;
  updateSubsUiForRole();
  renderMembers();

  return peerId;
}

function setupDataChannel(peerId, dc){
  let peer = peers.get(peerId);
  if(!peer){
    // Fallback safety: create a placeholder peer record
    peer = {pc: null, dc: null, name: null};
    peers.set(peerId, peer);
  }
  peer.dc = dc;

    dc.onopen = () => {
      addLog(`Data channel open (${peerId})`, 'sys');
      setStatus(true, 'Connected');

      const name = clampStr(displayName.value, 30) || (mode === 'host' ? 'Host' : 'Viewer');
      dc.send(JSON.stringify({t: MSG.hello, name, role: mode}));

      if(!syncTimer) startSyncLoop();

      if(mode === 'host'){
        sendAllHostVttsToDc(dc);
        broadcastStateToPeer(peerId);
      }
    };

    dc.onmessage = (e) => {
      let msg;
      try{ msg = JSON.parse(e.data); } catch { return; }
      handleMessage(peerId, msg);
    };

    dc.onclose = () => {
      addLog(`Data channel closed (${peerId})`, 'sys');
    };
  }

  function broadcastStateToPeer(peerId){
    if(mode !== 'host') return;
    const peer = peers.get(peerId);
    if(peer?.dc?.readyState !== 'open') return;
    peer.dc.send(JSON.stringify({t: MSG.ctrl, at: Date.now(), payload:{
      type:'state', paused: video.paused, t: video.currentTime, rate: video.playbackRate, subs: subsEnabled
    }}));
    // Also send current subtitle style
    try{ peer.dc.send(JSON.stringify({t: MSG.subsStyle, style: subsStyle})); }catch(e){}
  }

  function handleMessage(peerId, msg){
    const peer = peers.get(peerId);

    if(msg.t === MSG.hello){
      peer.name = msg.name || 'Friend';
      peer.role = (msg.role === 'host' ? 'host' : 'viewer');

      addLog(`${peer.name} joined`, 'sys');

      // Enforce single-host: if I'm already host, demote any other peer that claims host.
      if(mode === 'host' && peer.role === 'host'){
        try{ peer.dc?.send(JSON.stringify({t: MSG.hostTaken})); }catch(_){}
        peer.role = 'viewer';
      }

      // Viewer chooses exactly one authoritative host (first host we see).
      if(mode === 'viewer'){
        if(peer.role === 'host' && !authoritativeHostPeerId){
          authoritativeHostPeerId = peerId;
          addLog(`Host set: ${peer.name}`, 'sys');
        }
      }

      updateSubsUiForRole();
      renderMembers();
      return;
    }

    if(msg.t === MSG.chat){
      addChatLine(msg.from || 'Friend', msg.text || '', 't');
      showVideoMessage(msg.from || 'Friend', msg.text || '');
      return;
    }

    if(msg.t === MSG.hostTaken){
      if(mode === 'host'){
        toast('Another host is already active — switching you to Viewer');
        // Do NOT consult any saved/remembered session here.
        // Switch roles in-place and re-join the *current* room as a viewer.
        const rid = normalizeRoomId(sessionRoomId);
        setMode('viewer');
        disconnectAll();
        if(rid){
          setRoomId(rid);
          setStatus(false, 'Connecting…');
          connectSignaling('viewer', rid);
        }else{
          setRoomId('');
          setStatus(false, 'Not connected');
        }

      }
      return;
    }

    if(msg.t === MSG.vtt && mode === 'viewer'){
      if(authoritativeHostPeerId && peerId !== authoritativeHostPeerId) return;
      if(!authoritativeHostPeerId && peer?.role === 'host') authoritativeHostPeerId = peerId;
      const id = (msg.id || (crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : String(Date.now())));
      const name = msg.name || 'Subtitles';
      // Avoid duplicates if host re-sends on reconnect
      if(!subsBank.some(t => t.id === id)){
        addSubsTrack({id, name, vtt: msg.vtt, source: 'remote', broadcast: false});
        toast('Subtitles received');
      }
      return;
    }

    if(msg.t === MSG.subsStyle && mode === 'viewer'){
      if(authoritativeHostPeerId && peerId !== authoritativeHostPeerId) return;
      if(!authoritativeHostPeerId && peer?.role === 'host') authoritativeHostPeerId = peerId;
      applySubsStyle(msg.style);
      return;
    }


    if(msg.t === MSG.ctrl && mode === 'host'){
      // Viewer drift report → send per-viewer correction
      const p = msg.payload || {};
      if(p.type === 'report'){
        const viewerT = Number(p.t);
        const hostT = Number(video.currentTime || 0);
        if(Number.isFinite(viewerT)){
          const drift = hostT - viewerT; // + means viewer is behind
          let reply;

          // Avoid "rubber-banding" backwards: only hard-snap when the viewer is BEHIND a lot.
          // If the viewer is AHEAD, we slow/pause instead of seeking backwards (seeking back looks like looping).
          if(drift >= 3){
            // Viewer behind: snap forward to host.
            reply = {type:'sync', action:'snap', t: hostT, paused: video.paused, rate: 1};
          }else if(drift <= -10){
            // Viewer way ahead (rare): allow a hard snap back.
            reply = {type:'sync', action:'snap', t: hostT, paused: video.paused, rate: 1};
          }else{
            // Gentle converge: nudge rate (or pause if slightly ahead).
            let suggested = 1;

            if(drift > 0.4){
              // behind → speed up slightly
              suggested = 1 + clamp(drift * 0.03, 0, 0.10); // up to 1.10
            }else if(drift < -0.4){
              // ahead → slow down slightly
              suggested = 1 - clamp((-drift) * 0.03, 0, 0.10); // down to 0.90
            }else{
              suggested = 1;
            }

            reply = {type:'sync', action:'rate', t: hostT, paused: video.paused, rate: suggested};
          }

          try{ peer?.dc?.send(JSON.stringify({t: MSG.ctrl, at: Date.now(), payload: reply})); }catch(_){}
        }
      }
      return;
    }

    if(msg.t === MSG.ctrl && mode === 'viewer'){
      if(authoritativeHostPeerId && peerId !== authoritativeHostPeerId) return;
      if(!authoritativeHostPeerId && peer?.role === 'host') authoritativeHostPeerId = peerId;
      applyRemoteControl(msg.payload);
      return;
    }

    if(msg.t === MSG.ping){
      peer.dc?.send(JSON.stringify({t: MSG.pong, at: msg.at}));
      return;
    }

    if(msg.t === MSG.pong){
      const nowT = performance.now();
      const sentT = peer._pingSentAt || nowT;
      rttMs = Math.round(nowT - sentT);
      return;
    }
  }

  function applyRemoteControl(payload){
    if(!payload) return;
    // Track last authoritative host state so viewers can snap back when they
    // try to interact (play/pause/seek/etc.).
    if(mode === 'viewer'){
      if(payload.type === 'play') hostAuthState.paused = false;
      if(payload.type === 'pause') hostAuthState.paused = true;
      if(payload.type === 'seek'){
        if(Number.isFinite(Number(payload.t))) hostAuthState.t = Number(payload.t);
        if(payload.paused) hostAuthState.paused = true;
      }
      if(payload.type === 'state'){
        hostAuthState.paused = !!payload.paused;
        hostAuthState.rate = Number(payload.rate ?? 1) || 1;
        if(Number.isFinite(Number(payload.t))) hostAuthState.t = Number(payload.t);
      }
      hostAuthState.updatedAt = Date.now();
    }

    if(payload.type === 'load-url'){
      video.srcObject = null;
      video.src = payload.url;
      showOverlay(false);
      updateDropHintForMedia();
      // Try autoplay; user gesture may be needed on mobile.
      video.play().catch(()=>{});
      return;
    }

    if(payload.type === 'load-seg'){
      // New: MSE segmented playback
      startSegmentedPlayback(payload).catch((err)=>{
        addLog('Segmented playback failed: ' + (err?.message || err), 'err');
      });
      return;
    }
    if(payload.type === 'play') video.play().catch(()=>{});
    if(payload.type === 'pause') video.pause();
    if(payload.type === 'seek'){
      if(payload.paused) video.pause();
      const target = Number(payload.t ?? video.currentTime);
      // If we're in segmented (MSE) mode and the host jumps far, recreate
      // the pipeline starting near the target time.
      if(segmentedCtl && segmentedCtl.videoId){
        const cur = Number(video.currentTime || 0);
        if(Math.abs(cur - target) > 2){
          startSegmentedPlayback({
            videoId: segmentedCtl.videoId,
            segmentDurationMs: segmentedCtl.segDurMs * 1000,
            startTime: target,
            mime: segmentedCtl.mime,
            codecs: segmentedCtl.codecs
          }).catch(()=>{});
          return;
        }
      }
      video.currentTime = target;
    }
    if(payload.type === 'rate'){
      setPlaybackRate(payload.rate ?? 1);
    }
    if(payload.type === 'subs') setSubsEnabled(!!payload.enabled);
    if(payload.type === 'audioSrc'){
      const m = (payload.mode === 'external') ? 'external' : 'video';
      audioMode = m;
      if(audioSourceSelect) audioSourceSelect.value = m;
      applyDesiredAudioState();
      applyAudioRouting();
    }
    if(payload.type === 'sync'){
      // Host-directed per-viewer drift correction
      const target = Number(payload.t);
      if(Number.isFinite(target) && !video.seeking){
        const cur = Number(video.currentTime || 0);
        const drift = target - cur;
        const abs = Math.abs(drift);

        // Keep play/pause aligned
        if(payload.paused){
          if(!video.paused) video.pause();
        } else {
          if(video.paused) video.play().catch(()=>{});
        }

        if(payload.action === 'snap' || (abs >= 3 && drift > 0)){
          try{ video.playbackRate = 1; }catch(_){ }
          try{ video.currentTime = target; }catch(_){ }
        }else{
          // Apply suggested rate temporarily; reset to 1 before next report if close enough
          const suggested = Number(payload.rate);
          if(Number.isFinite(suggested)){
            try{ video.playbackRate = suggested; }catch(_){}
            // If we're now basically aligned, normalize rate
            if(abs < 0.15){
              try{ video.playbackRate = 1; }catch(_){}
            }
          }
        }
      }
      return;
    }



    if(payload.type === 'room'){
      currentRoomName = clampStr(payload.name, 30) || 'Room';
      // Keep viewer UI in sync
      if(roomName) roomName.value = currentRoomName;
      syncRoomName(false);
      updateChatTitle(currentRoomName);
    }
    if(payload.type === 'state'){
      // Viewer drift correction target (host time extrapolation)
      if(mode === 'viewer'){
        try{
          hostSyncTarget.t = Number(payload.t ?? 0) || 0;
          hostSyncTarget.rate = Number(payload.rate ?? 1) || 1;
          hostSyncTarget.paused = !!payload.paused;
          hostSyncTarget.receivedAt = performance.now();
        }catch(_){ }
      }
      setPlaybackRate(payload.rate ?? 1);
      setSubsEnabled(payload.subs !== false);
      const t = payload.t ?? 0;
      if(segmentedCtl && segmentedCtl.videoId && Math.abs((video.currentTime||0) - t) > 2){
        startSegmentedPlayback({
          videoId: segmentedCtl.videoId,
          segmentDurationMs: segmentedCtl.segDurMs,
          startTime: t,
          mime: segmentedCtl.mime,
          codecs: segmentedCtl.codecs
        }).catch(()=>{});
      } else if(Math.abs(video.currentTime - t) > 0.15) {
        video.currentTime = t;
      }
      if(payload.paused) video.pause(); else video.play().catch(()=>{});
    }
  }

  
function buildOutgoingStream(){
  if(!videoStream) return null;
  const s = new MediaStream();
  const v = videoStream.getVideoTracks?.()[0];
  if(v) s.addTrack(v);
  let a = null;
  if(audioMode === 'external' && externalAudioStream){
    a = externalAudioStream.getAudioTracks?.()[0] || null;
  }
  if(!a){
    a = videoStream.getAudioTracks?.()[0] || null;
  }
  if(a) s.addTrack(a);
  return s;
}

function applyDesiredAudioState(){
  // Apply desired volume/mute to the currently audible element
  try{ video.volume = desiredVolume; }catch{}
  try{ audioEl.volume = desiredVolume; }catch{}
  const useExternal = (audioMode === 'external' && audioEl && audioEl.src);
  if(useExternal){
    // video is forced muted to prevent double playback
    try{ video.muted = true; }catch{}
    try{ audioEl.muted = !!desiredMuted || Number(desiredVolume) === 0; }catch{}
  }else{
    try{ audioEl.muted = true; }catch{}
    try{ video.muted = !!desiredMuted || Number(desiredVolume) === 0; }catch{}
  }
}

function applyAudioRouting(){
  const useExternal = (audioMode === 'external' && audioEl && audioEl.src);
  if(useExternal){
    // Prevent double playback: video output muted, external audio is the only audible source
    try{ video.muted = true; }catch{}
    try{ audioEl.muted = !!desiredMuted || Number(desiredVolume) === 0; }catch{}
    try{ video.volume = desiredVolume; }catch{}
    try{ audioEl.volume = desiredVolume; }catch{}
    try{ audioEl.playbackRate = video.playbackRate || 1; }catch{}
    // Align time; avoid fighting the user while scrubbing by only nudging when drift is noticeable
    try{
      const vt = Number(video.currentTime||0);
      if(Number.isFinite(vt)){
        const at = Number(audioEl.currentTime||0);
        if(!Number.isFinite(at) || Math.abs(at - vt) > 0.15) audioEl.currentTime = vt;
      }
    }catch{}
    if(!video.paused){ audioEl.play().catch(()=>{}); }
    else{ try{ audioEl.pause(); }catch{} }
  }else{
    // Video audio is the only audible source
    try{ audioEl.pause(); }catch{}
    try{ audioEl.muted = true; }catch{}
    try{ audioEl.volume = desiredVolume; }catch{}
    try{ video.volume = desiredVolume; }catch{}
    try{ video.muted = !!desiredMuted || Number(desiredVolume) === 0; }catch{}
  }
}

function updateOutgoingStreamAndPeers(){
  outgoingStream = buildOutgoingStream();
  localStream = outgoingStream; // keep existing code working
  for(const {pc} of peers.values()){
    replaceTracks(pc);
  }
}

function replaceTracks(pc){
  if(!localStream) return;

  // Find the peer record for this pc
  let peerRec = null;
  for (const p of peers.values()){
    if(p?.pc === pc){ peerRec = p; break; }
  }

  const desired = {
    video: localStream.getVideoTracks?.()[0] || null,
    audio: localStream.getAudioTracks?.()[0] || null
  };

  // Prefer stored senders (from transceivers) so we can replaceTrack without renegotiation.
  const sendersByKind = peerRec?._senders || {};
  for (const kind of ['video','audio']){
    const tr = desired[kind];
    const sender = sendersByKind[kind] || pc.getSenders().find(s => (s.track?.kind) === kind);
    if(sender){
      sender.replaceTrack(tr);
    } else if (tr) {
      // Fallback if no sender exists (should be rare after transceiver pre-create)
      pc.addTrack(tr, localStream);
    }
  }
}

  // -----------------------------
  // Signaling: manual offer/answer
  // -----------------------------
  
  // -----------------------------
  // WebSocket-driven offer/answer
  // -----------------------------
  async function hostCreateOfferForViewer(viewerId, viewerName){
    if(mode !== 'host') return;
    // Allow a datachannel-only connection even when no video is loaded yet.
    // This keeps chat + room metadata live, and we can re-offer later once media is available.

    // If viewer is reconnecting, drop previous pc
    if(peers.has(viewerId)){
      try{ peers.get(viewerId).pc?.close?.(); }catch{}
      peers.delete(viewerId);
    }

    const peerId = createPeer({asHost:true, forcedPeerId: viewerId});
    const {pc} = peers.get(peerId);
    peers.get(peerId).name = viewerName || 'Viewer';
    peers.get(peerId).role = 'viewer';

    // Add tracks when available (otherwise, datachannel-only)
    if(localStream){
      for(const t of localStream.getTracks()){
        pc.addTrack(t, localStream);
      }
      // Also send audio track if external audio enabled
      try{
        if(audioStream){
          for(const t of audioStream.getTracks()){
            pc.addTrack(t, audioStream);
          }
        }
      }catch{}
    }

    const off = await pc.createOffer();
    await pc.setLocalDescription(off);
    await waitForIceGathering(pc);

    wsSend({
      type:'offer',
      v:1,
      roomId: sessionRoomId,
      to: viewerId,
      from: clientId,
      peerId,
      sdp: pc.localDescription,
      meta: {
        name: clampStr(displayName?.value || '', 30) || 'Host',
        room: (clampStr(roomName?.value || '', 30) || 'Room')
      }
    });

    renderMembers();
    addLog(`Sent offer to ${viewerName || 'Viewer'}.`, 'sys');
  }

  async function viewerHandleOffer(msg){
    try{
      const inObj = msg || {};
      if(inObj?.meta?.room){
        currentRoomName = clampStr(inObj.meta.room, 30) || 'Room';
        syncRoomName(false);
      }

      const peerId = String(inObj.peerId || inObj.from || '');
      if(!peerId) return;

      // Replace existing connection on refresh / rejoin
      if(peers.has(peerId)){
        try{ peers.get(peerId).pc?.close?.(); }catch{}
        peers.delete(peerId);
      }

      const pid = createPeer({asHost:false, forcedPeerId: peerId});
      const {pc} = peers.get(pid);

      await pc.setRemoteDescription(inObj.sdp);
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      await waitForIceGathering(pc);

      wsSend({
        type:'answer',
        v:1,
        roomId: sessionRoomId,
        to: String(inObj.from || hostIdInRoom || ''),
        from: clientId,
        peerId: pid,
        sdp: pc.localDescription,
        meta: { name: clampStr(displayName?.value || '', 30) || 'Viewer' }
      });

      addLog('Auto-joined host. Sending answer…', 'sys');
      renderMembers();
    }catch(err){
      console.error(err);
      addLog('Auto-join failed: ' + (err?.message || err), 'err');
    }
  }

  async function hostApplyAnswer(msg){
    try{
      const inObj = msg || {};
      const peerId = String(inObj.peerId || inObj.from || '');
      const peer = peers.get(peerId);
      if(!peer){
        addLog('Received answer for unknown peer. Viewer may have reloaded; waiting for rejoin…', 'err');
        return;
      }
      await peer.pc.setRemoteDescription(inObj.sdp);
      if(inObj.meta?.name) peer.name = inObj.meta.name;

      updateSubsUiForRole?.();
      renderMembers();
      addLog(`Viewer connected: ${peer.name || 'Viewer'}`, 'sys');
    }catch(err){
      console.error(err);
      addLog('Apply answer failed: ' + (err?.message || err), 'err');
    }
  }

function waitForIceGathering(pc){

    return new Promise((resolve) => {
      if(pc.iceGatheringState === 'complete') return resolve();
      const on = () => {
        if(pc.iceGatheringState === 'complete'){
          pc.removeEventListener('icegatheringstatechange', on);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', on);
      setTimeout(()=> resolve(), 1500);
    });
  }
  on(btnShare,'click', async ()=>{
    // Share: ONLY copies the current room link.
    const rid = normalizeRoomId(sessionRoomId) || '';
    if(!rid) return toast('No active room. Start a new room or join one.');
    // Ensure we always use the latest normalized value
    sessionRoomId = rid;
    const url = buildShareLink();
    await copyToClipboard(url);
  });



  // Connection helpers (Room)
  function setRoomId(newRoom){
    sessionRoomId = normalizeRoomId(newRoom) || '';
    saveSession();
    updateRoomUI();
  }

    on(roomCode,'click', async ()=>{
    const rid = normalizeRoomId(sessionRoomId) || '';
    if(!rid) return;
    await copyToClipboard(rid);
    toast('Room number copied.');
  });

on(btnNewRoom,'click', async ()=>{
    // New Room: generate a random 8-digit room number.
    // This should ONLY generate a new code for the user to join/share.
    // It must NOT change the Current Room display (which reflects the room you're actually in).
    const newId = makeRoomId();
    if(joinRoomInput){ joinRoomInput.value = newId.slice(0,4) + ' ' + newId.slice(4); }
    // (No auto-copy on New Room)
    const inActiveRoom = !!(ws && ws.readyState === 1 && sessionRoomId);
    toast(inActiveRoom
      ? 'New room number generated. Current room unchanged.'
      : 'New room number generated. Click Join to enter it.');
  });


  on(btnJoinRoom,'click', ()=>{
    const desired = normalizeRoomId(joinRoomInput?.value || '');
    if(!desired) return toast('Enter an 8-digit room number');
    setMode('viewer');
    disconnectAll();
    try{ ws?.close?.(); }catch(_){}
    ws = null; wsReady = false; hostIdInRoom = null;

    setRoomId(desired);
    setRoomInAddressBar(desired);
    connectSignaling('viewer', desired);
    toast('Joining room ' + desired);
  });
  // -----------------------------
  // Sync loop
  // -----------------------------
  // Every ~3s viewers report their currentTime to the host.
  // The host replies with a per-viewer correction instruction:
  // - If drift is large (>=3s): snap to host time
  // - Otherwise: temporary playbackRate nudge to converge smoothly
  function startSyncLoop(){
    if(syncTimer) return;

    // Lightweight RTT pings (for diagnostics)
    syncTimer = setInterval(() => {
      for(const peer of peers.values()){
        if(peer.dc?.readyState === 'open'){
          peer._pingSentAt = performance.now();
          peer.dc.send(JSON.stringify({t: MSG.ping, at: Date.now()}));
          break;
        }
      }
    }, 1200);

    // Viewer → Host drift reports
    if(!reportTimer){
      reportTimer = setInterval(() => {
        if(mode !== 'viewer') return;
        const hostPeer = authoritativeHostPeerId ? peers.get(authoritativeHostPeerId) : null;
        if(!hostPeer?.dc || hostPeer.dc.readyState !== 'open') return;
        // Don't fight the user while scrubbing
        if(video.seeking) return;
        // Only report if we have something playing/loaded
        const t = Number(video.currentTime || 0);
        hostPeer.dc.send(JSON.stringify({t: MSG.ctrl, at: Date.now(), payload:{type:'report', t}}));
      }, 3000);
    }
  }

  function stopSyncLoop(){
    if(syncTimer){
      try{ clearInterval(syncTimer); }catch{}
      syncTimer = null;
    }
    if(reportTimer){
      try{ clearInterval(reportTimer); }catch{}
      reportTimer = null;
    }
  }


  // -----------------------------
  // Chat
  // -----------------------------
  function sendChat(){
    const text = chatMsg.value.trim();
    if(!text) return;
    chatMsg.value = '';

    const name = clampStr(displayName.value, 30) || (mode === 'host' ? 'Host' : 'Me');
    setNameFor(clientId, name);
    addChatLine(name, text, 'me', clientId);
    showVideoMessage(name, text);

    const msg = {t: MSG.chat, clientId, from: name, text};

    let sentOverDc = false;
    for(const peer of peers.values()){
      if(peer.dc?.readyState === 'open'){
        try{ peer.dc.send(JSON.stringify(msg)); sentOverDc = true; }catch{}
      }
    }

    // Fallback to WebSocket relay so chat works even if no host/video/peer connection yet.
    if(!sentOverDc && wsReady){
      wsSend({type:'chat', from: name, text, roomId: sessionRoomId, clientId});
    }
  }
  on(btnSend,'click', sendChat);
  on(chatMsg,'keydown', (e)=>{ if(e.key === 'Enter') sendChat(); });

  // Fullscreen quick-chat: press "c" to compose a message in the top-right overlay.
  function _vmIsFullscreen(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }
  function _vmIsTypingTarget(el){
    if(!el) return false;
    const t = (el.tagName||'').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
  }
  function _vmOpenComposer(){
    if(!videoMsgComposer || !videoMsgComposeInput) return;
    updateVideoMsgMetrics();
    // Ensure overlay exists even if "Video Messages" toggle is off (composer is still usable)
    if(videoMsgOverlay) videoMsgOverlay.classList.add('on');

    videoMsgComposer.classList.add('on');
    videoMsgComposer.setAttribute('aria-hidden','false');
    videoMsgComposeInput.value = '';
    // Focus after a tick to avoid fullscreen key event quirks
    setTimeout(()=> videoMsgComposeInput.focus(), 0);
  }
  function _vmCloseComposer(){
    if(!videoMsgComposer) return;
    videoMsgComposer.classList.remove('on');
    videoMsgComposer.setAttribute('aria-hidden','true');
  }
  function _vmSendComposer(){
    const v = (videoMsgComposeInput?.value ?? '').trim();
    if(!v) { _vmCloseComposer(); return; }
    // Reuse existing chat pipeline so everyone receives it
    chatMsg.value = v;
    sendChat();
    _vmCloseComposer();
  }
  on(videoMsgComposeSend,'click', _vmSendComposer);
  on(videoMsgComposeCancel,'click', _vmCloseComposer);
  on(videoMsgComposeInput,'keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); _vmSendComposer(); }
    if(e.key === 'Escape'){ e.preventDefault(); _vmCloseComposer(); }
  });

  document.addEventListener('keydown', (e)=>{
    if((e.key === 'c' || e.key === 'C') && _vmIsFullscreen()){
      if(_vmIsTypingTarget(e.target)) return;
      e.preventDefault();
      _vmOpenComposer();
      return;
    }
    if(e.key === 'Escape' && videoMsgComposer?.classList.contains('on')){
      e.preventDefault();
      _vmCloseComposer();
    }
  });
  // -----------------------------
  // Snapshot + stats
  // -----------------------------
  on(btnSnapshot,'click', ()=>{
    try{
      const c = document.createElement('canvas');
      c.width = video.videoWidth || 1280;
      c.height = video.videoHeight || 720;
      const ctx = c.getContext('2d');
      ctx.drawImage(video, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snapshot.png';
      a.click();
      toast('Snapshot saved');
    } catch {
      toast('Snapshot failed');
    }
  });

  on(btnStats,'click', async ()=>{
    const first = peers.values().next().value;
    if(!first) return toast('No peer');
    try{
      const stats = await first.pc.getStats();
      let out = [];
      stats.forEach(r => {
        if(r.type === 'outbound-rtp' && r.kind === 'video'){
          out.push(`Outbound video: ${Math.round(r.bitrateMean || 0)} bps, framesEncoded=${r.framesEncoded}`);
        }
        if(r.type === 'inbound-rtp' && r.kind === 'video'){
          out.push(`Inbound video: framesDecoded=${r.framesDecoded}, packetsLost=${r.packetsLost}`);
        }
        if(r.type === 'candidate-pair' && r.state === 'succeeded' && r.nominated){
          out.push(`RTT: ${Math.round((r.currentRoundTripTime||0)*1000)} ms`);
        }
      });
      if(rttMs != null) out.push(`App ping RTT: ${rttMs} ms`);
      addLog('<b>Stats</b><br>' + out.map(escapeHtml).join('<br>'), 'sys');
      toast('Stats logged');
    } catch {
      toast('Stats failed');
    }
  });

  // -----------------------------
  // Disconnect
  // -----------------------------
  function disconnectAll(){
    stopSyncLoop();
    try{ clearTimeout(scrubTimer); }catch{}
    scrubTimer = null;

    // Close signaling socket as well (previously left open -> inconsistent "Not connected" state).
    closeSignaling('disconnect');

    for(const [id, p] of Array.from(peers.entries())){
      try{ p.dc?.close(); } catch {}
      try{ p.pc?.close(); } catch {}
      peers.delete(id);
    }
    activePeerId = null;
    updateSubsUiForRole();
    renderMembers();
    setStatus(false, 'Not connected');
  }
  on(btnDisconnect,'click', ()=>{
    disconnectAll();
    if(mode === 'viewer') remoteStream = new MediaStream(), video.srcObject = remoteStream;
    setRoomId('');
    toast('Disconnected');
  });

  // -----------------------------
  // Autoplay UX
  // -----------------------------
  on(video,'timeupdate', syncSeekUI);
  on(video,'play', syncPlayButtons);
  on(video,'pause', syncPlayButtons);

  video.addEventListener('loadedmetadata', ()=>{
    video.volume = Number(vol.value);
    setPlaybackRate(video.playbackRate || 1);
    if(timeDur) timeDur.textContent = fmtTime(video.duration || 0);
    syncSeekUI();
    syncPlayButtons();

    try{
      if(video.textTracks && video.textTracks.length){
        subsEnabled = true;
        for(const t of video.textTracks) t.mode = 'showing';
        toast('Embedded subtitles detected');
        if(mode === 'host') broadcastCtrl({type:'subs', enabled:true});
      }
    } catch {}
  });

  // -----------------------------
  // Init (hardened)
  // -----------------------------
  try{
    loadPrefs();
    initThemePicker();
    initSubsFontPicker();
    setMode('viewer');
    applyTheme(themeSel?.value || document.documentElement.dataset.theme || 'mono');
    syncPlayButtons();
    syncAccentDerived();
    // Auto-join ONLY from an explicit share link (?room=12345678 or #room=12345678).
    // Do NOT auto-join any previously saved/remembered room, since that can conflict with shared links.
    const urlRoom = normalizeRoomId(parseRoomFromUrl());

    if(urlRoom){
      setRoomId(urlRoom);
      setStatus(false, 'Connecting…');
      connectSignaling('viewer', urlRoom);
    }else{
      // No implicit reconnect / auto-join.
      setRoomId('');
      setStatus(false, 'Not connected');
      // Default to Viewer mode when not joining a room
      setMode('viewer');
    }

    updateChatTitle('');

    addLog('Ready. Drop a video to start hosting, or open a share link to join instantly.', 'sys');
  }catch(err){
    console.error(err);
    try{ addLog('Init failed: ' + (err?.message || err), 'err'); } catch {}
    toast('Init failed (see console/log)');
  }


});
