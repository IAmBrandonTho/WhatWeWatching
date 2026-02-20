import { reducer } from "./reducer.js";
import { render } from "./render.js";
import { AppState } from "./state.js";

export function dispatch(action) {
  reducer(AppState, action);
  render(AppState, action);
}
