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
  const response=await fetch('/admin/api/agent',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(sessionStorage.getItem('sv_admin_tab_session_v1')||'')},body:JSON.stringify({kind,profile})});
  const responseType=response.headers.get('content-type')||'';if(!responseType.includes('application/json'))throw new Error('AI endpoint returned an HTML page. Check the Cloudflare Worker deployment and admin API routes.');const data=await response.json();
  if(response.status===401){sessionStorage.removeItem('sv_admin_tab_session_v1');throw new Error('Session expired. Sign in again at /admin/.')} if(!response.ok)throw new Error(data.error||'AI request failed');
  output.value=data.draft;generated={kind};apply.disabled=false;
  status.textContent='Draft ready. Review the content before applying it.'+(data.notes?' Notes: '+data.notes:'');
 }catch(err){status.textContent=err.message||'The AI service is unavailable.'}
 finally{run.disabled=false}
});
$('agent-version')?.addEventListener('click',()=>{
 const value=output.value.trim();
 if(!value){status.textContent='Generate or write a draft first.';return}
 const kind=generated?.kind||$('agent-kind').value;
 const label=kind+' · '+($('agent-role').value||$('target').value||'general');
 const saved=window.CareerStudioVersions?.saveDraft(kind,value,label);
 status.textContent=saved?'Draft version archived in this browser. Open Draft history to review.':'Draft history is unavailable. Refresh and retry.';
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
const DEFAULT_PRESET='Use Australian English and a professional, clear, confident tone. Make the résumé ATS-friendly with standard headings and concise accomplishment-oriented bullets that are strictly supported by my saved career history. Tailor keywords to the job description only where the evidence supports them. Preserve correct employers, titles and dates. Include relevant projects and education. Write a specific, natural cover letter without clichés, exaggerated claims or fabricated metrics. Avoid tables, emojis, graphics and generic filler in the résumé.';
const PRESET_KEY='sv_application_preset_v1';
const preset=$('package-rules'),jd=$('package-jd'),role=$('package-role'),company=$('package-company'),generate=$('package-generate'),results=$('package-results'),resume=$('package-resume'),letter=$('package-letter'),packageStatus=$('package-status');
if(preset&&generate){
 try{preset.value=localStorage.getItem(PRESET_KEY)||DEFAULT_PRESET}catch{preset.value=DEFAULT_PRESET}
 const stored=readProfile();
 role.value=stored.target||'';
 company.value=stored.company||'';
 jd.value=stored.jobdesc||'';
 const savePreset=()=>{try{localStorage.setItem(PRESET_KEY,preset.value.slice(0,3500));packageStatus.textContent='Writing instructions saved in this browser.'}catch{packageStatus.textContent='Could not save the preset. Check browser storage permissions.'}};
 $('package-save-rules').addEventListener('click',savePreset);
 const api=async(body)=>{
  const token=sessionStorage.getItem('sv_admin_tab_session_v1');
  if(!token)throw Error('Session expired. Sign in to Career Studio again.');
  const response=await fetch('/admin/api/agent',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});
  if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error('The drafting endpoint returned a web page. Check the Cloudflare Worker deployment.');
  const data=await response.json();
  if(response.status===401){sessionStorage.removeItem('sv_admin_tab_session_v1');throw Error('Your session has expired. Sign in again.')}
  if(!response.ok)throw Error(data.error||'Could not generate the application documents.');
  return data;
 };
 generate.addEventListener('click',async()=>{
  if(!jd.value.trim()){packageStatus.textContent='Paste a job description before generating.';jd.focus();return}
  const profile=readProfile();
  profile.jobdesc=jd.value.trim();
  profile.target=role.value.trim()||'Advertised role';
  profile.company=company.value.trim();
  profile.letterrole=profile.target;
  if(!profile.experience?.length){packageStatus.textContent='Add experience to your master profile before generating.';return}
  generate.disabled=true;results.hidden=true;packageStatus.textContent='Generating your tailored résumé and cover letter…';
  try{
   const data=await api({kind:'package',profile,preset:preset.value.slice(0,3500)});
   resume.value=data.resume;letter.value=data.coverLetter;results.hidden=false;
   $('package-notes').textContent=data.notes?'Review notes: '+data.notes:'Review both documents carefully before using them.';
   packageStatus.textContent='Both drafts are ready. Edit them below, download individually or save them to Draft History.';
   try{localStorage.setItem(PRESET_KEY,preset.value.slice(0,3500))}catch{}
   results.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){packageStatus.textContent=err.message||'Generation failed.'}
  finally{generate.disabled=false}
 });
 function fileSafeText(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
 function downloadDoc(value,kind){
  if(!value.trim()){packageStatus.textContent='Generate a document first.';return}
  const text=value.split(/\n/).map(line=>'<p>'+fileSafeText(line||' ')+'</p>').join('');
  const html='<html><head><meta charset="utf-8"><style>body{font:11pt/1.4 Calibri,Arial,sans-serif;color:#1c293e;margin:40pt}p{margin:4pt 0}</style></head><body>'+text+'</body></html>';
  const blob=new Blob([html],{type:'application/msword'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
  a.download='Sai_Vikas_'+kind+'.doc';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }
 $('package-resume-download').addEventListener('click',()=>downloadDoc(resume.value,'Tailored_Resume'));
 $('package-letter-download').addEventListener('click',()=>downloadDoc(letter.value,'Cover_Letter'));
 for(const [button,field] of [['package-resume-copy',resume],['package-letter-copy',letter]]){
  $(button).addEventListener('click',async()=>{if(!field.value.trim())return;try{await navigator.clipboard.writeText(field.value);packageStatus.textContent='Document copied to clipboard.'}catch{field.focus();field.select();packageStatus.textContent='Select and copy the highlighted text.'}});
 }
 $('package-apply').addEventListener('click',()=>{
  if(!resume.value.trim()||!letter.value.trim())return;
  const versions=window.CareerStudioVersions;if(!versions){packageStatus.textContent='Draft history is unavailable. Download the documents instead.';return}
  const label=(role.value.trim()||'Application')+(company.value.trim()?' — '+company.value.trim():'');
  const a=versions.saveDraft('resume',resume.value,label+' (complete résumé)');
  const b=versions.saveDraft('letter',letter.value,label+' (cover letter)');
  packageStatus.textContent=a&&b?'Both full documents saved to Draft History in this browser. Export a backup for safekeeping.':'Could not save both documents.';
 });
}

})();