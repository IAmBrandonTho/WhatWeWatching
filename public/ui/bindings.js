import { initDropdowns } from "./dropdowns.js";
import { initButtons } from "./buttons.js";

let initialized=false;

export function initUI(){
  if(initialized) return;
  initialized=true;

  initDropdowns();
  initButtons();
}