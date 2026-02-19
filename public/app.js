try{if(!window.__WW_DEBUG_ON){const dc=document.getElementById("debugCard");if(dc)dc.remove();}}catch{};function __pwShareBase(){try{const u=new URL(location.href);u.searchParams.delete("room");u.searchParams.delete("debug");u.hash="";return u.origin+u.pathname}catch(e){return location.origin+location.pathname}}window.addEventListener("DOMContentLoaded",()=>{"use strict";
const App=window.__WW_APP__||{ui:{},state:{},stream:{},peers:{},audio:{},dbg:{}};window.__WW_APP__=App;App.state.hostPresent=false;App.state.hostId=null;App.state.hostClock={t:0,d:0,paused:true,rate:1,updatedAt:0};App.state.viewerFrozen=false;App.state.viewerFreezeT=0;try{App.audio.viewerVol=void 0;App.audio.viewerUnmuted=void 0;}catch{}let __pwHostTimeTimer=null;let __pwLastDur=0;let __pwDurSent=false;function __pwStartHostTimeTicker(){try{if(__pwHostTimeTimer)return;__pwHostTimeTimer=setInterval(()=>{try{if('host'!==nt)return;const now=Date.now();const dRaw=Number(S.duration||0);if(isFinite(dRaw)&&dRaw>0)__pwLastDur=dRaw;const d=__pwLastDur||0;Br({type:'hb',t:Number(S.currentTime||0),d:d,paused:!!S.paused,rate:Number(S.playbackRate||1),serverTimeMs:now});try{if(!__pwDurSent&&d>0)__pwDurSent=true}catch{}}catch{}},1000)}catch{}}function __pwStopHostTimeTicker(){try{if(__pwHostTimeTimer){clearInterval(__pwHostTimeTimer);__pwHostTimeTimer=null}}catch{}}let __pwPlayToken=0;function __pwSafePlay(el){try{const v=++__pwPlayToken;if("host"===nt&&el&&el===S&&Number(el.currentTime||0)<=1){return new Promise(res=>{setTimeout(()=>{try{const p=el.play?el.play():null;if(p&&p.catch)p.catch(()=>{});res(p)}catch{res(null)}},1000)})}const p=el&&el.play?el.play():null;if(p&&p.catch)p.catch(()=>{});return p}catch{return null}}function __pwSafePause(el){try{++__pwPlayToken;el&&el.pause&&el.pause()}catch{}}const e=e=>document.querySelector(e),t=(e,t)=>{try{return JSON.parse(e)}catch{return t}},n=e("#chatLog"),dbgE=e("#dbgErrors"),dbgL=e("#dbgLog"),r=e("#toast"),o=e("#chatTitle"),a=(el,ev,fn,opts)=>{if(!el){try{i(`Missing element for event: ${ev}`,"err")}catch{}return!1}return el.addEventListener(ev,fn,opts),!0};function s(){return(new Date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function i(e,t="t"){const r=document.createElement("div");r.innerHTML=`<span class="t">[${s()}]</span> ${u(e)}`,"sys"===t&&r.classList.add("line-sys"),"me"===t&&r.classList.add("line-me"),"err"===t&&r.classList.add("line-err");const o=("err"===t?dbgE:dbgL)||n;o.appendChild(r),o.scrollTop=o.scrollHeight};try{window.__WWDBG_UI=(line,kind)=>{try{i(String(line||""),kind==="err"?"err":"t")}catch{}};window.WWDBG&&window.WWDBG.flushUI&&window.WWDBG.flushUI()}catch{}function c(e,t,r="t",o=null){const a=document.createElement("div");a.classList.add("chatLine"),o&&(a.dataset.clientId=String(o));const i=document.createElement("span");i.className="t",i.textContent=`[${s()}] `,a.appendChild(i);const c=document.createElement("strong");c.className="chatName",c.textContent=`${String(e||"Friend").trim()}: `,a.appendChild(c);const l=document.createElement("span");l.textContent=String(t??""),a.appendChild(l),"sys"===r&&a.classList.add("line-sys"),"me"===r&&a.classList.add("line-me"),"err"===r&&a.classList.add("line-err"),n.appendChild(a),n.scrollTop=n.scrollHeight}function l(e){r.textContent=e,r.style.display="block",clearTimeout(r._t),r._t=setTimeout(()=>r.style.display="none",1800);try{const t=String(e||"").toLowerCase();t.includes("host is already act")&&setTimeout(()=>{try{nn("viewer")}catch{}},0)}catch{}}function u(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function d(e,t){const n=String(e??"").trim();return n.length>t?n.slice(0,t):n}function m(e,t){const n=String(e??"");return n.length>t?n.slice(0,t):n}async function f(e){try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(String(e??""));else{const t=document.createElement("textarea");t.value=String(e??""),t.style.position="fixed",t.style.left="-9999px",document.body.appendChild(t),t.focus(),t.select(),document.execCommand("copy"),t.remove()}l("Copied")}catch(e){i("Clipboard copy failed (try HTTPS): "+(e?.message||e),"err"),l("Copy failed")}}function Dh(e){try{return Array.from((e||document.createElement("div")).children).map(e=>e.textContent||"").join("\n").trim()}catch{return""}}function Hh(e,t){try{const n=new Blob([String(e||"")],{type:"text/plain;charset=utf-8"}),r=document.createElement("a");r.href=URL.createObjectURL(n),r.download=t||"debug.txt",document.body.appendChild(r),r.click(),setTimeout(()=>{try{URL.revokeObjectURL(r.href)}catch{}try{r.remove()}catch{}},0),l("Saved")}catch(e){i("Save failed: "+(e?.message||e),"err"),l("Save failed")}}function Gh(){try{const e=((window.matchMedia&&window.matchMedia("(orientation: portrait)").matches)||window.innerWidth<720),t=document.querySelector("header .topbar"),n=document.querySelector("header .topbar .row");if(!t||!n)return;const r=t.getBoundingClientRect().width,o=n.scrollWidth>r+4||n.getBoundingClientRect().height>44;document.body.classList.toggle("compactStatus",!!(e&&o));const a=document.querySelector("header .brand");if(a){const t=a.getBoundingClientRect().width;const n=t<240||o;document.body.classList.toggle("brandLogoOnly",!!(e&&n))}}catch{}}function p(e){e=Math.max(0,Number(e||0));const t=Math.floor(e/3600),n=Math.floor(e%3600/60),r=Math.floor(e%60),o=String(n).padStart(2,"0"),a=String(r).padStart(2,"0");return t>0?`${t}:${o}:${a}`:`${o}:${a}`}window.addEventListener("error",e=>{try{const t=e&&e.message?String(e.message):"",n=e&&e.filename?String(e.filename):"",r=e&&"number"==typeof e.lineno?e.lineno:null,o=e&&"number"==typeof e.colno?e.colno:null;if("Script error."===t&&!n&&(null===r||0===r))return window.__scriptErrorOnce=window.__scriptErrorOnce||0,void(0===window.__scriptErrorOnce++&&i("JS error: Script error. (Cross-origin script threw or failed to load; open DevTools Console/Network for details.)","err"));i(`JS error: ${t}${n?` @ ${n}:${r??""}:${o??""}`:""}`,"err")}catch{}}),window.addEventListener("unhandledrejection",e=>{try{i(`Promise rejection: ${e.reason?.message||e.reason}`,"err")}catch{}});function Qr(){try{const volNum=Number(lt);const vol=Number.isFinite(volNum)?Math.max(0,Math.min(1,volNum)):.8;lt=vol;try{S&&(S.volume=vol,S.muted=!!ut||vol<=0)}catch{}try{const ae=("undefined"!=typeof _e)?_e:null;ae&&(ae.volume=vol,ae.muted=!!(S&&S.muted))}catch{}try{Zt&&Zt()}catch{}}catch{}}let h=!1;const y={paused:!0,t:0,rate:1,updatedAt:0};let g=!1;function __pwApplyCtrl(m){try{const p=(m&&m.ctrl)?m.ctrl:m;if(!p||"viewer"!==nt)return;const now=Date.now();if("room"===p.type&&p.name){try{Qt=d(p.name,30)||"Room";en(!1);Xt(Qt)}catch{}}const hc=App.state.hostClock||(App.state.hostClock={t:0,d:0,paused:true,rate:1,updatedAt:0});if('hb'===p.type){const tt=Number(p.t);const dd=Number(p.d);if(Number.isFinite(tt))hc.t=tt;if(Number.isFinite(dd)&&dd>0)hc.d=dd;hc.paused=!!p.paused;hc.rate=Number(p.rate)||hc.rate||1;hc.updatedAt=now;hc.serverTimeMs=Number(p.serverTimeMs)||now;if(!App.state.viewerFrozen)__pwUpdateViewerTimelineUI(false);return}if("rate"===p.type&&Number.isFinite(Number(p.rate))){hc.rate=Number(p.rate)||1;hc.updatedAt=now;return}if("time"===p.type||"seek"===p.type){const tt=Number(p.t);const dd=Number(p.d);if(Number.isFinite(tt))hc.t=tt;if(Number.isFinite(dd)&&dd>0)hc.d=dd;hc.paused=!!p.paused;hc.updatedAt=now;if(!App.state.viewerFrozen)__pwUpdateViewerTimelineUI(false);return}if("play"===p.type){hc.paused=!1;hc.updatedAt=now;if(!App.state.viewerFrozen)__pwUpdateViewerTimelineUI(false);return}if("pause"===p.type){hc.paused=!0;hc.updatedAt=now;if(!App.state.viewerFrozen)__pwUpdateViewerTimelineUI(false);return}if("audioSrc"===p.type&&p.mode){try{ct=String(p.mode);he&&(he.value=ct)}catch{}}}catch{}}function w(force=!1){if('viewer'!==nt)return;try{__pwUpdateViewerTimelineUI(true)}catch{} if(force) try{L(ge)}catch{} }function v(){if(!ge)return;const e=Number(S.duration||0);if(!isFinite(e)||e<=0)return we&&(we.textContent="--:--"),ve&&(ve.textContent="--:--"),void L(ge);h||(ge.value=String(Math.round(S.currentTime/e*Number(ge.max))),L(ge)),we&&(we.textContent=p(S.currentTime)),ve&&(ve.textContent=p(e));}function vH(t,d){if(!ge)return;const e=Number(d||0);if(!isFinite(e)||e<=0)return we&&(we.textContent=p(t||0)),ve&&(ve.textContent="--:--"),void L(ge);h||(ge.value=String(Math.round((Number(t||0))/e*Number(ge.max))),L(ge)),we&&(we.textContent=p(Number(t||0))),ve&&(ve.textContent=p(e));}function __pwUpdateViewerTimelineUI(force){try{if('viewer'!==nt)return;const hc=App.state.hostClock||{t:0,d:0,paused:true,rate:1,updatedAt:0,serverTimeMs:0};let tBase=Number(hc.t||0);const d=Number(hc.d||0);const rate=Number(hc.rate||1)||1;const now=Date.now();const since=((hc.serverTimeMs? (now-Number(hc.serverTimeMs||now)) : (now-Number(hc.updatedAt||now)))/1000);let tPred=tBase; if(!hc.paused && Number.isFinite(since) && since>0) tPred=tBase + since*rate; if(App.state.viewerFrozen) tPred=Number(App.state.viewerFreezeT||0); vH(tPred,d); if(force){try{L(ge)}catch{}}}catch{}}function b(){const e=h;h=!1,v(),h=e};function __pwHideWaitingOverlay(){try{if(_){_.style.display='none';}}catch{}try{if(K)K.style.display='none';}catch{}}function __pwShowWaitingOverlay(){try{if(_){_.style.display='';}}catch{}try{if(K)K.style.display='';}catch{}}const S=e("#video"),__pwClickFs=1;
try{
  if(S && !S.__pwClickFs){
    S.__pwClickFs=true;
    let __pwClickT=null;
    S.addEventListener("click",(ev)=>{
      try{
        if(__pwClickT){ clearTimeout(__pwClickT); __pwClickT=null; return; }
        __pwClickT=setTimeout(()=>{ __pwClickT=null; try{
          if(nt==='viewer'){
            // Viewers expect click-to-play, but not click-to-pause, and never auto-unmute.
            if(S.paused) __pwSafePlay(S);
          }else{
            if(S.paused) __pwSafePlay(S); else __pwSafePause(S);
          }
        }catch{} },220);
      }catch{}
    });
    S.addEventListener("dblclick",(ev)=>{
      try{
        if(__pwClickT){ clearTimeout(__pwClickT); __pwClickT=null; }
        if(ke && ke.click) ke.click();
      }catch{}
    });
  }
}catch{};try{if(S&&!S.__pwVolSync2){S.__pwVolSync2=true;S.addEventListener("volumechange",()=>{try{if(se)Zt()}catch{}})}}catch{};var k=new Set([" ","Spacebar","k","K","j","J","l","L","ArrowLeft","ArrowRight","Home","End","0","1","2","3","4","5","6","7","8","9"]);document.addEventListener("keydown",e=>{try{if("viewer"!==nt)return;const _tg=e.target&&e.target.tagName?String(e.target.tagName).toLowerCase():"";if("input"===_tg||"textarea"===_tg||"select"===_tg||e.target?.isContentEditable)return;if(e.ctrlKey||e.metaKey)return;if("F5"===e.key||"F12"===e.key)return;(k.has(e.key)||"Space"===e.code)&&(e.preventDefault(),e.stopPropagation(),w(!0))}catch(t){try{i(`Key handler error: ${t?.message||t}`,"err")}catch{}try{e.preventDefault(),e.stopPropagation()}catch{}}},!0),a(S,"seeking",()=>{"viewer"===nt&&w(!0)},{capture:!0});// Viewer: do NOT cancel pointer/touch events on the <video> element.
// Canceling pointerdown/touchstart in capture-phase prevents click/dblclick from firing in Chrome.
const x=e=>{"viewer"===nt&&(("contextmenu"===e.type)&&(e.preventDefault(),e.stopPropagation()),w(!0))};function T(){if(!ee)return;const e=!S.paused;ee.classList.toggle("isOn",e),ee.title=e?"Pause (Space)":"Play (Space)",ee.setAttribute("aria-label",e?"Pause":"Play")}function __pwHostSeekTo(sec){if("host"!==nt)return;const d=Number(S.duration||0);if(!isFinite(d)||d<=0)return;let t=Number(sec||0);t=Math.max(0,Math.min(d, t));try{S.currentTime=t}catch{}Br({type:"seek",t:S.currentTime,d:Number(S.duration||0),paused:S.paused})}
function Jr(deltaSeconds){if("host"!==nt)return;const d=Number(S.duration||0);if(!isFinite(d)||d<=0)return;const ct=Number(S.currentTime||0);__pwHostSeekTo(ct+Number(deltaSeconds||0))}
function zr(frameDelta){if('host'!==nt)return;let fps=Number(sfSel&&sfSel.value);if(!isFinite(fps)||fps<=0)fps=30;const step=1/Math.max(1,fps);try{if(!S.paused)__pwSafePause(S)}catch{};Jr(Number(frameDelta||0)*step)}function L(el){if(!el)return;const min=Number(el.min||0),max=Number(el.max||100);const v=(Number(el.value||0)-min)/(max-min);const played=100*Math.max(0,Math.min(1,v));if(el.id==='seek'){el.style.background=`linear-gradient(90deg, var(--accentA) 0%, var(--accentB) ${played}%, var(--trackBg) ${played}%)`;return;}el.style.background=`linear-gradient(90deg, var(--accentA) 0%, var(--accentB) ${played}%, var(--trackBg) ${played}%)`}function M(){const t=`${Number(S.playbackRate||1).toFixed(2)}×`;Se&&(Se.textContent=t);const n=e("#rateLabel2");n&&(n.textContent=t)}function F(){const e=t(localStorage.getItem("peerwatch_prefs")||"{}",{});L(ge),L(ie),M();const n=Number(e.uiScalePct??100);me&&(me.value=String(n)),ye(n,!1),"videoMessagesEnabled"in e&&A(!!e.videoMessagesEnabled,!1),Zt()}["pointerdown","pointerup","mousedown","mouseup","touchstart","touchend","dblclick","contextmenu"].forEach(e=>{S?.addEventListener(e,x,{capture:!0,passive:!1})}),["play","pause","seeking","seeked","ratechange"].forEach(e=>{S?.addEventListener(e,()=>{"viewer"===nt&&(g||w(!0))},{capture:!0})}),a(S,"play",()=>{"viewer"===nt&&w(!0)},{capture:!0}),a(S,"pause",()=>{"viewer"===nt&&w(!0)},{capture:!0}),a(S,"ratechange",()=>{"viewer"===nt&&w(!0)},{capture:!0}),a(S,"contextmenu",e=>{"viewer"===nt&&(e.preventDefault(),e.stopPropagation())},{capture:!0});let $=null,Wr=null;function E(){document.fullscreenElement&&pwControls&&(pwControls.classList.add("show"),clearTimeout($),$=setTimeout(()=>pwControls.classList.remove("show"),2200))}document.addEventListener("fullscreenchange",()=>{try{document.body.classList.toggle("isFullscreen",!!document.fullscreenElement)}catch{};try{if(document.fullscreenElement){E();// Android-only: best-effort orientation lock during fullscreen (may be ignored by some browsers).
try{const ua=navigator.userAgent||"";const isAndroid=/Android/i.test(ua);if(isAndroid&&screen&&screen.orientation&&screen.orientation.lock){screen.orientation.lock("landscape").catch(()=>{})}}catch{}
}else{pwControls&&pwControls.classList.remove("show");try{if(screen&&screen.orientation&&screen.orientation.unlock)screen.orientation.unlock()}catch{}}}catch{}});let P=0,N=null,C=0,D="",I=0;function A(e,t=!0){yt=!!e,pe&&(pe.checked=yt),j&&j.classList.toggle("on",yt),yt||(clearTimeout(N),N=null,B&&B.classList.remove("show"),V&&V.classList.remove("show")),t&&Gt()}function R(){const e=S?.getBoundingClientRect?.(),t=e?.width||U?.clientWidth||0,n=e?.height||U?.clientHeight||0;if(!t||!n)return;const r=Math.max(12,Math.min(72,.02*n)),o=Math.max(6,.03*n),a=Math.max(6,.03*t),s=document.documentElement;s.style.setProperty("--vmFont",r.toFixed(2)+"px"),s.style.setProperty("--vmTop",o.toFixed(2)+"px"),s.style.setProperty("--vmRight",a.toFixed(2)+"px")}function O(e,t){if(!yt)return;const n=Date.now();if(n-C<1e3)return;const r=String(t??"").replace(/\s+/g," ").trim().toLowerCase();if(!r)return;if(r===D&&n-I<1e4)return;C=n,D=r,I=n;const o=`${String(e||"Friend").trim()}: ${String(t??"")}`.trim();if(!o)return;R();if(!B||!V)return;const a=0===P?V:B;(0===P?B:V).classList.remove("show"),a.textContent=o,a.classList.remove("show"),a.offsetWidth,requestAnimationFrame(()=>a.classList.add("show")),P=0===P?1:0,clearTimeout(N),N=setTimeout(()=>{a.classList.remove("show")},5e3)}const U=e("#stage"),_=e("#overlay"),H=e("#subsOverlay"),j=e("#videoMsgOverlay"),B=e("#videoMsgA"),V=e("#videoMsgB"),J=e("#videoMsgComposer"),z=e("#videoMsgComposeInput"),W=e("#videoMsgComposeSend"),G=e("#videoMsgComposeCancel"),K=e("#dropHint"),q=e("#roleLabel"),Y=e("#netDot"),Z=e("#netText"),Q=e("#btnRole"),SP=e("#statusPill"),X=null,ee=e("#btnPlayPause"),te=e("#btnStepBack"),ne=e("#btnStepFwd"),re=e("#btnRewind"),oe=e("#btnFwd"),ae=e("#btnSync"),se=e("#btnMute"),ie=e("#vol"),ce=e("#btnVolDown"),le=e("#btnVolUp"),ue=e("#btnRateDown2"),de=e("#btnRateUp2"),me=e("#uiScale"),fe=e("#uiScaleLabel"),pe=e("#videoMsgsToggle"),he=e("#audioSourceSelect"),dbgSave=e("#dbgSaveTxt"),btnCL=e("#btnCopyLogs"),btnCE=e("#btnCopyErrors"),btnCA=e("#btnCopyAll");let pwControls=e("#pwControls");
// Seg availability marks (host: uploaded, viewer: downloaded).
const __pwSegHost=new Set,__pwSegViewer=new Set;
let __pwSegOverlay=null;
function __pwEnsureSegOverlay(){}
function __pwAddSeg(setObj,idx){try{if(!Number.isFinite(idx))return;setObj.add(Number(idx));__pwRenderSeg()}catch{}}
function __pwRanges(setObj){try{const a=Array.from(setObj).filter(e=>Number.isFinite(e)).sort((a,b)=>a-b);if(!a.length)return[];const out=[];let s=a[0],p=a[0];for(let i=1;i<a.length;i++){const v=a[i];if(v===p+1){p=v;continue}out.push([s,p]);s=p=v}out.push([s,p]);return out}catch{return[]}}
function __pwRenderSeg(){}
// Auto-start streaming on first play after a fresh load
let __pwAutoStartArmed=false;
let __pwAutoStartToken=null;
function __pwUpdateTight(){try{if(!pwControls)return;const w=pwControls.getBoundingClientRect().width||0;pwControls.classList.toggle("pwTight",w>0&&w<520)}catch{}}
try{if(pwControls){new ResizeObserver(__pwUpdateTight).observe(pwControls);window.addEventListener("resize",__pwUpdateTight);__pwUpdateTight()}}catch{}
function ye(e,t=!0){const n=Math.max(70,Math.min(160,Number(e)||100));document.documentElement.style.setProperty("--uiScale",String(n/100)),fe&&(fe.textContent=n+"%"),t&&Gt()}a(me,"input",()=>ye(me.value,!0)),a(me,"change",()=>ye(me.value,!0)),a(pe,"change",()=>A(!!pe.checked,!0)),a(he,"change",()=>{const e="external"===he?.value?"external":"video";if(ct=e,Qr(),Xr(),"video"===e)try{!ut&&Number(lt)>0&&(S.muted=!1)}catch{}else try{_e&&_e.src&&(!ut&&Number(lt)>0&&(_e.muted=!1),S.paused||_e.play().catch(()=>{}))}catch{}"host"===nt&&(eo(),Br({type:"audioSrc",mode:ct}))});const ge=e("#seek"),we=e("#timeCur"),ve=e("#timeDur"),be=e("#playerShell"),Se=e("#rateVal"),ke=e("#btnFullscreen"),xe=e("#btnPiP"),Te=e("#displayName"),Le=e("#roomName"),Me=(e("#roomNameRow"),e("#playerTitle")),Fe=e("#themeSel"),$e=e("#themePicker"),Ee=e("#themeBtn"),Pe=e("#themeBtnLabel"),Ne=e("#themeMenu"),rr=e("#subsFontSelect"),or=e("#subsFontPicker"),ar=e("#subsFontBtn"),sr=e("#subsFontBtnLabel"),ir=e("#subsFontMenu")
,stSel=e("#streamTypeSel"),stPick=e("#streamTypePicker"),stBtn=e("#streamTypeBtn"),stLbl=e("#streamTypeBtnLabel"),stMenu=e("#streamTypeMenu")
,srSel=e("#streamResSel"),srPick=e("#streamResPicker"),srBtn=e("#streamResBtn"),srLbl=e("#streamResBtnLabel"),srMenu=e("#streamResMenu")
,sfSel=e("#streamFpsSel"),sfPick=e("#streamFpsPicker"),sfBtn=e("#streamFpsBtn"),sfLbl=e("#streamFpsBtnLabel"),sfMenu=e("#streamFpsMenu")
,sbSel=e("#streamBitrateSel"),sbPick=e("#streamBitratePicker"),sbBtn=e("#streamBitrateBtn"),sbLbl=e("#streamBitrateBtnLabel"),sbMenu=e("#streamBitrateMenu")
,shSel=e("#streamHintSel"),shPick=e("#streamHintPicker"),shBtn=e("#streamHintBtn"),shLbl=e("#streamHintBtnLabel"),shMenu=e("#streamHintMenu");function Ce(){if(!Pe||!Ne||!Fe)return;const e=Fe.options[Fe.selectedIndex];Pe.textContent=e?e.textContent:Fe.value||"Theme";for(const e of Array.from(Ne.children)){const t=e.dataset.value===Fe.value;e.setAttribute("aria-selected",t?"true":"false")}}function De(){$e&&Ee&&($e.classList.remove("open"),Ee.setAttribute("aria-expanded","false"))}function Ie(){if(!sr||!ir||!rr)return;const e=rr.options[rr.selectedIndex];sr.textContent=e?e.textContent:"Font";for(const e of Array.from(ir.children)){const t=e.dataset.value===rr.value;e.setAttribute("aria-selected",t?"true":"false")}}function Ae(){or&&ar&&(or.classList.remove("open"),ar.setAttribute("aria-expanded","false"))}
function __pwInitPicker(sel,picker,btn,lbl,menu,onChange){try{if(!sel||!picker||!btn||!lbl||!menu)return;menu.innerHTML="";for(const opt of Array.from(sel.options||[])){const b=document.createElement("button");b.type="button";b.className="pwSelectOpt";b.role="option";b.dataset.value=opt.value;b.textContent=opt.textContent;b.addEventListener("click",()=>{sel.value=opt.value;sel.dispatchEvent(new Event("change",{bubbles:!0}));try{onChange&&onChange()}catch{};picker.classList.remove("open");btn.setAttribute("aria-expanded","false");__pwSyncPicker(sel,lbl,menu)});menu.appendChild(b)}btn.addEventListener("click",e=>{e.preventDefault();picker.classList.contains("open")?(picker.classList.remove("open"),btn.setAttribute("aria-expanded","false")):(picker.classList.add("open"),btn.setAttribute("aria-expanded","true"))});document.addEventListener("pointerdown",e=>{picker.classList.contains("open")&&!picker.contains(e.target)&&(picker.classList.remove("open"),btn.setAttribute("aria-expanded","false"))});document.addEventListener("keydown",e=>{"Escape"===e.key&&picker.classList.contains("open")&&(picker.classList.remove("open"),btn.setAttribute("aria-expanded","false"))});__pwSyncPicker(sel,lbl,menu)}catch{}}
function __pwSyncPicker(sel,lbl,menu){try{if(!sel||!lbl)return;const o=sel.options[sel.selectedIndex];lbl.textContent=o?o.textContent:(sel.value||"");if(menu)for(const c of Array.from(menu.children||[])){const on=c.dataset.value===sel.value;c.setAttribute("aria-selected",on?"true":"false")}}catch{}}
const Re=e("#btnLoad"),Oe=e("#btnLoadAudio"),Ue=e("#audioPick"),_e=e("#audioEl"),He=e("#btnLoadVtt"),je=e("#btnToggleSubs"),Be=e("#subsTrackSel"),Ve=e("#btnSend"),Je=e("#chatMsg"),ze=e("#btnSnapshot"),We=e("#btnStats"),Ge=null,Ke=e("#btnShare"),qe=e("#roomCode"),Ye=e("#btnNewRoom"),Ze=e("#joinRoomInput"),Qe=e("#btnJoinRoom");Ze&&(a(Ze,"input",function(){if(!Ze)return;const e=String(Ze.value||""),t=Ze.selectionStart??e.length,n=e.replace(/\D/g,"").slice(0,8),r=n.length>4?n.slice(0,4)+" "+n.slice(4):n,o=e.slice(0,t).replace(/\D/g,"").length,a=o<=4?o:o+1;Ze.value=r;try{Ze.setSelectionRange(a,a)}catch(e){}}),a(Ze,"keydown",e=>{"Enter"===e.key&&(e.preventDefault(),Qe?.click?.())}),a(Ze,"focus",()=>{try{Ze.select()}catch(e){}}));const Xe=e("#filePick"),et=e("#vttPick"),tt=e("#members");if(a(window,"resize",R),a(S,"loadedmetadata",R),a(S,"loadeddata",R),window.ResizeObserver&&U)try{new ResizeObserver(()=>R()).observe(U)}catch(e){}navigator.userAgent.toLowerCase().includes("firefox");let nt=null,rt=null,ot=null,at=null,st=null,it=null;let audioStream=null;
let __pwStreamIsLive=false;let __pwOutStream=null;let __pwCanvasStream=null;let __pwAudioStream=null;let __pwCanvasTimer=null;let __pwCanvasCtx=null;let __pwCanvasEl=null;let __pwCanvasLastDraw=0;let ct="video",lt=.8,ut=!1,dt=new MediaStream;const mt=[];let ft=null,pt=null,ht=!0,yt=!0;const gt=new Map;let __pwPeers=[];function __pwRoomHasOtherHost(){try{for(const p of (__pwPeers||[])) if(p&&p.role==="host"&&String(p.id)!==String(kt)) return true;}catch{}try{return !!(At&&String(At)!==String(kt));}catch{}return false;}
let wt=null,vt=null;const bt="peerwatch_session_v2",St="peerwatch_clientId",kt=(()=>{let e=localStorage.getItem(St);return e||(e=(crypto?.randomUUID?.()||"c_"+Math.random().toString(16).slice(2)+Date.now().toString(16)).slice(0,36),localStorage.setItem(St,e)),e})(),xt="www_display_name",Tt=new Map;function Lt(e,t){if(!e)return;const n=d(t,30)||"Friend";Tt.set(String(e),n),document.querySelectorAll(`.chatLine[data-client-id="${String(e)}"] .chatName`).forEach(e=>{e.textContent=`${n}: `})}function Mt(e){return 8===(e=String(e||"").replace(/\D/g,"").slice(0,8)).length?e:""}function Ft(){const e=new URL(location.href).searchParams.get("ws")||"";return e?String(e):""}const $t=document.querySelector('meta[name="signal-url"]')?.getAttribute("content")?.trim(),Et=$t||"wss://whatwewatching-signal.lilbrandon2008.workers.dev",Pt=Ft()||Et;let Nt=null,Ct=!1,Dt=!1,It="",At=null;function Rt(){const e={v:2,at:Date.now(),role:nt||"",roomId:It||"",displayName:d(Te?.value||"",30)||""};localStorage.setItem(bt,JSON.stringify(e))}function Ot(e){Nt&&1===Nt.readyState&&Nt.send(JSON.stringify(e))}function Br(msg){if("host"!==nt)return;const ctrl=msg||{};const dcPayload={t:jt.ctrl,from:kt,roomId:It,at:Date.now(),ctrl};try{for(const p of gt.values())if(p&&p.dc&&"open"===p.dc.readyState)try{p.dc.send(JSON.stringify(dcPayload))}catch{}}catch{}try{Ct&&Ot({type:"ctrl",v:1,roomId:It,from:kt,ctrl})}catch{}}function Ut(e,t,opts){
  Dt=!1;
  It=t||"";
  if(!It) return;

  // Role switching requires a fresh WS (role is only set during hello).
  // To avoid chat drop, optionally keep the previous WS alive until the new one is open.
  const prev = (opts && opts.keepOldWs) ? Nt : null;
  if(!prev){
    try{Dt=!0;Nt?.close?.()}catch{};
    Dt=!1;
  }

  const ws=new WebSocket(function(e,t){
    const n=new URL(e.replace(/^ws/i,"http"));
    return n.searchParams.get("room")||n.searchParams.set("room",t),n.toString().replace(/^http/i,"ws")
  }(Pt,It));

  Nt=ws;
  Ct=!1;

  ws.addEventListener("open",()=>{
    Ct=!0;
    tn(!0,"Signaling connected");
    Ot({type:"hello",v:1,roomId:It,role:e,clientId:kt,name:d(Te?.value||localStorage.getItem(xt)||"",30)||("host"===e?"Host":"Viewer")});
    Rt();
    // Close the previous socket only after the new socket is live.
    if(prev){
      try{Dt=!0;prev.close(1000,"role-switch")}catch{};
      Dt=!1;
    }
  });

  ws.addEventListener("error",()=>{Ct=!1,tn(!1,"Signaling error")});
  ws.addEventListener("close",()=>{Dt||(Ct=!1,tn(!1,"Disconnected"))});

  ws.addEventListener("message",async ev=>{
    let t;
    try{t=JSON.parse(ev.data)}catch{return}

    if("welcome"===t.type){
      At=t.hostId||At;
      try{ if(t.role){ nt = t.role; window.nt=nt; App.state.role=nt; } else if(At===kt){ nt="host"; window.nt=nt; App.state.role=nt; } }catch{}
      "viewer"===nt&&At&&(wt=At);
      i(`Joined room ${It}`,"sys");
      Lt(kt,d(Te?.value||localStorage.getItem(xt)||"",30)||("host"===nt?"Host":"Viewer"));
      try{document.body.classList.toggle("isHost","host"===nt);}catch{}
      try{Kr();}catch{}
      _t(t);
      return;
    }

    if("host-granted"===t.type){
      try{At=t.hostId||At;}catch{}
      try{nn("host");}catch{}
      return;
    }

    if("host-denied"===t.type){
      try{At=t.hostId||At;}catch{}
      try{l("Host already taken");}catch{}
      try{Kr();}catch{}
      return;
    }


    if("peerlist"===t.type){_t(t);return;}

    if("room"===t.type){
      if("host"!==nt){Qt=d(t.name,30)||"Room";en(!1);Xt(Qt);} 
      return;
    }

    if("ctrl"===t.type){__pwApplyCtrl(t);return;}

    if("chat"===t.type){
      if(t.clientId&&String(t.clientId)===String(kt))return;
      const from=d(t.from||"Friend",30),text=String(t.text??"");
      t.clientId&&Lt(t.clientId,from);
      c(from,text,"t",t.clientId||null);
      O(from,text);
      return;
    }

    if("viewer-join"===t.type&&"host"===nt){
      const vid=String(t.viewerId||"");
      if(!vid)return;
      // Establish/refresh a peer connection for chat immediately.
      try{await no(vid,t.name||"Viewer")}catch{}
      // If we're already live, offer media right away.
      if(__pwStreamIsLive){
        try{await no(vid,t.name||"Viewer")}catch{}
      }
      return;
    }

    if("offer"===t.type&&"viewer"===nt){
      await async function(e){try{const t=e||{};t?.meta?.room&&(Qt=d(t.meta.room,30)||"Room",en(!1));const n=String(t.peerId||t.from||"");if(!n)return;if(gt.has(n)){try{gt.get(n).pc?.close?.()}catch{}gt.delete(n)}const r=makePeer({asHost:!1,forcedPeerId:n}),{pc:o}=gt.get(r);await o.setRemoteDescription(t.sdp);const a=await o.createAnswer();await o.setLocalDescription(a),await ro(o),Ot({type:"answer",v:1,roomId:It,to:String(t.from||At||""),from:kt,peerId:r,sdp:o.localDescription,meta:{name:d(Te?.value||"",30)||"Viewer"}}),i("Auto-joined host. Sending answer…","sys"),Kr()}catch(e){console.error(e),i("Auto-join failed: "+(e?.message||e),"err")}}(t);
      return;
    }

    if("answer"===t.type&&"host"===nt){
      await async function(e){try{const t=e||{},n=String(t.peerId||t.from||""),r=gt.get(n);if(!r)return void i("Received answer for unknown peer. Viewer may have reloaded; waiting for rejoin…","err");await r.pc.setRemoteDescription(t.sdp),t.meta?.name&&(r.name=t.meta.name),Ar?.(),Kr(),i(`Viewer connected: ${r.name||"Viewer"}`,"sys")}catch(e){console.error(e),i("Apply answer failed: "+(e?.message||e),"err")}}(t);
      return;
    }

    if("peer-left"===t.type){
      const pid=String(t.clientId||"");
      if(gt.has(pid)){
        try{gt.get(pid).pc?.close?.()}catch{}
        gt.delete(pid);
        Kr();
      }
      return;
    }
  })
}
function _t(e){if(!tt)return;tt.innerHTML='';const t=Array.isArray(e.peers)?e.peers:[];__pwPeers=t;try{At=('hostId' in (e||{}))?(e.hostId||null):At;}catch{};try{App.state.hostPresent=t.some(p=>p&&p.role==="host");App.state.hostId=(t.find(p=>p&&p.role==="host")||{}).id||null}catch{};for(const e of t){e&&e.id&&Lt(e.id,e.name||("host"===e.role?"Host":"Viewer"));const t=document.createElement("div");t.className="member",t.textContent=("host"===e.role?"👑 ":"")+(e.name||("host"===e.role?"Host":"Viewer")),tt.appendChild(t)}}function Ar(){try{tt&&(tt.innerHTML="")}catch{}}const Ht={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]}]},jt={hello:"hello",chat:"chat",ctrl:"ctrl",vtt:"vtt",subsStyle:"subsStyle",ping:"ping",pong:"pong",members:"members",hostTaken:"hostTaken"};let Bt=null,Vt=null,Jt=null;
function makePeer(opts){
  const o=opts||{};
  const asHost=!!o.asHost;
  const peerId=String(o.forcedPeerId||("p_"+Math.random().toString(16).slice(2)));
  try{
    const pc=new RTCPeerConnection(Ht);
    const entry={pc,dc:null,role:asHost?"viewer":"host",name:asHost?"Viewer":"Host"};
    gt.set(peerId,entry);
    // DataChannel for control/chat
    if(asHost){
      try{
        const dc=pc.createDataChannel("ctrl",{ordered:true});
        entry.dc=dc;
      }catch{}
    }else{
      pc.addEventListener("datachannel",(ev)=>{
        try{ entry.dc=ev.channel; }catch{}
        try{
          ev.channel.addEventListener("message",(mev)=>{
            try{
              const msg=JSON.parse(mev.data);
              if(msg && (msg.t===jt.ctrl || msg.type==="ctrl")) __pwApplyCtrl(msg.ctrl||msg);
              if(msg && (msg.t===jt.chat || msg.type==="chat")) { /* reserved */ }
            }catch{}
          });
        }catch{}
      });
    }
    // Remote tracks (viewer)
    pc.addEventListener("track",(ev)=>{
      if("viewer"!==nt) return;
      const stream=ev.streams && ev.streams[0] ? ev.streams[0] : null;
      if(stream){
        try{S.srcObject=stream;S.autoplay=true;S.playsInline=true;}catch{}
        try{ __pwSafePlay(S); }catch{}; try{ __pwUpdateViewerUnmuteBtn(); }catch{}
      }
    });
    pc.addEventListener("connectionstatechange",()=>{ try{Kr();}catch{} });
    pc.addEventListener("iceconnectionstatechange",()=>{ try{Kr();}catch{} });
  }catch(err){
    i("Peer setup failed: "+(err?.message||err),"err");
    throw err;
  }
  return peerId;
}
function zt(e){document.documentElement.dataset.theme=e||"mono",Wt()}function Wt(){const e=(getComputedStyle(document.documentElement).getPropertyValue("--accent")||"").trim();if(!e)return;const t=function(e){if(!e)return null;const t=String(e).trim();let n=t.match(/^#([0-9a-f]{3})$/i);if(n){const e=n[1];return{r:parseInt(e[0]+e[0],16),g:parseInt(e[1]+e[1],16),b:parseInt(e[2]+e[2],16)}}if(n=t.match(/^#([0-9a-f]{6})$/i),n){const e=n[1];return{r:parseInt(e.slice(0,2),16),g:parseInt(e.slice(2,4),16),b:parseInt(e.slice(4,6),16)}}if(n=t.match(/^rgba?\(([^)]+)\)$/i),n){const e=n[1].split(",").map(e=>e.trim()).filter(Boolean);if(e.length>=3){const t=Number(e[0]),n=Number(e[1]),r=Number(e[2]);if([t,n,r].every(e=>Number.isFinite(e)))return{r:t,g:n,b:r}}}return null}(e)||{r:122,g:162,b:255},n=function(e,t,n){const r=e=>Math.max(0,Math.min(255,Math.round(e)));return{r:r(e.r+(t.r-e.r)*n),g:r(e.g+(t.g-e.g)*n),b:r(e.b+(t.b-e.b)*n)}}(t,{r:255,g:255,b:255},.35);document.documentElement.style.setProperty("--accentA",`rgb(${t.r} ${t.g} ${t.b})`),document.documentElement.style.setProperty("--accentB",`rgb(${n.r} ${n.g} ${n.b})`),document.documentElement.style.setProperty("--accentRGB",`${t.r},${t.g},${t.b}`),document.documentElement.style.setProperty("--accentBRGB",`${n.r},${n.g},${n.b}`),F()}function Gt(){localStorage.setItem("peerwatch_prefs",JSON.stringify({displayName:d(Te.value,30),roomName:d(Le?.value||"",30),theme:Fe.value,vol:Number(ie.value),muted:!!ut,rate:Number(S.playbackRate||1),uiScalePct:Number(me?.value||100),videoMessagesEnabled:!!yt}))}Fe.addEventListener("change",()=>{zt(Fe.value),Gt(),Wt(),l("Theme: "+Fe.value),Ce()}),window.addEventListener("beforeunload",Gt),Te.addEventListener("input",()=>{Te.value=d(Te.value,30),clearTimeout(Te._debounceT),Te._debounceT=setTimeout(()=>{const e=d(Te.value,30)||("host"===nt?"Host":"Viewer");if(localStorage.setItem(xt,e),Lt(kt,e),Ct)try{Nt.send(JSON.stringify({type:"set-name",roomId:It,clientId:kt,name:e}))}catch{}},5e3)}),Le&&(Le.addEventListener("input",()=>{Le.value=m(Le.value,30),en(!1),clearTimeout(Le._debounceT),Le._debounceT=setTimeout(()=>{const e=d(Le.value,30)||"Room";Le.value=e,en(!0),Xt(e),"host"===nt&&Ct&&Ot({type:"room",name:e,roomId:It,clientId:kt}),Gt()},5e3),Gt()}),Le.addEventListener("change",()=>{Le.value=d(Le.value,30);const e=Le.value||"Room";en(!0),Xt(e),"host"===nt&&Ct&&Ot({type:"room",name:e,roomId:It,clientId:kt}),Gt()})),a(Me,"click",()=>{"host"===nt&&Le?.focus()}),ie.addEventListener('input',()=>{try{const vv=Math.max(0,Math.min(1,Number(ie.value)||0));if(vv<=0){try{S.volume=0}catch{};try{S.muted=true}catch{};ut=true;lt=0;}else{try{S.volume=vv}catch{};try{S.muted=false}catch{};ut=false;lt=vv;window.__pwVolBeforeMute=vv;}try{L(ie)}catch{};try{Zt&&Zt()}catch{};try{Gt&&Gt()}catch{};}catch{}});const Kt=(e,t,n)=>Math.min(n,Math.max(t,e));function qt(e){const t=Kt((Number(S.volume)||0)+e,0,1);if(t<=0){S.volume=0;S.muted=true;ut=true;lt=0;}else{S.muted=false;S.volume=t;ut=false;lt=t;window.__pwVolBeforeMute=t;}ie.value=String(t);L(ie);Zt();Gt();}function Yt(e){const t=Kt(Number(e||1),.25,2),n=.05*Math.round(t/.05);S.playbackRate=Number(n.toFixed(2)),M(),v(),T(),F(),"host"===nt&&Br({type:"rate",rate:S.playbackRate}),Gt()}function Zt(){if(!se)return;const vm=(S?!!S.muted:!!ut);const vv=(S?Number(S.volume||0):Number(lt));const e=vm||0===Number(vv);se.classList.toggle("muted",e),se.classList.toggle("isOn",e),se.title=e?"Unmute (M)":"Mute (M)",se.setAttribute("aria-label",e?"Unmute":"Mute")}a(ue,"click",()=>Yt((S.playbackRate||1)-.05)),a(de,"click",()=>Yt((S.playbackRate||1)+.05)),se&&se.addEventListener("click",()=>{try{const currentlyMuted=!!S.muted||Number(S.volume||0)<=0;if(!currentlyMuted){const keep=Math.max(0,Math.min(1,Number(ie.value)||Number(S.volume)||0.8));window.__pwVolBeforeMute=keep;try{S.muted=true}catch{};try{S.volume=0}catch{};ut=true;lt=0;try{ie.value="0";L(ie)}catch{}}else{const restore=Math.max(0.01,Math.min(1,Number(window.__pwVolBeforeMute)||0.8));try{S.muted=false}catch{};try{S.volume=restore}catch{};ut=false;lt=restore;try{ie.value=String(restore);L(ie)}catch{}}try{Zt()}catch{};try{Gt&&Gt()}catch{};}catch{}});a(ee,'click',async()=>{try{if('host'!==nt){try{if(S.paused){App.state.viewerFrozen=false;try{S.play()}catch{};__pwUpdateViewerTimelineUI(true);}else{App.state.viewerFrozen=true;App.state.viewerFreezeT=Number((App.state.hostClock&&App.state.hostClock.t)||0);try{S.pause()}catch{};__pwUpdateViewerTimelineUI(true);}T();}catch{}return}if(!S.src&&!ot&&!S.srcObject){l('Load a video first');return}if(S.paused){try{if(!window.__pwStreamIsLive&&window.__pwAutoStartArmed){await __pwStartStreamingWithOptions(__pwGetStreamSettingsFromUI());}}catch{}try{await S.play()}catch{}Br({type:'play',t:Number(S.currentTime||0),d:Number(S.duration||0),paused:false});}else{try{S.pause()}catch{}Br({type:'pause',t:Number(S.currentTime||0),d:Number(S.duration||0),paused:true});}T();__pwHideWaitingOverlay();}catch(e){try{i('Play btn error: '+(e?.message||e),'err')}catch{}}}),a(te,'click',()=>{try{if('host'!==nt)return;zr(-1)}catch{}}),a(ne,'click',()=>{try{if('host'!==nt)return;zr(1)}catch{}}),a(re,'click',()=>{try{if('host'!==nt)return;Jr(-10)}catch{}}),a(oe,'click',()=>{try{if('host'!==nt)return;Jr(10)}catch{}}),ge&&(ge.addEventListener("input",()=>{if("viewer"===nt){__pwUpdateViewerTimelineUI(true);return}h=!0;const e=Number(S.duration||0);if(!isFinite(e)||e<=0)return;const t=Number(ge.value)/Number(ge.max)*e;we&&(we.textContent=p(t)),L(ge)}),ge.addEventListener("change",()=>{if("viewer"===nt){h=!1;__pwUpdateViewerTimelineUI(true);return}const e=Number(S.duration||0);if(h=!1,!isFinite(e)||e<=0)return;const t=Number(ge.value)/Number(ge.max)*e;"host"===nt&&(S.currentTime=t,Br({type:"seek",t:S.currentTime,d:Number(S.duration||0),paused:S.paused}))}));let Qt="Room";function Xt(e){if(!o)return;const t=d(e||"",30);o.textContent=t?`${t} Chat`:"Chat"}function en(e){"host"===nt?(Qt=m(Le?.value||"",30)||"Room",Me&&(Me.textContent=Qt||"Room"),e&&"host"===nt&&Br({type:"room",name:d(Qt,30)||"Room"})):Me&&(Me.textContent=Qt||"Room")}function tn(e,t){const _full=String(t||"");const _l=_full.toLowerCase();let _simple="Disconnected";if(_l.includes("connecting")||_l.includes("reconnect")||_l.includes("opening"))_simple="Connecting";else if(_l.includes("connected")&&!_l.includes("not"))_simple="Connected";else if(_l.includes("connect")&&!_l.includes("not"))_simple="Connecting";Z.textContent=_simple;try{Z.title=_full;Z.parentElement&&(Z.parentElement.title=_full);}catch{}Y.className="dot"+("Connected"===_simple?" ok":"Connecting"===_simple?"":" bad");}function nn(e){const t=nt;if(e===t)return;if("host"===e && __pwRoomHasOtherHost()){l("There is already a Host");return}if("viewer"===e&&!wt)for(const[e,t]of gt.entries())if("host"===t?.role){wt=e;break}"host"===e&&(wt=null),nt=e;try{('host'===nt)?(__pwStreamIsLive&&__pwStartHostTimeTicker()):__pwStopHostTimeTicker()}catch{};try{window.nt=nt;App.state.role=nt}catch{};document.body.classList.toggle("isHost","host"===nt),q&&(q.textContent="");try{Q?.classList.toggle("activeMode","host"===nt)}catch{};K.innerHTML="host"===nt?'Drop a video file here • You are the <b>Host</b>\n<div class="mini" style="margin-top:6px">Tip: Drop a .vtt subtitles file too</div>':'Waiting for host stream…\n<div class="mini" style="margin-top:6px">Open a host link to auto-join</div>',ae&&(ae.disabled="host"!==nt),Re&&(Re.disabled="host"!==nt,Re.style.display="host"===nt?"":"none");if([te,ne,re,oe,ge].forEach(e=>e.disabled="viewer"===nt),tn(!1,"Not connected"),"host"===t&&"viewer"===e&&function(){try{S.pause()}catch(e){}if(it){try{URL.revokeObjectURL(it)}catch(e){}it=null}try{S.removeAttribute("src"),S.srcObject=null,S.load()}catch(e){}ot=null,st=null,rt=null}(),__pwResetPeersOnly(),"host"===e){!!S.src||!!ot||function(){try{S.pause()}catch{}try{S.currentTime=0}catch{}}()}if(It){try{Nt?.close?.()}catch{}Nt=null,Ct=!1,At=null,Ut(nt,It,{keepOldWs:true})}if(nt==='viewer'){S.srcObject=null;an();S.controls=false;S.autoplay=true;S.playsInline=true;rn(true);}else{S.srcObject=null;S.controls=!1;S.autoplay=!1;rn(!(!!S.src||!!ot));an();}try{const b=document.getElementById('btnStartStream');if(b){if(nt==='host')b.disabled=!(!!S.src||!!ot||!!S.srcObject);else b.disabled=true;if(nt!=='host'){b.classList.remove('on');b.textContent='Start';}}}catch{}Kr()}
function Kr(){
  try{
    // Update role label + Host-only controls
    try{ if(q) q.textContent = nt==='host'?'Host':(nt==='viewer'?'Viewer':''); }catch{}

    // Role button label
    try{ if(Q) Q.textContent = nt==='host'?'Host':'Viewer'; }catch{}
    // Stream Quality controls: Host enabled, Viewer disabled (viewer shows host-applied values)
    try{
      const isHost=(nt==='host');
      for(const id of ["streamTypeBtn","streamResBtn","streamFpsBtn","streamBitrateBtn","streamHintBtn"]){
        const b=document.getElementById(id);
        if(b) b.disabled=!isHost;
      }
      for(const id of ["streamTypeSel","streamResSel","streamFpsSel","streamBitrateSel","streamHintSel"]){
        const s=document.getElementById(id);
        if(s) s.disabled=!isHost;
      }
      for(const id of ["btnStreamApply","btnStreamReset"]){
        const b=document.getElementById(id);
        if(b) b.disabled=!isHost;
      }
    }catch{}

    const b=document.getElementById('btnStartStream');
    if(b){
      if(nt==='host') b.style.display='';
      else b.style.display='none';
    }
  }catch(e){}
}
function __pwUpdateViewerUnmuteBtn(){
  try{
    const b=document.getElementById("btnViewerUnmute");
    if(!b) return;
    const isViewer = (nt==="viewer");
    b.style.display = isViewer ? "" : "none";
    const unmuted = !!App.audio.viewerUnmuted;
    b.textContent = unmuted ? "Mute" : "Unmute";
    b.title = unmuted ? "Mute viewer audio" : "Unmute viewer audio";
  }catch{}
}
function __pwToggleViewerUnmute(){return}
function rn(e){_.style.display=e?"flex":"none"}function on(e){try{K.style.display=e?"":"none"}catch(e){}}function an(){on(!(!!S.srcObject||!!S.src))}async function sn(file){try{
  if("host"!==nt)return;

  // Loading a new file always stops any active stream.
  try{if(__pwStreamIsLive)__pwStopStreaming()}catch{}
  __pwStreamIsLive=!1;
  __pwStopDrawLoop();
  try{__pwStopHostTimeTicker()}catch{}

  // Reset auto-start gate for this media load.
  __pwAutoStartArmed=!1;
  __pwAutoStartToken=null;

  try{window.__pwHostHold=!1}catch{}

  if(it){try{URL.revokeObjectURL(it)}catch{}it=null}
  try{
    it=URL.createObjectURL(file);
    try{S.srcObject=null}catch{}
    S.src=it;
    S.playsInline=!0;
    try{S.load()}catch{}
  }catch(err){}

  // UI reset
  try{on(!1)}catch{}
  try{an()}catch{}
  try{rn(!0)}catch{}

  // Wait metadata so we know dimensions
  await new Promise((resolve,reject)=>{
    const onMeta=()=>{cleanup();resolve()};
    const onErr=()=>{cleanup();reject(new Error("video load failed"))};
    const cleanup=()=>{S.removeEventListener("loadedmetadata",onMeta);S.removeEventListener("error",onErr)};
    S.addEventListener("loadedmetadata",onMeta,{once:!0});
    S.addEventListener("error",onErr,{once:!0});
  });

  const srcW=Number(S.videoWidth||0)||0;
  const srcH=Number(S.videoHeight||0)||0;
  App.stream.srcW=srcW;App.stream.srcH=srcH;
  if(!srcW||!srcH){i("Video load failed: invalid dimensions","err");throw new Error("invalid video dimensions")}

  // Ensure we start paused; first PLAY triggers auto-stream.
  try{S.pause()}catch{}

  const startBtn=document.getElementById('btnStartStream');
  if(startBtn){
    startBtn.disabled=!(nt==="host"&&(S&&(S.src||S.srcObject)));
    startBtn.classList.remove('on');
    startBtn.textContent='Start';
  }

  // Arm auto-start: first host play after this load will start streaming + update button.
  __pwAutoStartArmed=!0;
  __pwAutoStartToken=it||("file_"+String(file?.name||""));

  rn(!1);
  l("Loaded video");
  i(`Loaded video: ${file.name} (${srcW}x${srcH})`,"sys");

  // If we already have connected viewers, establish PCs now for chat.
  if("host"===nt){
    const viewers=Array.from(gt.entries()).filter(([pid,peer])=>pid&&peer&&peer.role==="viewer").map(([pid,peer])=>({pid,name:peer.name||"Viewer"}));
    for(const v of viewers)try{await no(v.pid,v.name)}catch{}
  }
}catch(err){
  console.error(err);
  try{i("Video load failed: "+(err?.message||err),"err")}catch{}
  l("Video load failed");
}}function cn(){return Pt.replace(/^ws/i,"http")}a(Q,"click",()=>{try{if(nt==="host"){l("Becoming Viewer…");try{nn("viewer")}catch{}return;}l("Requesting Host…");try{Ct&&Ot({type:"request-host",roomId:It,clientId:kt});}catch{}}catch{}}),a(S,'click',()=>{if(nt==='viewer'){try{if(S.muted){S.muted=false;l('Unmuted');try{Zt&&Zt()}catch{}}__pwSafePlay(S);}catch{}}}),a(U,"dragover",e=>{e.preventDefault(),U.style.outline="2px solid rgba(255,255,255,.35)"}),a(U,"dragleave",()=>{U.style.outline="none"}),a(U,"drop",async e=>{e.preventDefault(),U.style.outline="none";const t=[...e.dataTransfer?.files||[]];if(!t.length)return;const n=t.find(e=>{const t=(e.name||"").toLowerCase();return t.endsWith(".vtt")||t.endsWith(".srt")}),r=t.find(e=>(e.type||"").startsWith("video/"));if(n&&await Jn(n),r){if("host"!==nt)return void l("Only host can load the video");await sn(r)}}),a(K,"click",()=>{"host"===nt&&Xe?.click()}),a(Re,"click",()=>{"host"===nt?Xe?.click():l("Only host can load the video")}),a(Oe,"click",()=>{"host"===nt?Ue?.click():l("Only host can load audio")}),a(U,"dblclick",e=>{0===e.button&&ke?.click()}),a(Xe,"change",async()=>{const e=Xe.files?.[0];if(e)return"host"!==nt?l("Only host can load video"):void await sn(e)}),a(Ue,"change",async()=>{const e=Ue.files?.[0];if(!e)return;if("host"!==nt)return l("Only host can load audio");if(!_e)return void i("Audio element missing.","err");const t=URL.createObjectURL(e);_e.src=t;try{_e.load()}catch{}try{_e.currentTime=S.currentTime||0}catch{}try{_e.playbackRate=S.playbackRate||1}catch{}try{_e.volume=S.volume}catch{}try{_e.muted=S.muted}catch{}_e.captureStream?at=_e.captureStream():(i("Your browser does not support audio.captureStream(); external audio will be local-only.","warn"),at=null),l("Audio loaded"),i(`Loaded audio: ${e.name}`,"sys"),he&&(he.value="external"),ct="external",Xr(),eo(),"host"===nt&&Br({type:"audioSrc",mode:ct})});/* (removed) MSE/HLS/FFmpeg pipeline stripped for pure WebRTC canvas streaming */function eo(){st=function(){if(!ot)return null;const e=new MediaStream,t=ot.getVideoTracks?.()[0];t&&e.addTrack(t);let n=null;return"external"===ct&&at&&(n=at.getAudioTracks?.()[0]||null),n||(n=ot.getAudioTracks?.()[0]||null),n&&e.addTrack(n),e}(),rt=st;for(const{pc:e}of gt.values())to(e)}function to(e){
  if(!rt) return;
  let peer=null;
  for(const n of gt.values()) if(n?.pc===e){ peer=n; break; }
  const tracks={video:rt.getVideoTracks?.()[0]||null,audio:rt.getAudioTracks?.()[0]||null};
  const senders=peer?._senders||{};
  for(const kind of ['video','audio']){
    const tr=tracks[kind];
    const s=senders[kind]||e.getSenders().find(x=>x.track?.kind===kind);
    if(s) { try{s.replaceTrack(tr)}catch{} }
    else if(tr) { try{e.addTrack(tr,rt)}catch{} }
  }
  try{ applyStreamSenderPrefs(e,__pwHostStreamSettings); }catch{}
}
async function no(e,t){
  if("host"!==nt)return;
  const pid=String(e||"");
  if(!pid)return;

  let entry=gt.get(pid)||null;
  // Reuse existing peer if it's still healthy (preserves the datachannel/chat).
  if(entry){
    const st=entry.pc?.signalingState||"";
    const cs=entry.pc?.connectionState||"";
    if(st==="closed"||cs==="closed"||cs==="failed"){
      try{entry.dc?.close?.()}catch{}
      try{entry.pc?.close?.()}catch{}
      gt.delete(pid);
      entry=null;
    }
  }
  if(!entry){
    const peerId=makePeer({asHost:!0,forcedPeerId:pid});
    entry=gt.get(peerId);
  }
  if(entry){entry.name=t||entry.name||"Viewer";entry.role="viewer";}
  const pc=entry?.pc;
  if(!pc)return;

  // If we have an outbound stream, ensure tracks are attached.
  if(rt){try{to(pc)}catch{}}

  const offer=await pc.createOffer();
  await pc.setLocalDescription(offer);
  await ro(pc);
  Ot({type:"offer",v:1,roomId:It,to:pid,from:kt,peerId:pid,sdp:pc.localDescription,meta:{name:d(Te?.value||"",30)||"Host",room:d(Le?.value||"",30)||"Room"}});
  Kr();
  i(`Sent offer to ${t||"Viewer"}.`,"sys");
}
function ro(e){return new Promise(t=>{if("complete"===e.iceGatheringState)return t();const n=()=>{"complete"===e.iceGatheringState&&(e.removeEventListener("icegatheringstatechange",n),t())};e.addEventListener("icegatheringstatechange",n),setTimeout(()=>t(),1500)})}function oo(e){It=Mt(e)||"",Rt(),function(){const e=It||"";qe&&(qe.value=e&&8===e.length?e.slice(0,4)+" "+e.slice(4):e)}()}function ao(){const txt=Je.value.trim();if(!txt)return;Je.value="";const from=d(Te.value,30)||("host"===nt?"Host":"Me");Lt(kt,from),c(from,txt,"me",kt),O(from,txt);const dcMsg={t:jt.chat,clientId:kt,from:from,text:txt};try{for(const p of gt.values())if("open"===p.dc?.readyState)try{p.dc.send(JSON.stringify(dcMsg))}catch{}}catch{}try{Ct&&Ot({type:"chat",from:from,text:txt,roomId:It,clientId:kt})}catch{}}function so(){J&&(J.classList.remove("on"),J.setAttribute("aria-hidden","true"))}function io(){const e=(z?.value??"").trim();e?(Je.value=e,ao(),so()):so()}function __pwResetPeersOnly(){
  // Close WebRTC peers but keep the signaling WS (role switching reconnects separately).
  try{clearTimeout(Wr)}catch{}Wr=null;
  for(const [id,p] of Array.from(gt.entries())){
    try{p.dc?.close?.()}catch{}
    try{p.pc?.close?.()}catch{}
    gt.delete(id);
  }
  vt=null;
  Ar();
  Kr();
}
function co(){!function(){if(Vt){try{clearInterval(Vt)}catch{}Vt=null}if(Bt){try{clearInterval(Bt)}catch{}Bt=null}}();try{clearTimeout(Wr)}catch{}Wr=null,function(e=""){try{if(Nt){Dt=!0;try{Nt.close(1e3,d(e||"close",40))}catch{Nt?.close?.()}}}finally{Ct=!1,Nt=null,Dt=!1}}("disconnect");for(const[e,t]of Array.from(gt.entries())){try{t.dc?.close()}catch{}try{t.pc?.close()}catch{}gt.delete(e)}vt=null,Ar(),Kr(),tn(!1,"Not connected");try{__pwSegHost.clear();__pwSegViewer.clear();__pwRenderSeg()}catch{}}S.addEventListener("seeked",()=>{"host"===nt&&(clearTimeout(Wr),Wr=setTimeout(()=>Br({type:"seek",t:S.currentTime,paused:S.paused}),120))}),S.addEventListener("play",async()=>{
  if("host"!==nt)return;
  try{window.__pwHostHold=!1}catch{}
  // Auto-start streaming on the first play after a fresh video load.
  if(__pwAutoStartArmed&&!__pwStreamIsLive){
    __pwAutoStartArmed=!1;
    try{
      await __pwStartStreamingWithOptions({autoplay:!1});
      // Renegotiate to current viewers so they receive tracks.
      try{
        const viewers=Array.from(gt.entries()).filter(([pid,peer])=>peer&&peer.role==="viewer");
        for(const [pid,peer] of viewers)try{await no(pid,peer.name||"Viewer")}catch{}
      }catch{}
      try{const b=document.getElementById("btnStartStream");if(b){b.classList.add("on");b.textContent="End"}}catch{}
    }catch(err){
      i("Auto-start stream failed: "+(err?.message||err),"err");
      __pwStreamIsLive=!1;
    }
  }
  Br({type:"play"});
}),S.addEventListener("pause",()=>{"host"===nt&&Br({type:"pause"})}),S.addEventListener("play",()=>{"external"===ct&&Xr()}),S.addEventListener("pause",()=>{if("external"===ct)try{_e.pause()}catch{}}),S.addEventListener("seeking",()=>{if("external"===ct&&_e&&_e.src)try{_e.currentTime=S.currentTime||0}catch{}}),S.addEventListener("ratechange",()=>{if("external"===ct&&_e&&_e.src)try{_e.playbackRate=S.playbackRate||1}catch{}}),S.addEventListener("volumechange",()=>{if(_e)try{_e.volume=S.volume,_e.muted=S.muted}catch{}}),ke&&ke.addEventListener("click",async()=>{const e=be||U;document.fullscreenElement?await document.exitFullscreen():await e.requestFullscreen().catch(()=>{})}),(be||U).addEventListener("mousemove",E),(be||U).addEventListener("touchstart",E,{passive:!0}),xe&&xe.addEventListener("click",async()=>{if(!document.pictureInPictureEnabled)return l("PiP not supported");try{document.pictureInPictureElement?await document.exitPictureInPicture():await S.requestPictureInPicture()}catch{l("PiP failed")}}),window.addEventListener("keydown",e=>{try{const t=e.target&&e.target.tagName?String(e.target.tagName).toLowerCase():"";if("input"===t||"textarea"===t||e.target?.isContentEditable)return;if("host"!==nt){if(e.ctrlKey||e.metaKey)return;if("F5"===e.key||"F12"===e.key)return;const t=e.key,n=e.code,r="string"==typeof t?t.toLowerCase():"";return(k.has(t)||"Space"===n||"f"===r||"m"===r||","===r||"."===r)&&(e.preventDefault(),e.stopPropagation(),w(!0)),"ArrowUp"===t&&(e.preventDefault(),qt(e.shiftKey?.1:.05)),void("ArrowDown"===t&&(e.preventDefault(),qt(e.shiftKey?-.1:-.05)))}if("Space"===e.code)return e.preventDefault(),void ee?.click?.();e.key&&"f"===e.key.toLowerCase()&&ke?.click?.(),e.key&&"m"===e.key.toLowerCase()&&(S.muted=!S.muted,Zt());const n=e.shiftKey?15:5;"ArrowLeft"===e.key&&(e.preventDefault(),Jr(-n)),"ArrowRight"===e.key&&(e.preventDefault(),Jr(n)),"ArrowUp"===e.key&&(e.preventDefault(),qt(e.shiftKey?.1:.05)),"ArrowDown"===e.key&&(e.preventDefault(),qt(e.shiftKey?-.1:-.05)),","===e.key&&(e.preventDefault(),zr(-1)),"."===e.key&&(e.preventDefault(),zr(1))}catch(e){try{i(`Key handler error: ${e?.message||e}`,"err")}catch{}}},!0),a(Ke,"click",async()=>{const e=Mt(It)||"";if(!e)return l("Sharing site address");It=e;const t=function(){const e=new URL(location.href);e.searchParams.set("room",It);const t=Ft()||"";return t?e.searchParams.set("ws",t):e.searchParams.delete("ws"),e.hash="",e.toString()}();await f(t)});a(SP,'click',()=>{try{if(Ct){co();if('viewer'===nt){try{dt=new MediaStream;S.srcObject=dt}catch{}}oo('');l('Disconnected');}else{const rid=Mt(It)||Mt(qe?.value||'');if(!rid){l('No room id');return}It=rid;Ut(nt,It);l('Connecting…');}}catch(e){try{i('Pill click error: '+(e?.message||e),'err')}catch{}}}),a(qe,"click",async()=>{const e=Mt(It)||"";e&&(await f(e),l("Room number copied."))}),a(Ye,"click",async()=>{const e=function(){try{const e=new Uint32Array(1);return crypto.getRandomValues(e),String(e[0]%1e8).padStart(8,"0")}catch(e){return String(Math.floor(1e8*Math.random())).padStart(8,"0")}}();Ze&&(Ze.value=e.slice(0,4)+" "+e.slice(4));l(!(!Nt||1!==Nt.readyState||!It)?"New room number generated. Current room unchanged.":"New room number generated. Click Join to enter it.")}),a(Qe,"click",()=>{const e=Mt(Ze?.value||"");if(!e)return l("Enter an 8-digit room number");nn("viewer"),co();try{Nt?.close?.()}catch(e){}Nt=null,Ct=!1,At=null,oo(e),function(e){try{const t=new URL(location.href),n=Mt(e);n?t.searchParams.set("room",n):t.searchParams.delete("room"),t.hash="",history.replaceState(null,"",t.toString())}catch(e){}}(e),Ut("viewer",e),l("Joining room "+e)}),a(Ve,"click",ao),a(Je,"keydown",e=>{"Enter"===e.key&&ao()}),a(Je,"focus",()=>{try{if(!Te||!Je)return;const nm=(Te.value||"").trim();if(!nm){Je.blur();Te.focus();l("Select a display name")}}catch{}}),a(Je,"mousedown",e=>{try{if(!Te||!Je)return;const nm=(Te.value||"").trim();if(!nm){e.preventDefault();Je.blur();Te.focus();l("Select a display name")}}catch{}}),a(W,"click",io),a(G,"click",so),a(z,"keydown",e=>{"Enter"===e.key&&(e.preventDefault(),io()),"Escape"===e.key&&(e.preventDefault(),so())}),document.addEventListener("keydown",e=>{if(("c"===e.key||"C"===e.key)&&(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement)){if(function(e){if(!e)return!1;const t=(e.tagName||"").toLowerCase();return"input"===t||"textarea"===t||"select"===t||e.isContentEditable}(e.target))return;return e.preventDefault(),void(J&&z&&(R(),j&&j.classList.add("on"),J.classList.add("on"),J.setAttribute("aria-hidden","false"),z.value="",setTimeout(()=>z.focus(),0)))}"Escape"===e.key&&J?.classList.contains("on")&&(e.preventDefault(),so())}),a(ze,"click",()=>{try{const e=document.createElement("canvas");e.width=S.videoWidth||1280,e.height=S.videoHeight||720;e.getContext("2d").drawImage(S,0,0,e.width,e.height);const t=e.toDataURL("image/png"),n=document.createElement("a");n.href=t,n.download="snapshot.png",n.click(),l("Snapshot saved")}catch{l("Snapshot failed")}}),a(We,"click",async()=>{const e=gt.values().next().value;if(!e)return l("No peer");try{const t=await e.pc.getStats();let n=[];t.forEach(e=>{"outbound-rtp"===e.type&&"video"===e.kind&&n.push(`Outbound video: ${Math.round(e.bitrateMean||0)} bps, framesEncoded=${e.framesEncoded}`),"inbound-rtp"===e.type&&"video"===e.kind&&n.push(`Inbound video: framesDecoded=${e.framesDecoded}, packetsLost=${e.packetsLost}`),"candidate-pair"===e.type&&"succeeded"===e.state&&e.nominated&&n.push(`RTT: ${Math.round(1e3*(e.currentRoundTripTime||0))} ms`)}),null!=Jt&&n.push(`App ping RTT: ${Jt} ms`),i("<b>Stats</b><br>"+n.map(u).join("<br>"),"sys"),l("Stats logged")}catch{l("Stats failed")}}),a(S,"timeupdate",()=>{"host"===nt?v():__pwUpdateViewerTimelineUI(false);}),a(S,"play",T),a(S,"pause",T),S.addEventListener("loadedmetadata",()=>{try{__pwHideWaitingOverlay();}catch{}S.volume=Number(ie.value),Yt(S.playbackRate||1);if("host"===nt){ve&&(ve.textContent=p(S.duration||0));v();}else{try{__pwUpdateViewerTimelineUI(true);}catch{}}T();try{if(S.textTracks&&S.textTracks.length){ht=!0;for(const e of S.textTracks)e.mode="showing";l("Embedded subtitles detected"),0}}catch{}});try{!function(){const e=t(localStorage.getItem("peerwatch_prefs")||"{}",{});Te.value=e.displayName||localStorage.getItem(xt)||"",Le&&(Le.value=e.roomName||"");const n=e.theme||"mono";Fe.value=n,zt(n),Ce(),ie.value=e.vol??1,lt=Number(ie.value),S.volume=lt,ut=!!e.muted,S.muted=ut,Qr();if("viewer"===nt){try{S.muted=!0}catch{};try{Zt&&Zt()}catch{}}const r=e.rate??1;S.playbackRate=Number(r),M(),yt=!1!==e.videoMessagesEnabled,A(yt,!1),Gt()}(),function(){if(Ne&&Fe){Ne.innerHTML="";for(const e of Array.from(Fe.options)){const t=document.createElement("button");t.type="button",t.className="pwSelectOpt",t.role="option",t.dataset.value=e.value,t.textContent=e.textContent,t.addEventListener("click",()=>{Fe.value=e.value,Fe.dispatchEvent(new Event("change",{bubbles:!0})),De()}),Ne.appendChild(t)}Ee?.addEventListener("click",e=>{e.preventDefault(),$e&&Ee&&($e.classList.contains("open")?De():($e.classList.add("open"),Ee.setAttribute("aria-expanded","true")))}),document.addEventListener("pointerdown",e=>{$e&&($e.contains(e.target)||De())}),document.addEventListener("keydown",e=>{"Escape"===e.key&&De()}),Ce()}}(),function(){if(ir&&rr){ir.innerHTML="";for(const e of Array.from(rr.options)){const t=document.createElement("button");t.type="button",t.className="pwSelectOpt",t.role="option",t.dataset.value=e.value,t.textContent=e.textContent,t.addEventListener("click",()=>{rr.value=e.value,rr.dispatchEvent(new Event("change",{bubbles:!0})),Ie(),Ae()}),ir.appendChild(t)}ar?.addEventListener("click",e=>{e.preventDefault(),or&&ar&&(or.classList.contains("open")?Ae():(or.classList.add("open"),ar.setAttribute("aria-expanded","true")))}),document.addEventListener("pointerdown",e=>{or&&(or.contains(e.target)||Ae())}),document.addEventListener("keydown",e=>{"Escape"===e.key&&Ae()}),Ie()}}(),function(){try{__pwInitPicker(stSel,stPick,stBtn,stLbl,stMenu,()=>{});__pwInitPicker(srSel,srPick,srBtn,srLbl,srMenu,()=>{});__pwInitPicker(sfSel,sfPick,sfBtn,sfLbl,sfMenu,()=>{});__pwInitPicker(sbSel,sbPick,sbBtn,sbLbl,sbMenu,()=>{});__pwInitPicker(shSel,shPick,shBtn,shLbl,shMenu,()=>{});try{window.addEventListener('resize',()=>{try{document.querySelectorAll('.pwSelect.open').forEach(p=>{p.classList.remove('open');const b=p.querySelector('.pwSelectBtn');b&&b.setAttribute('aria-expanded','false')})}catch{}})}catch{};}catch{}}(),nn("viewer"),zt(Fe?.value||document.documentElement.dataset.theme||"mono"),T(),Wt();Gh();window.addEventListener("resize",Gh),window.addEventListener("orientationchange",Gh),btnCL&&btnCL.addEventListener("click",()=>{const e=Dh(dbgL),t=`logs-${(new Date).toISOString().replace(/[:.]/g,"-")}.txt`,pf=`[${String(nt||"viewer").toUpperCase()}][${kt||"UserID"}]`,fn=pf+t;dbgSave?.checked?Hh(e,fn):f(e)}),btnCE&&btnCE.addEventListener("click",()=>{const e=Dh(dbgE),t=`errors-${(new Date).toISOString().replace(/[:.]/g,"-")}.txt`,pf=`[${String(nt||"viewer").toUpperCase()}][${kt||"UserID"}]`,fn=pf+t;dbgSave?.checked?Hh(e,fn):f(e)}),btnCA&&btnCA.addEventListener("click",()=>{const e=Dh(dbgE),t=Dh(dbgL),n=(e?e+"\n\n":"")+t,r=`debug-${(new Date).toISOString().replace(/[:.]/g,"-")}.txt`,pf=`[${String(nt||"viewer").toUpperCase()}][${kt||"UserID"}]`,fn=pf+r;dbgSave?.checked?Hh(n,fn):f(n)});
try{const vub=document.getElementById("btnViewerUnmute");if(vub){vub.addEventListener("click",e=>{e.preventDefault();__pwToggleViewerUnmute();});}}catch{}try{__pwUpdateViewerUnmuteBtn();}catch{}
const e=Mt(function(){const e=new URL(location.href);let t="";if(e.hash&&e.hash.includes("room=")){const n=e.hash.match(/room=([^&]+)/);t=n?decodeURIComponent(n[1]):""}return t||(t=e.searchParams.get("room")||""),t=d(t,64).replace(/[^a-zA-Z0-9_-]/g,""),t}());e?(oo(e),tn(!1,"Connecting…"),Ut("viewer",e)):(oo(""),tn(!1,"Not connected"),nn("viewer")),Xt(""),i("Ready. Drop a video to start hosting, or open a share link to join instantly.","sys")}catch(e){console.error(e);try{i("Init failed: "+(e?.message||e),"err")}catch{}l("Init failed (see console/log)")}
/* --- Canvas WebRTC Streaming controls --- */
function __pwGetStreamSettings(){
  // Prefer the last applied host settings (authoritative), fall back to UI.
  try{
    if(typeof __pwHostStreamSettings === "object" && __pwHostStreamSettings){
      const ss = __pwHostStreamSettings;
      return {
        type: String(ss.type||"p2p"),
        res: String(ss.res||"auto"),
        fps: String(ss.fps||"auto"),
        bitrate: String(ss.bitrate||"auto"),
        hint: String(ss.hint||"auto"),
      };
    }
  }catch{}
  const type = (document.getElementById("streamTypeSel")?.value||"p2p");
  const res = (document.getElementById("streamResSel")?.value||"auto");
  const fps = (document.getElementById("streamFpsSel")?.value||"auto");
  const bitrate  = (document.getElementById("streamBitrateSel")?.value||"auto");
  const hint= (document.getElementById("streamHintSel")?.value||"auto");
  return {type,res,fps,bitrate,hint};
}
function __pwComputeTargetWH(){
  const vw = Number(S.videoWidth||0), vh = Number(S.videoHeight||0);
  if(!(vw>0&&vh>0)) return {w:0,h:0};
  const {res} = __pwGetStreamSettings();
  let targetH = (res==="480"?480:res==="720"?720:res==="1080"?1080:vh);
  targetH = Math.min(targetH, vh);
  const aspect = vw/vh;
  const w = Math.max(2, Math.round(targetH*aspect));
  const h = Math.max(2, Math.round(targetH));
  return {w,h};
}
function __pwEnsureCanvas(){
  const c = document.getElementById("outCanvas") || __pwCanvasEl;
  if(!c) return null;
  const wh = __pwComputeTargetWH();
  if(!(wh.w>0&&wh.h>0)) return null;
  if(c.width!==wh.w || c.height!==wh.h){ c.width=wh.w; c.height=wh.h; }
  __pwCanvasEl = c;
  __pwCanvasCtx = c.getContext("2d", {alpha:false, desynchronized:true});
  try{ __pwCanvasCtx.imageSmoothingEnabled=true; }catch{}
  return c;
}
function __pwStartDrawLoop(){
  if(__pwCanvasTimer) return;
  let lastTs = 0;
  const draw = (ts)=>{
    if(!__pwStreamIsLive) return;
    const fps = Number(__pwHostStreamSettings?.fps||0)||0;
    const minDt = fps>0 ? (1000/fps) : 0;

    // Throttle draw work (especially important on Android hosts).
    if(minDt && lastTs && (ts - lastTs) < (minDt - 1)){
      requestAnimationFrame(draw);
      return;
    }
    lastTs = ts || performance.now();

    const c = __pwEnsureCanvas();
    if(!c || !__pwCanvasCtx) { requestAnimationFrame(draw); return; }
    try{ __pwCanvasCtx.drawImage(S, 0, 0, c.width, c.height); }catch{}
    requestAnimationFrame(draw);
  };
  __pwCanvasTimer = 1;
  requestAnimationFrame(draw);
}
function __pwStopDrawLoop(){ __pwCanvasTimer = null; }

function __pwComputeTargetDims(srcW,srcH,resVal){
  const w=Math.max(2,Number(srcW||0)||0);
  const h=Math.max(2,Number(srcH||0)||0);
  const v=String(resVal||"auto").toLowerCase();
  if(v==="auto"||v===""){
    return {targetW:w,targetH:h};
  }
  const maxH=Number(v);
  if(!Number.isFinite(maxH) || maxH<=0){
    return {targetW:w,targetH:h};
  }
  const targetH=Math.min(maxH,h);
  const targetW=Math.max(2,Math.round(targetH*(w/h)));
  return {targetW,targetH};
}
function __pwBuildOutgoingStream(){
  const c = __pwEnsureCanvas();
  if(!c) throw new Error("Canvas not ready (load a video first).");
  const {fps, bitrate, hint} = __pwGetStreamSettings();
  const fpsNum = Number(fps);
  const useFps = Number.isFinite(fpsNum) && fpsNum>0 ? fpsNum : null;
  const cs = useFps ? c.captureStream(useFps) : c.captureStream();
  const vTrack = cs.getVideoTracks?.()[0] || null;
  if(vTrack){
    try{
      if(hint && hint!=="auto") vTrack.contentHint = hint;
      if(bitrate!=="auto"){
        const b = Number(bitrate);
        vTrack.__pwMaxBitrate = (Number.isFinite(b)&&b>0)?b:null;
      }else vTrack.__pwMaxBitrate = null;
    }catch{}
  }
  let aTrack = null;
  try{ const as = S.captureStream ? S.captureStream() : null; aTrack = as?.getAudioTracks?.()[0] || null; }catch{}
  const out = new MediaStream();
  if(vTrack) out.addTrack(vTrack);
  if(aTrack) out.addTrack(aTrack);
  __pwCanvasStream = cs;
  __pwAudioStream = aTrack ? new MediaStream([aTrack]) : null;
  __pwOutStream = out;
  return out;
}
async function __pwStartStreamingWithOptions(opts){
  if("host"!==nt) return l("Only host can start streaming");
  if(__pwStreamIsLive) return;
  if(!(S && (S.src||S.srcObject))) return l("Load a video first");
  if(!(Number(S.videoWidth||0)>0 && Number(S.videoHeight||0)>0)){
    await new Promise(res=>S.addEventListener("loadedmetadata",()=>res(),{once:true}));
  }
  __pwStreamIsLive=true;
  __pwStartDrawLoop();
  const out = __pwBuildOutgoingStream();
  rt = out;
  for(const [pid,peer] of gt.entries()){const pc=peer.pc;
    try{ to(pc); }catch{}
    try{
      const senders = pc?.getSenders?.()||[];
      for(const snd of senders){
        if(snd?.track?.kind==="video"){
          const b = snd.track.__pwMaxBitrate;
          if(Number.isFinite(Number(b)) && b>0){
            const p = snd.getParameters();
            p.encodings = p.encodings && p.encodings.length ? p.encodings : [{}];
            p.encodings[0].maxBitrate = Number(b);
            snd.setParameters(p).catch(()=>{});
          }
        }
      }
    }catch{}
    try{ no(pid,peer.name||""); }catch{}
  }
  try{ const ap=!(opts&&opts.autoplay===false); if(ap) await S.play(); }catch{}
  try{__pwStartHostTimeTicker();Br({type:"time",t:Number(S.currentTime||0),d:Number(S.duration||0),paused:S.paused})}catch{}
  l("Streaming started");
}
function __pwStopStreaming(){
  if(!__pwStreamIsLive) return;
  __pwStreamIsLive=false;
  __pwStopDrawLoop();
  try{
    for(const [pid,peer] of gt.entries()){const pc=peer.pc;
      const senders = pc?.getSenders?.()||[];
      for(const snd of senders){
        if(snd?.track && (snd.track.kind==="video"||snd.track.kind==="audio")){
          try{ snd.replaceTrack(null); }catch{}
        }
      }
    }
  }catch{}
  try{ __pwOutStream?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}); }catch{}
  try{ __pwCanvasStream?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}); }catch{}
  __pwOutStream=null; __pwCanvasStream=null; __pwAudioStream=null; rt=null;
  l("Streaming stopped");
}
function __pwWireStartButton(){
  const b = document.getElementById("btnStartStream");
  if(!b) return;
  // Enabled once host has a loaded media source.
  b.disabled = !(nt==="host" && (S && (S.src||S.srcObject)));
  b.addEventListener("click", async ()=>{
    if(nt!=="host"){ l("Only host can start streaming"); return; }
    if(!__pwStreamIsLive){
      // Start is the only place we intentionally begin playback.
      try{ if(S && S.paused) await S.play(); }catch{}
      try{
        await __pwStartStreamingWithOptions({autoplay:true});
        // Renegotiate to all current viewers so they receive tracks (initial PCs may have been created before tracks existed).
        try{
          const viewers = Array.from(gt.entries()).filter(([pid,peer])=>peer && peer.role==="viewer");
          for(const [pid,peer] of viewers){
            try{ await no(pid, peer.name||"Viewer"); }catch{}
          }
        }catch{}
        b.classList.add("on");
        b.textContent = "End";
      }catch(err){
        i("Start stream failed: "+(err?.message||err),"err");
        l("Start failed");
        __pwStreamIsLive=false;
      }
    }else{
      try{ __pwStopStreaming(); }catch{}
      b.classList.remove("on");
      b.textContent = "Start";
    }
  });
}

