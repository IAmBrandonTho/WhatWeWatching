import { dispatch } from "./actions.js";

export function bindUI(){

  // Dropdown buttons
  document.querySelectorAll(".pwSelectBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      // close others
      document.querySelectorAll(".pwSelectBtn.open")
        .forEach(b => { if(b !== btn) b.classList.remove("open"); });

      btn.classList.toggle("open");

      dispatch({
        type: "UI_SELECT_TOGGLE",
        id: btn.id || null
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".pwSelectBtn.open")
      .forEach(b => b.classList.remove("open"));
  });

  // Generic button dispatcher (safe fallback)
  document.querySelectorAll("button[id]").forEach(btn => {
    btn.addEventListener("click", () => {
      dispatch({
        type: "UI_BUTTON_CLICK",
        id: btn.id
      });
    });
  });

  console.log("[UI] bindings attached");
}