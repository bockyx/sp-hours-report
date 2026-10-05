import { esc, hmMd } from "./utils.js";

export function buildMd(title,all){
  const grand=all.reduce((a,x)=>a+x.s.total,0);
  let md=`# Hours Report, ${title}\n\n**Total: ${hmMd(grand)} h**\n\n`;
  md+=`| Project | Hours |\n|---|---:|\n`+all.map(x=>`| ${x.name} | ${hmMd(x.s.total)} |`).join("\n")+`\n| **Total** | **${hmMd(grand)}** |\n`;
  for(const x of all){
    md+=`\n## ${x.name} — ${hmMd(x.s.total)} h\n\n| Task | Hours |\n|---|---:|\n`;
    for(const [n,t] of x.s.list) md+=`| ${n.replace(/\|/g,"\\|")} | ${hmMd(t.min)} |\n`;
    md+=`| **${x.name} total** | **${hmMd(x.s.total)}** |\n`;
  }
  return md;
}
export function recalcMd(text){
  const L=text.split("\n"), cells=l=>l.slice(1,-1).split(/(?<!\\)\|/).map(s=>s.trim());
  const toMin=s=>{s=s.replace(/\*/g,"").trim();let m=s.match(/^(\d+):(\d{2})$/);if(m)return +m[1]*60+ +m[2];m=s.match(/^\d+(\.\d+)?$/);return m?Math.round(parseFloat(s)*60):0;};
  const secs=[];let cur=null,firstSec=L.length;
  L.forEach((l,i)=>{
    const h=l.match(/^## (.+?) — [\d:.]+ h$/);
    if(h){cur={name:h[1],head:i,min:0,tot:-1};secs.push(cur);firstSec=Math.min(firstSec,i);return;}
    if(cur&&l.startsWith("|")){
      const c=cells(l);
      if(/^:?-+:?$/.test(c[0])||c[0]==="Task")return;
      if(c[0].startsWith("**")&&/total\*\*$/.test(c[0]))cur.tot=i;
      else cur.min+=toMin(c[c.length-1]);
    }
  });
  if(!secs.length)return text;
  const grand=secs.reduce((a,s)=>a+s.min,0), byName=Object.fromEntries(secs.map(s=>[s.name,s]));
  for(const s of secs){
    L[s.head]=`## ${s.name} — ${hmMd(s.min)} h`;
    if(s.tot>=0)L[s.tot]=`| **${s.name} total** | **${hmMd(s.min)}** |`;
  }
  for(let i=0;i<firstSec;i++){
    const l=L[i];
    if(/^\*\*Total: .+ h\*\*$/.test(l))L[i]=`**Total: ${hmMd(grand)} h**`;
    else if(l.startsWith("|")){
      const c=cells(l);
      if(byName[c[0]])L[i]=`| ${c[0]} | ${hmMd(byName[c[0]].min)} |`;
      else if(c[0]==="**Total**")L[i]=`| **Total** | **${hmMd(grand)}** |`;
    }
  }
  return L.join("\n");
}
export function discordFrom(text){
  const out=[],cells=l=>l.slice(1,-1).split(/(?<!\\)\|/).map(s=>s.trim().replace(/\\\|/g,"|"));
  let inSec=false;
  for(const l of text.split("\n")){
    if(l.startsWith("## ")){inSec=true;if(out.length&&out[out.length-1]!=="")out.push("");out.push(l);continue;}
    if(l.startsWith("|")){
      if(!inSec)continue;
      const c=cells(l), h=c[c.length-1];
      if(/^:?-+:?$/.test(c[0])||c[0]==="Task"||c[0].startsWith("**"))continue;
      const name=/^_.+_$/.test(c[0])?"*"+c[0].slice(1,-1)+"*":c[0];
      out.push(h==="—"?`- ${name}`:`- ${name} — **${h} h**`);
      continue;
    }
    if(!l.trim()){if(out.length&&out[out.length-1]!=="")out.push("");continue;}
    if(l.startsWith("# "))out.push(l);
    else if(/^\*\*Total: .+\*\*$/.test(l))out.push("## "+l.replace(/\*\*/g,""));
    else out.push(l.replace(/^_(.+)_$/,"*$1*"));
  }
  return out.join("\n").replace(/\n{3,}/g,"\n\n").trim();
}
export function mdToHtml(md){
  const cell=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/_(.+?)_/g,"<em>$1</em>").replace(/\\\|/g,"|");
  const table=t=>`<table><thead><tr>${t.head.map((h,i)=>`<th class="${i?"r":""}">${cell(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i?"r num":""}">${cell(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const out=[];let tbl=null;
  for(const line of md.split("\n")){
    if(line.startsWith("|")){
      const cs=line.slice(1,-1).split(/(?<!\\)\|/).map(s=>s.trim());
      if(!tbl){tbl={head:cs,rows:[]};continue;}
      if(cs.every(c=>/^:?-+:?$/.test(c))) continue;
      tbl.rows.push(cs); continue;
    }
    if(tbl){out.push(table(tbl));tbl=null;}
    if(line.startsWith("## ")) out.push(`<h2>${cell(line.slice(3))}</h2>`);
    else if(line.startsWith("# ")) out.push(`<h1>${cell(line.slice(2))}</h1>`);
    else if(line.trim()) out.push(`<p>${cell(line)}</p>`);
  }
  if(tbl) out.push(table(tbl));
  return out.join("");
}