function __pwGetStreamSettingsFromUI(){
  const typeSel=document.getElementById("streamTypeSel");
  const resSel=document.getElementById("streamResSel");
  const fpsSel=document.getElementById("streamFpsSel");
  const brSel=document.getElementById("streamBitrateSel");
  const hintSel=document.getElementById("streamHintSel");
  return {
    type: String(typeSel?.value||"p2p"),
    res: String(resSel?.value||"auto"),
    fps: String(fpsSel?.value||"auto"),
    bitrate: String(brSel?.value||"auto"),
    hint: String(hintSel?.value||"auto"),
  };
}
const __pwDefaultStreamSettings={type:"p2p",res:"auto",fps:"auto",bitrate:"auto",hint:"auto"};
let __pwHostStreamSettings=Object.assign({},__pwDefaultStreamSettings);


function __pwSetStreamUIFromSettings(s){
  const st=s||__pwDefaultStreamSettings;
  try{const sel=document.getElementById("streamTypeSel"); if(sel) sel.value=(String(st.type||"p2p")==="relay"?"p2p":String(st.type||"p2p"));}catch{}
  try{const sel=document.getElementById("streamResSel"); if(sel) sel.value=String(st.res||"auto");}catch{}
  try{const sel=document.getElementById("streamFpsSel"); if(sel) sel.value=String(st.fps||"auto");}catch{}
  try{const sel=document.getElementById("streamBitrateSel"); if(sel) sel.value=String(st.bitrate||"auto");}catch{}
  try{const sel=document.getElementById("streamHintSel"); if(sel) sel.value=String(st.hint||"auto");}catch{}
  try{const lab=document.getElementById("streamTypeBtnLabel"); if(lab) lab.textContent=(String(st.type||"p2p")==="relay"?"P2P":String(st.type||"p2p").toUpperCase());}catch{}
  try{const lab=document.getElementById("streamResBtnLabel"); if(lab) lab.textContent=(String(st.res||"auto")==="auto"?"Auto":(String(st.res)+"p"));}catch{}
  try{const lab=document.getElementById("streamFpsBtnLabel"); if(lab) lab.textContent=(String(st.fps||"auto")==="auto"?"Auto":String(st.fps));}catch{}
  try{const lab=document.getElementById("streamBitrateBtnLabel"); if(lab){ const v=String(st.bitrate||"auto"); lab.textContent=(v==="auto"?"Auto":(Math.round(Number(v)/1000)+"k")); }}catch{}
  try{const lab=document.getElementById("streamHintBtnLabel"); if(lab){ const v=String(st.hint||"auto"); lab.textContent=(v==="auto"?"Auto":(v.charAt(0).toUpperCase()+v.slice(1))); }}catch{}
}
function __pwResetStreamSettingsUI(){
  __pwSetStreamUIFromSettings(__pwDefaultStreamSettings);
}

