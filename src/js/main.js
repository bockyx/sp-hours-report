import "../styles/index.css";
import { state } from "./state.js";
import { $, pad } from "./utils.js";
import { waitApi, loadCfg, saveCfg, fetchData } from "./api.js";
import { t, loadI18n, applyStatic, currentLanguage, getLang } from "./i18n.js";
import { entries } from "./data.js";
import { render } from "./render.js";

function shiftMonth(delta){
  const [y,m]=state.month.split("-").map(Number), d=new Date(y,m-1+delta,1);
  state.month=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; render();
}
function showErr(msg){const e=$("err");e.hidden=!msg;e.textContent=msg||"";}

async function refresh(){
  try{showErr("");await fetchData();render();}
  catch(e){console.error(e);showErr(t("ERROR.READ_TASKS",{error:e&&e.message||e}));}
}

(async()=>{
  try{
    await waitApi();
    await loadI18n();
    applyStatic();
    await loadCfg();
    await fetchData();
    // mes por defecto: el actual, o el anterior si el actual aún no tiene horas
    const now=new Date();
    state.month=`${now.getFullYear()}-${pad(now.getMonth()+1)}`;
    if(!entries().length){const p=new Date(now.getFullYear(),now.getMonth()-1,1);state.month=`${p.getFullYear()}-${pad(p.getMonth()+1)}`;}
    render();
  }catch(e){console.error(e);showErr(e&&e.message==="NO_API"?t("ERROR.NO_API"):String(e&&e.message||e));}
  $("prevM").onclick=()=>shiftMonth(-1);
  $("nextM").onclick=()=>shiftMonth(1);
  $("month").addEventListener("change",e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)){state.month=e.target.value;render();}});
  $("round").addEventListener("change",e=>{state.cfg.round=+e.target.value;saveCfg();render();});
  $("refresh").onclick=refresh;
  // si cambia el idioma de la app, recarga los textos al volver a la ventana
  window.addEventListener("focus",async()=>{
    if(await currentLanguage()===getLang()) return;
    await loadI18n(); applyStatic(); if(state.month) render();
  });
})();
