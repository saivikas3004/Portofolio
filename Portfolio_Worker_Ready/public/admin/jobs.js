(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='sv_career_studio_jobs_v1',HISTORY='sv_career_studio_history_v1';
if(!$('job-save'))return;
const safeRead=(key)=>{try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a:[]}catch{return []}};
const save=(key,items)=>localStorage.setItem(key,JSON.stringify(items));
const setStatus=t=>{$('job-status').textContent=t};
const esc=s=>String(s||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function renderJobs(){
 const items=safeRead(KEY);const host=$('job-list');host.replaceChildren();
 $('job-count').textContent=items.length+' tracked';
 if(!items.length){host.textContent='No opportunities saved yet. Add your first vacancy above.';return}
 for(const item of items){
  const card=document.createElement('article');card.className='item';
  const h=document.createElement('h3');h.textContent=item.role+' · '+item.company;card.append(h);
  const details=document.createElement('p');details.className='muted';details.textContent=[item.stage,item.deadline?'Deadline: '+item.deadline:'',item.url].filter(Boolean).join(' · ');card.append(details);
  if(item.notes){const p=document.createElement('p');p.textContent=item.notes;card.append(p)}
  const row=document.createElement('div');row.className='row';
  const use=document.createElement('button');use.className='action secondary';use.textContent='Tailor with AI';use.type='button';use.onclick=()=>{
   $('agent-role').value=item.role;$('agent-job').value=[item.notes,item.url?'Job link: '+item.url:''].filter(Boolean).join('\n');
   document.querySelector('[data-tab="agent"]')?.click();$('agent-run')?.focus();
   $('agent-status').textContent='Opportunity loaded. Add the full job description before generating for better results.';
  };row.append(use);
  if(item.url&&/^https?:\/\//i.test(item.url)){const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open listing ↗';a.className='action secondary';row.append(a)}
  const del=document.createElement('button');del.className='action danger';del.textContent='Delete';del.type='button';del.onclick=()=>{if(confirm('Delete this opportunity?')){save(KEY,safeRead(KEY).filter(x=>x.id!==item.id));renderJobs()}};row.append(del);card.append(row);host.append(card)
 }
}
$('job-save').addEventListener('click',()=>{
 const role=$('job-role').value.trim(),company=$('job-company').value.trim();
 if(!role||!company){setStatus('Enter a role and employer.');return}
 const url=$('job-url').value.trim();
 if(url&&!/^https?:\/\//i.test(url)){setStatus('Job link must start with https:// or http://.');return}
 const items=safeRead(KEY);
 items.unshift({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),role:role.slice(0,140),company:company.slice(0,140),stage:$('job-stage').value,deadline:$('job-deadline').value,url:url.slice(0,1000),notes:$('job-notes').value.slice(0,3500),added:new Date().toISOString()});
 save(KEY,items.slice(0,150));['job-role','job-company','job-url','job-deadline','job-notes'].forEach(id=>$(id).value='');
 renderJobs();setStatus('Opportunity saved to this browser.')
});
function renderHistory(){
 const host=$('draft-history');host.replaceChildren();const items=safeRead(HISTORY);$('draft-count').textContent=items.length+' saved versions';
 if(!items.length){host.textContent='No AI drafts archived yet. Use “Save a version” in the AI Agent tab.';return}
 for(const item of items){
  const card=document.createElement('article');card.className='item';
  const h=document.createElement('h3');h.textContent=(item.label||item.kind||'Draft')+' · '+new Date(item.created).toLocaleString();card.append(h);
  const pre=document.createElement('textarea');pre.value=item.text;pre.readOnly=true;pre.rows=5;pre.setAttribute('aria-label','Saved draft text');card.append(pre);
  const row=document.createElement('div');row.className='row';
  const copy=document.createElement('button');copy.className='action secondary';copy.textContent='Copy';copy.onclick=()=>navigator.clipboard?.writeText(item.text).then(()=>setStatus('Version copied.')).catch(()=>setStatus('Use the text box to copy.'));row.append(copy);
  const del=document.createElement('button');del.className='action danger';del.textContent='Delete';del.onclick=()=>{if(confirm('Delete this saved version?')){save(HISTORY,safeRead(HISTORY).filter(x=>x.id!==item.id));renderHistory()}};row.append(del);card.append(row);host.append(card)
 }
}
window.CareerStudioVersions={
 saveDraft(kind,content,label){if(!content.trim())return false;const items=safeRead(HISTORY);items.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2,7),kind,text:content.slice(0,11000),label:String(label||kind).slice(0,100),created:new Date().toISOString()});save(HISTORY,items.slice(0,35));renderHistory();return true},
 render:renderHistory
};
$('jobs-export').onclick=()=>{const data=JSON.stringify({opportunities:safeRead(KEY),draftVersions:safeRead(HISTORY)},null,2);const a=document.createElement('a');const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.href=url;a.download='career_studio_jobs_and_versions.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
renderJobs();renderHistory();
})();