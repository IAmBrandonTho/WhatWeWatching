let container = null;

function ensureContainer(){
  if(container) return container;
  container = document.createElement("div");
  container.style.position="fixed";
  container.style.bottom="20px";
  container.style.right="20px";
  container.style.display="flex";
  container.style.flexDirection="column";
  container.style.gap="10px";
  container.style.zIndex="9999";
  container.style.pointerEvents="none";
  document.body.appendChild(container);
  return container;
}

function showToast({message, duration=3000}){
  const root = ensureContainer();

  const el = document.createElement("div");
  el.textContent = message;
  el.style.background="rgba(0,0,0,0.85)";
  el.style.color="#fff";
  el.style.padding="10px 14px";
  el.style.borderRadius="8px";
  el.style.fontSize="13px";
  el.style.opacity="0";
  el.style.transform="translateY(10px)";
  el.style.transition="opacity .2s ease, transform .2s ease";
  el.style.pointerEvents="none";

  root.appendChild(el);

  requestAnimationFrame(()=>{
    el.style.opacity="1";
    el.style.transform="translateY(0)";
  });

  setTimeout(()=>{
    el.style.opacity="0";
    el.style.transform="translateY(10px)";
    setTimeout(()=>el.remove(),200);
  }, duration);
}

document.addEventListener("ui:toast",(e)=>{
  showToast(e.detail || {});
});