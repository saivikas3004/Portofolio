import { onRequestPost as geminiPost } from './gemini.js';
import { generateAdminDraft } from './admin-agent.js';
const enc=new TextEncoder();
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{...headers,'Content-Type':'application/json'}});
const base64=b=>{let s='';for(const v of b)s+=String.fromCharCode(v);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unbase64=x=>Uint8Array.from(atob(x.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-x.length%4)%4)),c=>c.charCodeAt(0));
async function equal(x,y){const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(x)),crypto.subtle.digest('SHA-256',enc.encode(y))]);let diff=0;const aa=new Uint8Array(a),bb=new Uint8Array(b);for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0}
async function key(env){return crypto.subtle.importKey('raw',enc.encode(env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function issue(env){const payload=base64(enc.encode(JSON.stringify({exp:Math.floor(Date.now()/1000)+28800,id:crypto.randomUUID()})));const sig=new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),enc.encode(payload)));return payload+'.'+base64(sig)}
async function authorized(request,env){const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Bearer '))return false;const p=auth.slice(7).split('.');if(p.length!==2||p.some(x=>!x||x.length>600))return false;try{const claim=JSON.parse(new TextDecoder().decode(unbase64(p[0])));const now=Math.floor(Date.now()/1000);if(!Number.isSafeInteger(claim.exp)||claim.exp<=now||claim.exp>now+28800||typeof claim.id!=='string')return false;return crypto.subtle.verify('HMAC',await key(env),unbase64(p[1]),enc.encode(p[0]))}catch{return false}}
const loginPage="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Career Studio Sign In</title><style>:root{font-family:system-ui,sans-serif;background:#0d1423;color:#edf3f2}*{box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;margin:0;padding:20px}main{width:min(100%,430px);background:#172336;border:1px solid #34465a;border-radius:20px;padding:30px}h1{margin:0}p{color:#adbdcf;line-height:1.6}label{display:block;margin:16px 0 7px}input{display:block;width:100%;padding:13px;background:#0d1828;color:white;border:1px solid #617088;border-radius:9px;font:inherit}button{margin-top:20px;width:100%;padding:13px;background:#b8f379;color:#10211b;border:0;border-radius:9px;font-size:15px;font-weight:bold;cursor:pointer}a{color:#b8f379}</style></head><body><main><h1>Career Studio</h1><p>Sign in to your private workspace. Closing this tab signs you out.</p><form id=\"login\"><label for=\"username\">Username</label><input id=\"username\" value=\"admin\" autocomplete=\"username\" required><label for=\"password\">Password</label><input id=\"password\" type=\"password\" autocomplete=\"current-password\" required><button type=\"submit\">Sign in</button></form><p id=\"message\" aria-live=\"polite\"></p><a href=\"/\">← Back to portfolio</a></main><script>\n(()=>{'use strict';const KEY='sv_admin_tab_session_v1',form=document.getElementById('login'),msg=document.getElementById('message'),btn=form.querySelector('button');\nasync function load(token){const r=await fetch('/admin/app',{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store'});if(!r.ok){sessionStorage.removeItem(KEY);throw Error('Session expired. Please sign in.')}const page=await r.text();document.open();document.write(page);document.close()}\nform.addEventListener('submit',async e=>{e.preventDefault();btn.disabled=true;msg.textContent='Signing in…';try{const r=await fetch('/admin/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value}),credentials:'omit',cache:'no-store'});if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('The sign-in route returned a web page instead of JSON (HTTP '+r.status+', final URL: '+r.url+'). Check Cloudflare routing, Access or security challenges.');const data=await r.json();if(!r.ok)throw Error(data.error||'Sign-in failed');if(typeof data.token!=='string'||!data.token)throw Error('Login returned no session token.');sessionStorage.setItem(KEY,data.token);document.getElementById('password').value='';await load(data.token)}catch(error){msg.textContent=error.message}finally{btn.disabled=false}});\nconst saved=sessionStorage.getItem(KEY);if(saved){form.hidden=true;msg.textContent='Restoring session…';load(saved).catch(error=>{form.hidden=false;msg.textContent=error.message})}\n})();\n</script></body></html>";
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/admin'||path.startsWith('/admin/')){
   if(typeof env.ADMIN_PASSWORD!=='string'||env.ADMIN_PASSWORD.length<12)return new Response('Admin password is not configured.',{status:503,headers});
   if((path==='/admin'||path==='/admin/')&&request.method==='GET')return new Response(loginPage,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
   // POST to the same origin/path as the sign-in page avoids nested API path routing inconsistencies.
   if(((path==='/admin'||path==='/admin/')&&request.method==='POST')||path==='/admin/api/login'){
    if(request.method!=='POST')return json({error:'POST required'},405);
    let body;try{body=await request.json()}catch{return json({error:'Invalid input'},400)}
    const name=typeof body?.username==='string'?body.username:'',password=typeof body?.password==='string'?body.password:'';
    const [a,b]=await Promise.all([equal(name,env.ADMIN_USERNAME||'admin'),equal(password,env.ADMIN_PASSWORD)]);
    if(!a||!b)return json({error:'Incorrect username or password.'},401);
    return json({token:await issue(env),expiresIn:28800});
   }
   if(path==='/admin/api/agent'){
    if(!await authorized(request,env))return json({error:'Session expired. Sign in again.'},401);
    if(request.method!=='POST')return json({error:'POST required'},405);
    return generateAdminDraft(request,env);
   }
   if(path==='/admin/app'){
    if(!await authorized(request,env))return json({error:'Sign in required.'},401);
    const asset=new URL(request.url);asset.pathname='/admin/index.html';
    const resp=await env.ASSETS.fetch(new Request(asset,{method:'GET'})),h=new Headers(resp.headers);
    for(const [k,v] of Object.entries(headers))h.set(k,v);
    h.set('Content-Type','text/html; charset=utf-8');
    return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});
   }
   if(/^\/admin\/(?:editor|jobs|agent)\.js$/.test(path)&&request.method==='GET'){
    const resp=await env.ASSETS.fetch(request),h=new Headers(resp.headers);
    for(const [k,v] of Object.entries(headers))h.set(k,v);
    return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});
   }
   return json({error:'Sign in required.'},401);
  }
  if(path==='/api/chat'){if(request.method!=='POST')return json({error:'Use POST to chat.'},405);return geminiPost({request,env})}
  return env.ASSETS.fetch(request);
 }
};
