import { onRequestPost as geminiPost } from './gemini.js';
import { generateAdminDraft } from './admin-agent.js';

const enc = new TextEncoder();
const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function safeEqual(a,b){
  const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(a)),crypto.subtle.digest('SHA-256',enc.encode(b))]);
  const left=new Uint8Array(x),right=new Uint8Array(y);
  let diff=0;for(let i=0;i<left.length;i++)diff|=left[i]^right[i];return diff===0;
}
function reject(){return new Response('Admin sign-in required.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Career Studio", charset="UTF-8"','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}})}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/admin'||url.pathname.startsWith('/admin/')){
    if(typeof env.ADMIN_PASSWORD!=='string'||env.ADMIN_PASSWORD.length<12){
      return new Response('Admin login not configured. Add ADMIN_PASSWORD encrypted secret to the Cloudflare Worker settings, then redeploy.',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
    }
    let user='',pass='';const h=request.headers.get('Authorization')||'';
    if(h.startsWith('Basic ')){
      try{const raw=atob(h.slice(6).trim());const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));const x=new TextDecoder().decode(bytes);const i=x.indexOf(':');if(i>=0){user=x.slice(0,i);pass=x.slice(i+1)}}catch{}
    }
    const [a,b]=await Promise.all([safeEqual(user,env.ADMIN_USERNAME||'admin'),safeEqual(pass,env.ADMIN_PASSWORD)]);
    if(!a||!b)return reject();
    if(url.pathname==='/admin/api/agent'){
      if(request.method!=='POST')return json({error:'Use POST.'},405);
      return generateAdminDraft(request,env);
    }
    const resp=await env.ASSETS.fetch(request);const headers=new Headers(resp.headers);
    headers.set('Cache-Control','private, no-store');headers.set('X-Robots-Tag','noindex, nofollow');
    return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers});
  }
  if(url.pathname==='/api/chat'){
    if(request.method!=='POST')return json({error:'Use POST to chat.'},405);
    return geminiPost({request,env});
  }
  return env.ASSETS.fetch(request);
 }
};