function applyStreamSenderPrefs(pc, settings){
  try{
    if(!pc || !pc.getSenders) return;
    const s = settings || __pwHostStreamSettings || {};
    const br = String(s.bitrate||"auto");
    const fps = String(s.fps||"auto");
    const hint = String(s.hint||"auto");
    let maxBitrate = null;
    if(br !== "auto"){
      const b = Number(br);
      if(Number.isFinite(b) && b>0) maxBitrate = b;
    }
    let maxFr = null;
    if(fps !== "auto"){
      const f = Number(fps);
      if(Number.isFinite(f) && f>0) maxFr = f;
    }
    const senders = pc.getSenders() || [];
    for(const snd of senders){
      if(!snd || !snd.track) continue;
      if(snd.track.kind !== "video") continue;

      try{
        if(hint && hint !== "auto") snd.track.contentHint = hint;
      }catch{}

      try{
        const p = snd.getParameters ? snd.getParameters() : null;
        if(!p) continue;
        p.encodings = (p.encodings && p.encodings.length) ? p.encodings : [{}];

        if(maxBitrate) p.encodings[0].maxBitrate = maxBitrate;
        else if(p.encodings[0].maxBitrate) delete p.encodings[0].maxBitrate;

        if(maxFr) p.encodings[0].maxFramerate = maxFr;
        else if(p.encodings[0].maxFramerate) delete p.encodings[0].maxFramerate;

        if(!p.degradationPreference || p.degradationPreference === "balanced"){
          if(hint === "motion") p.degradationPreference = "maintain-framerate";
          else if(hint === "detail") p.degradationPreference = "maintain-resolution";
        }
        snd.setParameters(p).catch(()=>{});
      }catch{}
    }
  }catch{}
}

