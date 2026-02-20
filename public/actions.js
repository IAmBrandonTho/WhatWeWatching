import { reducer } from "./reducer.js";
import { render, updateTimelineTick } from "./render.js";
import { AppState } from "./state.js";

export function dispatch(action){
  reducer(AppState, action);
  render(AppState, action);
  if(action.type === "TIMELINE_UPDATE"){
    requestAnimationFrame(()=>updateTimelineTick(AppState));
  }
}

// Bridge UI events into state actions
document.addEventListener("ui:action", (e) => {
  if (!e.detail || !e.detail.type) return;
  dispatch({ type: e.detail.type });
});
