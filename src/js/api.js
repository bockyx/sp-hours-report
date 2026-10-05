import { state } from "./state.js";

export function api(){return typeof PluginAPI!=="undefined"?PluginAPI:null;}
export async function waitApi(){
  for(let i=0;i<100&&!api();i++) await new Promise(r=>setTimeout(r,50));
  if(!api()) throw new Error("NO_API");
  return api();
}
export async function loadCfg(){
  try{const raw=await api().loadSyncedData();if(raw){const c=JSON.parse(raw);state.cfg={...state.cfg,...c};}}catch(e){}
}
let saveT;
export function saveCfg(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>{try{api().persistDataSynced(JSON.stringify(state.cfg));}catch(e){}},400);
}

export async function fetchData(){
  const A=api();
  const [act,arch,projs]=await Promise.all([A.getTasks(),A.getArchivedTasks().catch(()=>[]),A.getAllProjects()]);
  const byId=new Map();
  for(const t of [...(arch||[]),...(act||[])]) byId.set(t.id,t);
  state.tasks=[...byId.values()];
  state.projectsById=Object.fromEntries((projs||[]).map(p=>[p.id,p]));
}