async function __pwRebuildAndReplaceOutgoingTracks(){
  try{
    try{ __pwCanvasStream?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}); }catch{}
    // Do NOT stop audio track if it's from the <video> captureStream; but if present in __pwOutStream, let replaceTrack swap it.
    try{ __pwOutStream?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}); }catch{}
  }catch{}
  const out = __pwBuildOutgoingStream();
  rt = out;
  const vTrack = out.getVideoTracks?.()[0] || null;
  const aTrack = out.getAudioTracks?.()[0] || null;

  for(const peer of gt.values()){
    const pc = peer?.pc;
    if(!pc || !pc.getSenders) continue;
    const senders = pc.getSenders() || [];
    for(const snd of senders){
      if(!snd) continue;
      try{
        if(snd.track?.kind === "video" && vTrack) await snd.replaceTrack(vTrack);
        if(snd.track?.kind === "audio" && aTrack) await snd.replaceTrack(aTrack);
      }catch{}
    }
    try{ applyStreamSenderPrefs(pc, __pwHostStreamSettings); }catch{}
  }
  // Best-effort keyframe request (supported in some Chromium builds).
  try{
    for(const peer of gt.values()){
      const pc = peer?.pc;
      const senders = pc?.getSenders?.()||[];
      for(const snd of senders){
        if(snd?.track?.kind==="video" && typeof snd.generateKeyFrame==="function"){
          snd.generateKeyFrame().catch(()=>{});
        }
      }
    }
  }catch{}
}

