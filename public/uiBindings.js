
// uiBindings.js
let initialized = false;
let openDropdown = null;

export function initUIBindings() {
  if (initialized) return;
  initialized = true;

  document.addEventListener("click", (e) => {
    if (e.target.closest("#btnStreamApply")) {
      document.dispatchEvent(new CustomEvent("ui:apply"));
    }

    if (e.target.closest("#btnStreamReset")) {
      document.dispatchEvent(new CustomEvent("ui:reset"));
    }

    const btn = e.target.closest(".pwSelectBtn");
    if (btn) {
      const dropdown = btn.closest(".pwSelect");

      if (openDropdown && openDropdown !== dropdown) {
        openDropdown.classList.remove("open");
      }

      dropdown.classList.toggle("open");
      openDropdown = dropdown.classList.contains("open")
        ? dropdown
        : null;

      return;
    }

    
    const opt = e.target.closest(".pwSelectOpt");
    if(opt){
      const value = opt.dataset.value;
      import("./actions.js").then(m=>m.setStreamQuality(value));
      if(openDropdown){
        openDropdown.classList.remove("open");
        openDropdown=null;
      }
      return;
    }

    if (openDropdown && !e.target.closest(".pwSelect")) {
      openDropdown.classList.remove("open");
      openDropdown = null;
    }
  });
}
