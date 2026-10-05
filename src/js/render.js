import { state } from "./state.js";
import { $, MESES, esc, hm } from "./utils.js";
import { saveCfg } from "./api.js";
import { entries, group } from "./data.js";
import { renderBody } from "./report.js";

export function render(){
  const [y,mo1]=state.month.split("-").map(Number), mo=mo1-1;
  $("month").value=state.month;
  $("round").value=String(state.cfg.round);
  $("range").textContent=`Reporte de horas · ${MESES[mo]} de ${y}`;

  const groups=group(entries());
  // chips de proyectos con horas este mes
  $("pchips").innerHTML=groups.length?groups.map(g=>{
    const on=!state.cfg.hidden.includes(g.pid);
    return `<span class="pchip${on?"":" off"}"><input type="checkbox" data-p="${esc(g.pid)}" ${on?"checked":""} aria-label="Incluir ${esc(g.name)}"><span class="dot" style="background:${g.color}"></span><input type="text" data-n="${esc(g.pid)}" value="${esc(g.name)}" aria-label="Nombre del proyecto en el reporte"><span class="h">${hm(g.s.total)} h</span></span>`;
  }).join(""):"";
  $("pchips").querySelectorAll("input[type=checkbox]").forEach(cb=>cb.addEventListener("change",e=>{
    const p=e.target.dataset.p; state.cfg.hidden=state.cfg.hidden.filter(x=>x!==p); if(!e.target.checked) state.cfg.hidden.push(p); saveCfg(); render();
  }));
  $("pchips").querySelectorAll("input[type=text]").forEach(inp=>inp.addEventListener("change",e=>{
    const p=e.target.dataset.n, v=e.target.value.trim(), orig=state.projectsById[p]?state.projectsById[p].title:"Sin proyecto";
    if(!v||v===orig) delete state.cfg.names[p]; else state.cfg.names[p]=v; saveCfg(); render();
  }));

  const all=groups.filter(g=>!state.cfg.hidden.includes(g.pid));
  if(!all.length){
    $("out").innerHTML=`<div class="empty">${groups.length?"No hay proyectos seleccionados.":`No hay horas registradas en ${MESES[mo]} de ${y}.`}</div>`;
    return;
  }
  renderBody(all,y,mo);
}