async function __pwApplyStreamSettings(){
  if(nt!=='host'){ l('Only host can apply stream settings'); return; }
  const prev = Object.assign({}, __pwHostStreamSettings||__pwDefaultStreamSettings);
  const sUI=__pwGetStreamSettingsFromUI();
  __pwHostStreamSettings=Object.assign({},sUI);
  try{ __pwSetStreamUIFromSettings(__pwHostStreamSettings); }catch{}
  try{ Br({type:'streamSettings',settings:__pwHostStreamSettings}); }catch{}
  if(!__pwStreamIsLive){
    l('Stream settings applied');
    return;
  }
  const resChanged = String(prev.res||"auto") !== String(__pwHostStreamSettings.res||"auto");
  const fpsChanged = String(prev.fps||"auto") !== String(__pwHostStreamSettings.fps||"auto");

  try{
    if(resChanged || fpsChanged){
      await __pwRebuildAndReplaceOutgoingTracks();
    }else{
      for(const p of gt.values()){
        try{ applyStreamSenderPrefs(p.pc,__pwHostStreamSettings); }catch{}
      }
    }
  }catch{}
  l('Stream settings applied');
}
function __pwWireStreamApplyReset(){
  const applyBtn=document.getElementById("btnStreamApply");
  const resetBtn=document.getElementById("btnStreamReset");
  if(resetBtn){
    resetBtn.addEventListener("click",()=>{
      if(nt!=="host") return;
      __pwResetStreamSettingsUI();
    });
  }
  if(applyBtn){
    applyBtn.addEventListener("click",async ()=>{
      if(nt!=="host") return;
      await __pwApplyStreamSettings();
    });
  }
}
try{ __pwWireStreamApplyReset(); }catch{}

