import { state } from "./state.js";
import { PALETTE } from "./utils.js";
import { t } from "./i18n.js";

// Una entrada por tarea y día, solo tareas sin subtareas (igual que la exportación de la app)
export function entries(){
  const byId=new Map(state.tasks.map(t=>[t.id,t]));
  const f=+state.cfg.round||0, out=[];
  for(const t of state.tasks){
    if(t.subTaskIds&&t.subTaskIds.length) continue;
    const tsd=t.timeSpentOnDay; if(!tsd) continue;
    const parent=t.parentId?byId.get(t.parentId):null;
    const pid=t.projectId||(parent&&parent.projectId)||"__none";
    const title=parent?`${parent.title} › ${t.title}`:t.title;
    for(const [date,ms] of Object.entries(tsd)){
      if(!date.startsWith(state.month)||!ms) continue;
      let m=Math.round(ms/60000);
      if(f) m=Math.ceil(m/f)*f;
      if(m>0) out.push({pid,date,title:(title||t("TABLE.UNTITLED")).trim(),min:m});
    }
  }
  return out;
}
export function projName(pid){
  if(state.cfg.names[pid]) return state.cfg.names[pid];
  const p=state.projectsById[pid];
  return p?p.title:t("PROJECT.NONE");
}
export function projColor(pid,i){
  const p=state.projectsById[pid], c=p&&p.theme&&p.theme.primary;
  return typeof c==="string"&&/^#|^rgb|^hsl/.test(c)?c:PALETTE[i%PALETTE.length];
}

export function group(list){
  // devuelve [{pid,name,color,rows:[{date,min,items:[{title,min}]}],s:{list,total}}]
  const m=new Map();
  for(const e of list){
    const g=m.get(e.pid)||{pid:e.pid,days:new Map(),tasks:new Map(),total:0};
    g.total+=e.min;
    const d=g.days.get(e.date)||{date:e.date,min:0,items:new Map()};
    d.min+=e.min; d.items.set(e.title,(d.items.get(e.title)||0)+e.min); g.days.set(e.date,d);
    const t=g.tasks.get(e.title)||{min:0,days:new Set()};
    t.min+=e.min; t.days.add(e.date); g.tasks.set(e.title,t);
    m.set(e.pid,g);
  }
  return [...m.values()].sort((a,b)=>b.total-a.total).map((g,i)=>({
    pid:g.pid, name:projName(g.pid), color:projColor(g.pid,i),
    rows:[...g.days.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({date:d.date,min:d.min,items:[...d.items.entries()].sort((a,b)=>b[1]-a[1]).map(([title,min])=>({title,min}))})),
    s:{list:[...g.tasks.entries()].sort((a,b)=>b[1].min-a[1].min||b[1].days.size-a[1].days.size),total:g.total}
  }));
}
