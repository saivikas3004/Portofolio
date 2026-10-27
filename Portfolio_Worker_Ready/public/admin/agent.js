(()=>{'use strict';
const $=id=>document.getElementById(id);
const run=$('agent-run'),apply=$('agent-apply'),output=$('agent-output'),status=$('agent-status');
if(!run||!apply||!output)return;
let generated=null;
function readProfile(){
 const key='sv_career_studio_v1';let saved={};
 try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
 for(const field of ['name','headline','email','location','summary','skills','education','target','jobdesc','tailored','company','letterrole','letterbody']){
  const input=$(field);if(input)saved[field]=input.value;
 }
 // Uncommitted editable experience/project rows are intentionally included.
 for(const kind of ['experience','projects']){
  const list=$(kind==='experience'?'exp-list':'project-list');
  if(list){
   const items=[];
   for(const block of list.querySelectorAll('.item')){
    const item={};
    for(const input of block.querySelectorAll('[data-key]'))item[input.dataset.key]=input.value;
    if(Object.keys(item).length)items.push(item);
   }
   saved[kind]=items;
  }
 }
 return saved;
}
function taskTarget(kind){return {summary:'summary',resume:'tailored',letter:'letterbody',skills:'skills'}[kind]}
run.addEventListener('click',async()=>{
 const kind=$('agent-kind').value,profile=readProfile();
 if($('agent-job').value.trim())profile.jobdesc=$('agent-job').value.trim();
 if($('agent-role').value.trim())profile.target=$('agent-role').value.trim();
 output.value='';generated=null;apply.disabled=true;run.disabled=true;
 status.textContent='Generating a draft with Gemini…';
 try{
  const response=await fetch('/admin/api/agent',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,profile})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'AI request failed');
  output.value=data.draft;generated={kind};apply.disabled=false;
  status.textContent='Draft ready. Review the content before applying it.'+(data.notes?' Notes: '+data.notes:'');
 }catch(err){status.textContent=err.message||'The AI service is unavailable.'}
 finally{run.disabled=false}
});
apply.addEventListener('click',()=>{
 if(!generated||!output.value.trim())return;
 const target=taskTarget(generated.kind),field=$(target);
 if(!field){status.textContent='Editor field unavailable. Refresh and try again.';return}
 if(!confirm('Apply this reviewed AI draft to the '+target+' field? Your current text in that field will be replaced and saved in this browser.'))return;
 field.value=output.value;field.dispatchEvent(new Event('input',{bubbles:true}));
 if(target==='letterbody')$('save-letter')?.click();
 else if(target==='tailored')$('save-resume')?.click();
 else $('save-profile')?.click();
 status.textContent='Applied to '+target+' and saved locally. Review your résumé/letter preview before downloading. This does NOT publish the public website.';
});
})();