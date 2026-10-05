export async function copyText(txt){
  try{await navigator.clipboard.writeText(txt);return true;}catch(e){}
  try{
    const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();if(ok)return true;
  }catch(e){}
  try{await window.parent.navigator.clipboard.writeText(txt);return true;}catch(e){}
  return false;
}
