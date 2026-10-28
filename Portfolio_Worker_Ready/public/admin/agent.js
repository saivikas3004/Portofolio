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
const DEFAULT_PRESET='Use Australian English and a professional, clear, confident tone. Make the résumé ATS-friendly with standard headings and concise accomplishment-oriented bullets that are strictly supported by my saved career history. Tailor keywords to the job description only where the evidence supports them. Preserve correct employers, titles and dates. Include relevant projects and education. Write a specific, natural cover letter without clichés, exaggerated claims or fabricated metrics. Keep the uploaded résumé section order: SKILLS (Data Management, Technical Proficiency, Stakeholder and Communication Skills), EDUCATION & QUALIFICATIONS, WORK EXPERIENCE, PROJECTS, VOLUNTEER & COMMUNITY INVOLVEMENT, REFERENCES. Include only substantiated entries, using standard section headings and bullet points. The uploaded cover letter layout uses centered name/contact, date, hiring manager/address, Dear Hiring Manager greeting, evidence-led paragraphs and Yours sincerely sign-off. Avoid tables, emojis, graphics and generic filler.';
const PRESET_KEY='sv_application_preset_v1';
const GUIDE_KEY='sv_resume_writing_guide_v1';
const OFFICIAL_GUIDE_SUMMARY=`Performance Education résumé-writing guide (applies to every résumé):
Professional Profile: 2-3 targeted, factual sentences covering role sought, credible technical strengths and evidenced soft skills.
Key Skills Summary: list only confidently demonstrable relevant skills, arranged by technical category.
Educational Background: reverse chronological order (Professional Year, Australian Master's, international Bachelor's); show institution and verified dates; include only evidenced academic distinctions.
Certifications: separate confirmed qualifications and providers, distinguishing expired accreditations.
University Project: choose 1-2 most relevant Australian university projects, when supported. Provide Objective beginning "To", Tools, Duties and Result. Never label independent projects as university work.
Relevant Employment Experience: newest first; specific action-led bullets, present tense for current work, past for completed work; aim for 5-7 only where supported; never invent statistics.
Other Employment Experience: separate unrelated employment with transferable duties, newest first.
Personal Attributes: 3-4 supported strengths with concrete evidence.
References: Available upon request.
Aim for two pages, allow three for substantial relevant experience. Keep Australian English, punctuation, heading capitalisation, dates and formatting consistent. No plagiarism, exaggeration, unverified tools or GPA. Justify Word body paragraphs and bullet text.`;
const guide=$('package-guide'),preset=$('package-rules'),jd=$('package-jd'),role=$('package-role'),company=$('package-company'),generate=$('package-generate'),results=$('package-results'),resume=$('package-resume'),letter=$('package-letter'),packageStatus=$('package-status');
if(preset&&generate){
 try{preset.value=localStorage.getItem(PRESET_KEY)||DEFAULT_PRESET;guide.value=localStorage.getItem(GUIDE_KEY)||OFFICIAL_GUIDE_SUMMARY}catch{preset.value=DEFAULT_PRESET;guide.value=OFFICIAL_GUIDE_SUMMARY}
 const stored=readProfile();
 role.value=stored.target||'';
 company.value=stored.company||'';
 jd.value=stored.jobdesc||'';
 const savePreset=()=>{try{localStorage.setItem(PRESET_KEY,preset.value.slice(0,3500));localStorage.setItem(GUIDE_KEY,guide.value.slice(0,9000));packageStatus.textContent='Writing instructions and résumé guide saved for future applications.'}catch{packageStatus.textContent='Could not save the preset. Check browser storage permissions.'}};
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
 async function generatePart(kind,profile,presetText){
  return api({kind,profile,preset:presetText,resumeGuide:kind==='package_resume'?guide.value.slice(0,9000):''});
 }
 generate.addEventListener('click',async()=>{
  if(!jd.value.trim()){packageStatus.textContent='Paste a job description before generating.';jd.focus();return}
  const profile=readProfile();
  profile.jobdesc=jd.value.trim();
  profile.target=role.value.trim()||'Advertised role';
  profile.company=company.value.trim();
  profile.letterrole=profile.target;
  if(!profile.experience?.length){packageStatus.textContent='Add experience to your master profile before generating.';return}
  generate.disabled=true;
  results.hidden=false;
  const rules=preset.value.slice(0,3500);
  let notes=[];
  // Keep any successful document intact if the other call fails.
  resume.value='';letter.value='';
  $('package-notes').textContent='Review both drafts and verify all dates and claims before sending.';
  try{localStorage.setItem(PRESET_KEY,rules);localStorage.setItem(GUIDE_KEY,guide.value.slice(0,9000))}catch{}
  try{
   packageStatus.textContent='Step 1 of 2: generating your tailored résumé…';
   try{
    const data=await generatePart('package_resume',profile,rules);
    resume.value=data.draft;
    if(data.notes)notes.push('Résumé: '+data.notes);
    packageStatus.textContent='Résumé ready. Step 2 of 2: generating your cover letter…';
   }catch(error){
    packageStatus.textContent='Résumé could not be generated: '+error.message+' Continuing with the cover letter…';
    notes.push('Résumé failed: '+error.message);
   }
   try{
    const data=await generatePart('package_letter',profile,rules);
    letter.value=data.draft;
    if(data.notes)notes.push('Cover letter: '+data.notes);
   }catch(error){notes.push('Cover letter failed: '+error.message)}
   $('package-notes').textContent=notes.length?'Generation notes: '+notes.join(' | '):'Both drafts are ready. Check every claim before using them.';
   if(resume.value&&letter.value)packageStatus.textContent='Both documents generated. Review, edit and download below.';
   else if(resume.value||letter.value)packageStatus.textContent='One document is ready. Your finished draft is preserved; use the retry button to generate the missing document.';
   else packageStatus.textContent='Gemini could not generate either document. See details below and try again.';
  }finally{generate.disabled=false}
 });
 $('package-retry').addEventListener('click',async()=>{
  const missingResume=!resume.value.trim(),missingLetter=!letter.value.trim();
  if(!missingResume&&!missingLetter){packageStatus.textContent='Both documents already exist. Download or edit them below.';return}
  if(!jd.value.trim()){packageStatus.textContent='Paste a job description first.';return}
  const profile=readProfile();profile.jobdesc=jd.value.trim();profile.target=role.value.trim()||'Advertised role';profile.company=company.value.trim();profile.letterrole=profile.target;
  const target=missingResume?'package_resume':'package_letter';
  const retry=$('package-retry');retry.disabled=true;packageStatus.textContent='Retrying '+(missingResume?'résumé':'cover letter')+'…';
  try{
   const data=await generatePart(target,profile,preset.value.slice(0,3500));
   if(missingResume)resume.value=data.draft;else letter.value=data.draft;
   packageStatus.textContent='Document generated. Review and download it below.';
   $('package-notes').textContent=data.notes?'Review notes: '+data.notes:'Review all details before use.';
  }catch(error){packageStatus.textContent='Retry failed: '+error.message}
  finally{retry.disabled=false}
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
 $('package-resume-download').addEventListener('click',()=>{try{window.CareerStudioTemplates.download('resume',resume.value,{name:($('name')?.value||'Sai Vikas Malladi')})}catch(err){packageStatus.textContent=err.message}});
 $('package-letter-download').addEventListener('click',()=>{try{window.CareerStudioTemplates.download('letter',letter.value,{name:($('name')?.value||'Sai Vikas Malladi')})}catch(err){packageStatus.textContent=err.message}});
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