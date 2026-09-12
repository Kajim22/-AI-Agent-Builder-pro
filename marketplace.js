/* AKEXA AI Bazar — Supabase-backed marketplace layer. */
(function(){
  'use strict';
  const BRAND='AKEXA AI Bazar';
  const TAGLINE='Build AI Agents. Automate Businesses.';
  const SUPABASE_URL='https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY='sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  const SUPABASE_SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js';
  let sb=null, ready=null, currentWin=null, currentDoc=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function getLocalAgents(){try{const raw=localStorage.getItem('agents');const a=raw?JSON.parse(raw):[];return Array.isArray(a)?a:[];}catch{return [];}}

  function loadSupabase(doc){
    if(sb)return Promise.resolve(sb);
    if(ready)return ready;
    ready=new Promise((resolve,reject)=>{
      if(window.supabase?.createClient){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb);return;}
      const s=doc.createElement('script');s.src=SUPABASE_SDK;s.onload=()=>{try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb);}catch(e){reject(e);}};s.onerror=()=>reject(new Error('Supabase SDK could not load'));doc.head.appendChild(s);
    });
    return ready;
  }

  function injectStyles(doc){
    if(doc.getElementById('akexa-bazar-style'))return;
    const s=doc.createElement('style');s.id='akexa-bazar-style';
    s.textContent=`
      .akexa-bazar-overlay{position:fixed;inset:0;background:rgba(3,3,9,.82);backdrop-filter:blur(8px);z-index:1000;display:none;overflow:auto;padding:28px}
      .akexa-bazar-overlay.open{display:block}.akexa-bazar{max-width:1100px;margin:0 auto;background:#0f0f1a;border:1px solid #2a2a40;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.55);overflow:hidden}
      .akexa-bazar-head{padding:24px;border-bottom:1px solid #2a2a40;display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.akexa-bazar-head h2{margin:0;font-size:22px}.akexa-bazar-head p{margin:6px 0 0;color:#9090b0;font-size:12px}
      .akexa-bazar-close{background:transparent;border:1px solid #353550;color:#9090b0;border-radius:8px;padding:7px 11px;cursor:pointer}.akexa-bazar-body{padding:24px}.akexa-bazar-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
      .akexa-bazar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.akexa-agent-card{background:#161626;border:1px solid #2a2a40;border-radius:12px;padding:17px;display:flex;flex-direction:column;gap:11px}.akexa-agent-card h3{font-size:14px;margin:0}.akexa-agent-card p{font-size:12px;color:#9090b0;line-height:1.55;margin:0;min-height:38px}.akexa-agent-meta{display:flex;justify-content:space-between;align-items:center;color:#9090b0;font-size:11px}.akexa-price{color:#a89cff;font-weight:700}.akexa-empty{padding:40px 15px;text-align:center;color:#9090b0;border:1px dashed #353550;border-radius:12px}.akexa-bazar-note{font-size:11px;color:#50506a;margin-top:15px;line-height:1.6}
      .akexa-auth{background:#121222;border:1px solid #2a2a40;border-radius:12px;padding:16px;margin-bottom:18px}.akexa-auth-row{display:flex;gap:8px;flex-wrap:wrap}.akexa-auth input{flex:1;min-width:190px}.akexa-auth-msg{font-size:11px;color:#9090b0;margin-top:9px}.akexa-user{color:#10b981;font-size:12px;margin-right:auto;display:flex;align-items:center;gap:8px}
      @media(max-width:650px){.akexa-bazar-overlay{padding:10px}.akexa-bazar-head,.akexa-bazar-body{padding:16px}}
    `;doc.head.appendChild(s);
  }

  async function authState(){return sb.auth.getUser();}

  async function authMarkup(){
    const {data}=await authState();const user=data?.user;
    if(user)return `<div class="akexa-auth"><div class="akexa-auth-row"><span class="akexa-user">● Signed in: ${esc(user.email||'User')}</span><button class="btn btn-ghost btn-sm" id="akexa-signout">Sign out</button></div><div class="akexa-auth-msg">You can now publish your agents to AKEXA AI Bazar.</div></div>`;
    return `<div class="akexa-auth"><div class="akexa-auth-row"><input id="akexa-email" type="email" placeholder="Email"><input id="akexa-password" type="password" placeholder="Password"><button class="btn btn-primary btn-sm" id="akexa-signin">Sign in</button><button class="btn btn-success btn-sm" id="akexa-signup">Create account</button></div><div class="akexa-auth-msg" id="akexa-auth-msg">Sign in or create an account to publish agents. Marketplace browsing is public.</div></div>`;
  }

  async function fetchListings(){
    const {data,error}=await sb.from('marketplace_agents').select('id,agent_id,name,description,category,monthly_price,status,owner_user_id').eq('status','published').order('created_at',{ascending:false});
    if(error)throw error;return data||[];
  }

  async function render(win,doc){
    currentWin=win;currentDoc=doc;await loadSupabase(doc);
    const old=doc.getElementById('akexa-bazar-overlay');if(old)old.remove();
    let listings=[];let loadError='';
    try{listings=await fetchListings();}catch(e){loadError=e.message||'Could not load marketplace';}
    const created=getLocalAgents();
    const publishedIds=new Set(listings.map(x=>String(x.agent_id)));
    const cards=listings.map(x=>`<div class="akexa-agent-card"><h3>🤖 ${esc(x.name)}</h3><p>${esc(x.description||'AI agent for business automation.')}</p><div class="akexa-agent-meta"><span>${esc(x.category||'General')}</span><span class="akexa-price">${Number(x.monthly_price)>0?'৳'+esc(Number(x.monthly_price).toFixed(2))+' / month':'Free'}</span></div><button class="btn btn-primary btn-sm" onclick="window.akexaBazarBuy('${esc(x.id)}')">Get Agent</button></div>`).join('');
    const drafts=created.filter(a=>!publishedIds.has(String(a.id))).map(a=>`<div class="akexa-agent-card"><h3>⚙️ ${esc(a.name||'Unnamed Agent')}</h3><p>Publish this agent to make it available in AKEXA AI Bazar.</p><div class="akexa-agent-meta"><span>Draft</span><span class="akexa-price">Set price</span></div><button class="btn btn-success btn-sm" onclick="window.akexaBazarPublish('${esc(a.id)}')">Publish to Bazar</button></div>`).join('');
    const body=cards+drafts;
    const overlay=doc.createElement('div');overlay.id='akexa-bazar-overlay';overlay.className='akexa-bazar-overlay';
    overlay.innerHTML=`<div class="akexa-bazar"><div class="akexa-bazar-head"><div><h2>${BRAND}</h2><p>${TAGLINE}</p></div><button class="akexa-bazar-close" id="akexa-bazar-close">Close</button></div><div class="akexa-bazar-body">${await authMarkup()}<div class="akexa-bazar-toolbar"><button class="btn btn-primary btn-sm" id="akexa-refresh">Refresh</button><button class="btn btn-ghost btn-sm" id="akexa-myagents">My Agents</button></div>${loadError?`<div class="akexa-empty">Could not load listings: ${esc(loadError)}</div>`:(body?`<div class="akexa-bazar-grid">${body}</div>`:`<div class="akexa-empty">No published agents yet.<br>Create an agent and publish it here.</div>`)}<div class="akexa-bazar-note">Marketplace listing and ownership are now connected to Supabase. Payments, subscriptions and commissions will be added through a secure server-side checkout flow next.</div></div></div>`;
    doc.body.appendChild(overlay);overlay.classList.add('open');
    doc.getElementById('akexa-bazar-close').onclick=()=>overlay.remove();doc.getElementById('akexa-refresh').onclick=()=>render(win,doc);doc.getElementById('akexa-myagents').onclick=()=>{overlay.remove();if(typeof win.showSection==='function')win.showSection('agents');};
    const signIn=doc.getElementById('akexa-signin');const signUp=doc.getElementById('akexa-signup');const signOut=doc.getElementById('akexa-signout');
    if(signIn)signIn.onclick=()=>doAuth('signin',doc);if(signUp)signUp.onclick=()=>doAuth('signup',doc);if(signOut)signOut.onclick=async()=>{await sb.auth.signOut();render(win,doc);};
  }

  async function doAuth(mode,doc){
    const email=doc.getElementById('akexa-email')?.value.trim();const password=doc.getElementById('akexa-password')?.value;const msg=doc.getElementById('akexa-auth-msg');
    if(!email||!password){if(msg)msg.textContent='Email and password are required.';return;}
    const result=mode==='signup'?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
    if(result.error){if(msg)msg.textContent=result.error.message;return;}
    if(msg)msg.textContent=mode==='signup'?'Account created. Check your email if confirmation is required.':'Signed in successfully.';
    render(currentWin,currentDoc);
  }

  async function publish(id,win,doc){
    const {data:{user}}=await sb.auth.getUser();
    if(!user){alert('Please sign in first.');return;}
    const agent=getLocalAgents().find(a=>String(a.id)===String(id));if(!agent){alert('Agent not found.');return;}
    const price=prompt('Monthly price (0 for free):','9.99');if(price===null)return;
    const monthly=Number(price);if(!Number.isFinite(monthly)||monthly<0){alert('Enter a valid price.');return;}
    const payload={agent_id:String(agent.id),owner_user_id:user.id,name:agent.name||'AI Agent',description:agent.description||'',category:agent.category||'General',monthly_price:monthly,status:'published'};
    const {error}=await sb.from('marketplace_agents').upsert(payload,{onConflict:'owner_user_id,agent_id'});
    if(error){alert('Publish failed: '+error.message);return;}
    render(win,doc);
  }

  function buy(id){alert('Agent checkout is not connected yet. The next step is secure subscription + payment + AKEXA commission processing.');}

  function boot(){
    const frame=document.querySelector('#agenthub-frame');if(!frame)return;
    frame.addEventListener('load',async function(){
      const win=frame.contentWindow,doc=frame.contentDocument;if(!doc)return;
      injectStyles(doc);await loadSupabase(doc);
      if(!doc.getElementById('akexa-bazar-nav')){
        const item=doc.createElement('div');item.id='akexa-bazar-nav';item.className='nav-item';item.innerHTML='<span class="nav-icon">🛒</span><span>AI Bazar</span>';item.onclick=()=>render(win,doc);const navWrap=doc.querySelector('.sidebar-nav');if(navWrap)navWrap.appendChild(item);
      }
      win.akexaBazarPublish=id=>publish(id,win,doc);win.akexaBazarBuy=buy;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
