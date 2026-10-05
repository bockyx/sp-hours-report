import { state } from "./state.js";
import { MONTHS, $, esc, hm, dn, pad, tint } from "./utils.js";
import { t, monthShort, weekdayShortMon, weekdayShortOf } from "./i18n.js";
import { api } from "./api.js";
import { buildMd, recalcMd, plainTextFrom, mdToHtml } from "./markdown.js";
import { copyText } from "./clipboard.js";
import { buildCsv } from "./csv.js";

export function renderBody(all,y,mo){
  const title=`${MONTHS[mo]} ${y}`;
  const grand=all.reduce((a,x)=>a+x.s.total,0);
  const byDay={};
  all.forEach((x,i)=>{for(const r of x.rows){const d=(byDay[r.date]??={});d[i]=(d[i]||0)+r.min;}});
  const dayCount=Object.keys(byDay).length;

  let h=`<div class="summary">
    <div class="stat"><div class="eyebrow">${t("SUMMARY.TOTAL")}</div><div class="big">${hm(grand)} h</div><div class="sub">${t("SUMMARY.DAYS_LOGGED",{n:dayCount})}</div>
      <div class="split">${all.map(x=>`<span style="width:${x.s.total/grand*100}%;background:${x.color}"></span>`).join("")}</div></div>
    ${all.map(x=>`<div class="stat"><div class="eyebrow">${esc(x.name)}</div><div class="big" style="color:${x.color}">${hm(x.s.total)} h</div><div class="sub">${t("SUMMARY.PROJECT_SUB",{days:x.rows.length,pct:Math.round(x.s.total/grand*100)})}</div></div>`).join("")}
  </div>`;

  // calendario
  const dim=new Date(y,mo+1,0).getDate(), first=(new Date(y,mo,1).getDay()+6)%7;
  h+=`<section><h2>${t("CALENDAR.TITLE")}</h2><div class="cal">`+[0,1,2,3,4,5,6].map(i=>`<div class="dow">${esc(weekdayShortMon(i))}</div>`).join("")+'<div class="day blank"></div>'.repeat(first);
  for(let d=1;d<=dim;d++){
    const key=`${y}-${pad(mo+1)}-${pad(d)}`, v=byDay[key];
    if(!v){h+=`<div class="day off"><span class="d">${d}</span></div>`;continue;}
    let mins=0,bars="",tip=[];
    all.forEach((x,i)=>{const m=v[i]||0;if(!m)return;mins+=m;tip.push(x.name+" "+hm(m)+" h");bars+=`<i style="background:${x.color}"></i>`.repeat(Math.max(1,Math.round(m/60)));});
    h+=`<div class="day" title="${esc(tip.join(" · "))}"><span class="d">${d}</span><span class="h">${hm(mins)} h</span><span class="bars">${bars}</span></div>`;
  }
  h+=`</div><div class="legend">${all.map(x=>`<span><i class="dot" style="background:${x.color}"></i>${esc(t("CALENDAR.LEGEND",{name:x.name}))}</span>`).join("")}</div></section>`;

  // semanas (lunes a domingo)
  const wk={};
  for(const [date,v] of Object.entries(byDay)){
    const dt=new Date(date+"T12:00:00"), mon=new Date(dt); mon.setDate(dt.getDate()-(dt.getDay()+6)%7);
    const k=`${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`, w=(wk[k]??={});
    for(const [i,m] of Object.entries(v)) w[i]=(w[i]||0)+m;
  }
  const keys=Object.keys(wk).sort();
  const wt=k=>Object.values(wk[k]).reduce((a,b)=>a+b,0), maxW=Math.max(...keys.map(wt));
  const lbl=k=>{const a=new Date(k+"T12:00:00"),b=new Date(a);b.setDate(a.getDate()+6);return `${a.getDate()} ${monthShort(a.getMonth())} – ${b.getDate()} ${monthShort(b.getMonth())}`;};
  h+=`<section><h2>${t("WEEKS.TITLE")}</h2><div class="tablebox"><table><thead><tr><th>${t("WEEKS.WEEK")}</th>${all.map(x=>`<th class="r">${esc(x.name)}</th>`).join("")}<th class="r">${t("TABLE.TOTAL")}</th><th></th></tr></thead><tbody>`+
    keys.map(k=>`<tr><td>${lbl(k)}</td>${all.map((x,i)=>`<td class="r num">${hm(wk[k][i]||0)}</td>`).join("")}<td class="r num"><strong>${hm(wt(k))}</strong></td><td><span class="wbar">${all.map((x,i)=>`<i style="width:${(wk[k][i]||0)/maxW*120}px;background:${x.color}"></i>`).join("")}</span></td></tr>`).join("")+
    `</tbody><tfoot><tr><td>${t("TABLE.TOTAL")}</td>${all.map(x=>`<td class="r num">${hm(x.s.total)}</td>`).join("")}<td class="r num">${hm(grand)}</td><td></td></tr></tfoot></table></div></section>`;

  // proyectos
  for(const x of all){
    h+=`<section class="proj"><div class="proj-head"><h2 style="color:${x.color}">${esc(x.name)}</h2><span class="tot num">${hm(x.s.total)} h</span></div>
    <h3>${t("TABLE.TASKS")}</h3><div class="tablebox"><table><thead><tr><th>${t("TABLE.TASK")}</th><th class="r">${t("TABLE.DAYS")}</th><th class="r">${t("TABLE.HOURS")}</th></tr></thead><tbody>`+
    x.s.list.map(([n,t])=>`<tr><td>${esc(n)}</td><td class="r num">${t.days.size}</td><td class="r num">${hm(t.min)}</td></tr>`).join("")+
    `</tbody><tfoot><tr><td>${t("TABLE.TOTAL")}</td><td></td><td class="r num">${hm(x.s.total)}</td></tr></tfoot></table></div>
    <h3>${t("TABLE.DAY_DETAIL")}</h3><div class="tablebox"><table><thead><tr><th>${t("TABLE.DATE")}</th><th>${t("TABLE.TASKS")}</th><th class="r">${t("TABLE.HOURS")}</th></tr></thead><tbody>`+
    x.rows.map(r=>`<tr><td style="white-space:nowrap">${esc(weekdayShortOf(r.date))} ${dn(r.date)}</td><td>${r.items.map(t=>`<span class="chip" style="background:${tint(x.color)}">${esc(t.title)}${r.items.length>1?` · ${hm(t.min)}`:""}</span>`).join("")}</td><td class="r num">${hm(r.min)}</td></tr>`).join("")+
    `</tbody></table></div></section>`;
  }

  const reportHtml=h;

  // markdown
  const md=buildMd(title,all);
  const csv=buildCsv(all);
  const exportHtml=`<section><h2>${t("CSV.TITLE")}</h2><div class="mdbar"><button class="btn-primary" id="copycsv">${t("CSV.COPY")}</button></div><p class="muted">${t("CSV.HINT")}</p><textarea id="csv" readonly spellcheck="false" style="min-height:140px" aria-label="CSV">${esc(csv)}</textarea></section>
  <section><h2>${t("MARKDOWN.TITLE")}</h2><div class="mdbar"><button class="btn-primary" id="copy">${t("MARKDOWN.COPY")}</button><button class="btn-primary" id="copyd">${t("MARKDOWN.COPY_TEXT")}</button><button id="sel">${t("MARKDOWN.SELECT_ALL")}</button><button id="reset" disabled>${t("MARKDOWN.RESET")}</button><span class="muted" id="cmsg"></span></div>
    <div class="mdgrid"><textarea id="md" spellcheck="false" aria-label="${esc(t("MARKDOWN.EDITABLE_LABEL"))}">${esc(md)}</textarea><div class="mdprev" id="prev">${mdToHtml(md)}</div></div><h3>${t("MARKDOWN.TEXT_TITLE")}</h3><p class="muted">${t("MARKDOWN.TEXT_HINT")}</p><pre class="dtxt" id="dtxt"></pre></section>`;
  const pane=(id,html)=>`<div class="pane" id="pane-${id}"${state.tab===id?"":" hidden"}>${html}</div>`;
  const tab=id=>`<button class="tab" role="tab" data-tab="${id}" aria-selected="${state.tab===id}">${t("TABS."+id.toUpperCase())}</button>`;
  $("out").innerHTML=`<div class="tabs" role="tablist">${tab("report")}${tab("export")}</div>`+pane("report",reportHtml)+pane("export",exportHtml);
  $("out").querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
    state.tab=b.dataset.tab;
    $("out").querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",String(x===b)));
    for(const id of ["report","export"]) $("pane-"+id).hidden=state.tab!==id;
  }));

  const ta=$("md"), prev=$("prev"), rs=$("reset");
  const showD=()=>{$("dtxt").textContent=plainTextFrom(ta.value);};
  const sync=()=>{showD();prev.innerHTML=mdToHtml(ta.value);const ed=ta.value!==md;rs.disabled=!ed;$("cmsg").textContent=ed?t("MARKDOWN.EDITED"):"";};
  ta.addEventListener("input",()=>{
    const pos=ta.selectionStart, before=ta.value.slice(0,pos).split("\n"), line=before.length-1, col=before[line].length;
    const nv=recalcMd(ta.value);
    if(nv!==ta.value){
      ta.value=nv;
      const lines=nv.split("\n"); let p=0;
      for(let i=0;i<line&&i<lines.length;i++)p+=lines[i].length+1;
      p+=Math.min(col,(lines[line]||"").length);
      ta.setSelectionRange(p,p);
    }
    sync();
  });
  const wire=(id,label,getTxt,selectEl)=>{$(id).onclick=async()=>{
    const b=$(id);
    if(await copyText(getTxt())){b.textContent=t("MARKDOWN.COPIED");b.classList.add("btn-ok");try{api().showSnack({msg:t("MARKDOWN.COPIED_SNACK"),type:"SUCCESS"});}catch(e){}}
    else{selectEl();$("cmsg").textContent=t("MARKDOWN.COPY_FAILED");}
    setTimeout(()=>{b.textContent=label;b.classList.remove("btn-ok");},2000);
  };};
  wire("copy",t("MARKDOWN.COPY"),()=>ta.value,()=>{ta.focus();ta.select();});
  wire("copyd",t("MARKDOWN.COPY_TEXT"),()=>plainTextFrom(ta.value),()=>{const r=document.createRange();r.selectNodeContents($("dtxt"));const s=getSelection();s.removeAllRanges();s.addRange(r);});
  wire("copycsv",t("CSV.COPY"),()=>csv,()=>{const c=$("csv");c.focus();c.select();});
  showD();
  rs.onclick=()=>{ta.value=md;sync();};
  $("sel").onclick=()=>{ta.focus();ta.select();};
}