try{ __pwWireStartButton(); }catch{}


function __pwInitPwSelect(nativeId,pickerId,btnId,labelId,menuId){
  const sel=document.getElementById(nativeId);
  const picker=document.getElementById(pickerId);
  const btn=document.getElementById(btnId);
  const label=document.getElementById(labelId);
  const menu=document.getElementById(menuId);
  if(!sel||!picker||!btn||!label||!menu) return;
  menu.innerHTML="";
  const close=()=>{picker.classList.remove("open");btn.setAttribute("aria-expanded","false");};
  const open=()=>{picker.classList.add("open");btn.setAttribute("aria-expanded","true");};
  for(const opt of Array.from(sel.options||[])){
    const b=document.createElement("button");
    b.type="button";
    b.className="pwSelectOpt";
    b.role="option";
    b.dataset.value=opt.value;
    b.textContent=opt.textContent;
    if(opt.disabled) b.disabled=true;
    b.addEventListener("click",()=>{
      if(opt.disabled) return;
      sel.value=opt.value;
      sel.dispatchEvent(new Event("change",{bubbles:true}));
      label.textContent=opt.textContent;
      close();
    });
    menu.appendChild(b);
  }
  const sync=()=>{
    const o=sel.selectedOptions?.[0];
    if(o) label.textContent=o.textContent;
  };
  sel.addEventListener("change",sync);
  btn.addEventListener("click",(e)=>{e.preventDefault();picker.classList.contains("open")?close():open();});
  document.addEventListener("pointerdown",(e)=>{picker.contains(e.target)||close();});
  document.addEventListener("keydown",(e)=>{"Escape"===e.key&&close();});
  sync();
}
try{
  __pwInitPwSelect("streamTypeSel","streamTypePicker","streamTypeBtn","streamTypeBtnLabel","streamTypeMenu");
  __pwInitPwSelect("streamResSel","streamResPicker","streamResBtn","streamResBtnLabel","streamResMenu");
  __pwInitPwSelect("streamFpsSel","streamFpsPicker","streamFpsBtn","streamFpsBtnLabel","streamFpsMenu");
  __pwInitPwSelect("streamBitrateSel","streamBitratePicker","streamBitrateBtn","streamBitrateBtnLabel","streamBitrateMenu");
  __pwInitPwSelect("streamHintSel","streamHintPicker","streamHintBtn","streamHintBtnLabel","streamHintMenu");
}catch{}


/* --- One-line controls: hide buttons in priority order when tight --- */
function __pwSetupControlOverflow(){
  const row = document.querySelector("#pwControls .pwRow");
  const ctl = document.getElementById("pwControls");
  if(!row || !ctl) return;
  const order = ["hideVolBar","hideStep","hideVolBtns","hidePiP","hideSkip10"];
  function apply(){
    order.forEach(c=>ctl.classList.remove(c));
    for(const c of order){
      if(row.scrollWidth <= row.clientWidth + 2) break;
      ctl.classList.add(c);
    }
  }
  apply();
  window.addEventListener("resize", apply);
  try{ new ResizeObserver(apply).observe(row); }catch{}
}
try{ __pwSetupControlOverflow(); }catch{}
/* --- End canvas streaming controls --- */
});



//test