import { reducer } from "./reducer.js";
import { render } from "./render.js";
import { AppState } from "./state.js";

let state = structuredClone(AppState);

export function dispatch(action) {
  reducer(state, action);
  render(state);
}

export function getState() {
  return state;
}
