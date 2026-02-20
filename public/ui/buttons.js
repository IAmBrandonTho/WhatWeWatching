import { dispatch } from "../actions.js";

export function initButtons(){

  const apply=document.getElementById("btnStreamApply");
  if(apply){
    apply.addEventListener("click",()=>{
      dispatch({type:"APPLY_SETTINGS"});
    });
  }

  const reset=document.getElementById("btnStreamReset");
  if(reset){
    reset.addEventListener("click",()=>{
      document.querySelectorAll("[data-quality-default]")
        .forEach(el=>{
          el.value=el.dataset.qualityDefault;
        });
    });
  }
}