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

export function setStreamQuality(id){
  dispatch({ type:"SET_STREAM_QUALITY", id });
}
