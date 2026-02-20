export function initDropdowns(){

  document.querySelectorAll(".pwSelectBtn").forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      const root=btn.closest(".pwSelect");
      if(!root) return;

      root.classList.toggle("open");
      e.stopPropagation();
    });
  });

  document.addEventListener("click",()=>{
    document.querySelectorAll(".pwSelect.open")
      .forEach(el=>el.classList.remove("open"));
  });
}