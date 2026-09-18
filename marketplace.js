/* AKEXA AI Bazar — Supabase-backed marketplace layer. */
(function(){
  'use strict';
  const BRAND='AKEXA AI Bazar';
  const TAGLINE='Build AI Agents. Automate Businesses.';
  const SUPABASE_URL='https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY='sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  const SUPABASE_SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js';
  const FUNCTION_URL=SUPABASE_URL+'/functions/v1/create-marketplace-subscription';
  let sb=null,ready=null,currentWin=null,currentDoc=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const getLocalAgents = () => {
  try {
    const raw = localStorage.getItem('ah_agents');
    const agents = raw ? JSON.parse(raw) : [];

    return Array.isArray(agents) ? agents : [];
  } catch (error) {
    console.warn(
      'AKEXA: Could not load ah_agents:',
      error
    );

    return [];
  }
};
  function loadSupabase(doc){
    if(sb)return Promise.resolve(sb);if(ready)return ready;
    ready=new Promise((resolve,reject)=>{if(window.supabase?.createClient){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb);return;}const s=doc.createElement('script');s.src=SUPABASE_SDK;s.onload=()=>{try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb);}catch(e){reject(e);}};s.onerror=()=>reject(new Error('Supabase SDK could not load'));doc.head.appendChild(s);});
    return ready;
  }
  function injectStyles(doc){
    if(doc.getElementById('akexa-bazar-style'))return;const s=doc.createElement('style');s.id='akexa-bazar-style';s.textContent=`
      .akexa-bazar-overlay{position:fixed;inset:0;background:rgba(3,3,9,.82);backdrop-filter:blur(8px);z-index:1000;display:none;overflow:auto;padding:28px}.akexa-bazar-overlay.open{display:block}.akexa-bazar{max-width:1100px;margin:0 auto;background:#0f0f1a;border:1px solid #2a2a40;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.55);overflow:hidden}.akexa-bazar-head{padding:24px;border-bottom:1px solid #2a2a40;display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.akexa-bazar-head h2{margin:0;font-size:22px}.akexa-bazar-head p{margin:6px 0 0;color:#9090b0;font-size:12px}.akexa-bazar-close{background:transparent;border:1px solid #353550;color:#9090b0;border-radius:8px;padding:7px 11px;cursor:pointer}.akexa-bazar-body{padding:24px}.akexa-bazar-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}.akexa-bazar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.akexa-agent-card{background:#161626;border:1px solid #2a2a40;border-radius:12px;padding:17px;display:flex;flex-direction:column;gap:11px}.akexa-agent-card h3{font-size:14px;margin:0}.akexa-agent-card p{font-size:12px;color:#9090b0;line-height:1.55;margin:0;min-height:38px}.akexa-agent-meta{display:flex;justify-content:space-between;align-items:center;color:#9090b0;font-size:11px}.akexa-price{color:#a89cff;font-weight:700}.akexa-empty{padding:40px 15px;text-align:center;color:#9090b0;border:1px dashed #353550;border-radius:12px}.akexa-bazar-note{font-size:11px;color:#50506a;margin-top:15px;line-height:1.6}.akexa-detail{padding:20px;background:#141421;border:1px solid #2a2a40;border-radius:12px}.akexa-detail h3{margin:0 0 8px}.akexa-detail p{color:#aaaac0;font-size:12px;line-height:1.6}.akexa-auth{padding:18px;border:1px solid #353550;border-radius:12px;margin-top:15px}.akexa-auth input{width:100%;box-sizing:border-box;margin:5px 0;padding:10px;background:#0d0d16;border:1px solid #353550;color:#fff;border-radius:8px}.akexa-msg{font-size:12px;margin-top:10px;color:#b8b8d0}.akexa-success{color:#79e2a4}.akexa-error{color:#ff8f8f}.akexa-detail-hero{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start;margin-bottom:18px}.akexa-detail-icon{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#a855f7);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 12px 30px rgba(79,70,229,.25)}.akexa-detail-title{display:flex;gap:14px;align-items:center}.akexa-detail-title h2{margin:0;font-size:22px}.akexa-detail-title .akexa-category{display:inline-block;margin-top:7px;padding:5px 9px;border:1px solid #353550;border-radius:999px;color:#aaaac0;font-size:11px}.akexa-detail-price{min-width:150px;padding:15px;border:1px solid #353550;border-radius:12px;text-align:right}.akexa-detail-price strong{display:block;font-size:20px;color:#c0b5ff}.akexa-detail-price span{font-size:11px;color:#777790}.akexa-detail-section{padding:16px;border:1px solid #2a2a40;border-radius:12px;background:#11111d;margin-top:12px}.akexa-detail-section h4{margin:0 0 9px;font-size:13px}.akexa-detail-section p{margin:0}.akexa-detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.akexa-detail-actions button{min-height:42px}.akexa-detail-trust{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.akexa-detail-trust span{padding:7px 10px;border-radius:8px;background:#171727;border:1px solid #292940;color:#9090b0;font-size:10px}.akexa-detail-note{margin-top:12px;color:#676780;font-size:10px;line-height:1.5}@media(max-width:650px){.akexa-bazar-overlay{padding:10px}.akexa-bazar-head,.akexa-bazar-body{padding:16px}.akexa-detail-hero{grid-template-columns:1fr}.akexa-detail-price{text-align:left;min-width:0}.akexa-detail-title h2{font-size:18px}}
    `;doc.head.appendChild(s);
  }
  async function getPublished(){
    try{const client=await loadSupabase(currentDoc);const {data,error}=await client.from('marketplace_agents').select('id,agent_id,name,description,category,monthly_price,commission_percent,owner_user_id,status').eq('status','published').order('created_at',{ascending:false});if(error)throw error;return data||[];}catch(e){console.warn('Bazar listing failed:',e.message);return [];}
  }
  async function publish(id,win,doc){
    const client=await loadSupabase(doc);const {data:{user}}=await client.auth.getUser();if(!user){alert('প্রথমে Login/Create account করুন।');return;}
    const agent=getLocalAgents().find(a=>String(a.id)===String(id));if(!agent){alert('Agent not found.');return;}
    const price=prompt('Monthly price for this agent (0 for free):',agent.monthly_price??'9.99');if(price===null)return;const monthly=Number(price);if(!Number.isFinite(monthly)||monthly<0){alert('Invalid monthly price.');return;}
    const category=prompt('Category:',agent.category||'Business')||'Business';
    const payload={agent_id:String(agent.id),owner_user_id:user.id,name:agent.name||'AI Agent',description:agent.description||'',category,monthly_price:monthly,status:'published'};
    const {error}=await client.from('marketplace_agents').upsert(payload,{onConflict:'owner_user_id,agent_id'});if(error){alert('Publish failed: '+error.message);return;}alert('Agent successfully published to AKEXA AI Bazar.');render(win,doc);
  }
  async function subscribe(id,win,doc){
    const client=await loadSupabase(doc);const {data:{user}}=await client.auth.getUser();
    if(!user){showAuth(win,doc,id);return;}
    const {data:sessionData}=await client.auth.getSession();const token=sessionData?.session?.access_token;if(!token){alert('Login session পাওয়া যায়নি। আবার Login করুন।');return;}
    const btn=doc.getElementById('akexa-buy-btn');if(btn){btn.disabled=true;btn.textContent='Creating subscription...';}
    try{const res=await fetch(FUNCTION_URL,{method:'POST',headers:{Authorization:'Bearer '+token,'apikey':SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({marketplace_agent_id:id})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Subscription request failed');alert('Subscription request created.\nStatus: '+(data.subscription?.status||'pending')+'\nPayment gateway will be connected next.');render(win,doc);}catch(e){alert('Subscription failed: '+e.message);}finally{if(btn){btn.disabled=false;btn.textContent='Get Agent';}}
  }
  function showAuth(win,doc,agentId){
    const old=doc.getElementById('akexa-auth-overlay');if(old)old.remove();const overlay=doc.createElement('div');overlay.id='akexa-auth-overlay';overlay.className='akexa-bazar-overlay open';overlay.innerHTML=`<div class="akexa-bazar"><div class="akexa-bazar-head"><div><h2>Login to ${BRAND}</h2><p>Account required to subscribe to an agent.</p></div><button class="akexa-bazar-close" id="akexa-auth-close">Close</button></div><div class="akexa-bazar-body"><div class="akexa-auth"><input id="akexa-email" type="email" placeholder="Email"><input id="akexa-password" type="password" placeholder="Password"><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary btn-sm" id="akexa-login">Login</button><button class="btn btn-ghost btn-sm" id="akexa-signup">Create account</button></div><div id="akexa-auth-msg" class="akexa-msg"></div></div></div></div>`;doc.body.appendChild(overlay);
    const msg=doc.getElementById('akexa-auth-msg');doc.getElementById('akexa-auth-close').onclick=()=>overlay.remove();
    const credentials=()=>({email:doc.getElementById('akexa-email').value.trim(),password:doc.getElementById('akexa-password').value});
    doc.getElementById('akexa-login').onclick=async()=>{const c=credentials();if(!c.email||!c.password){msg.textContent='Email and password দিন।';return;}const client=await loadSupabase(doc);const {error}=await client.auth.signInWithPassword(c);if(error){msg.textContent=error.message;msg.className='akexa-msg akexa-error';return;}overlay.remove();subscribe(agentId,win,doc);};
    doc.getElementById('akexa-signup').onclick=async()=>{const c=credentials();if(!c.email||!c.password){msg.textContent='Email and password দিন।';return;}if(c.password.length<6){msg.textContent='Password কমপক্ষে ৬ অক্ষরের হতে হবে।';return;}const client=await loadSupabase(doc);const {data,error}=await client.auth.signUp(c);if(error){msg.textContent=error.message;msg.className='akexa-msg akexa-error';return;}if(data.session){overlay.remove();subscribe(agentId,win,doc);}else{msg.textContent='Account তৈরি হয়েছে। Email verification লাগতে পারে; verify করে আবার Login করুন।';msg.className='akexa-msg akexa-success';}};
  }
  async function render(win,doc){
    currentWin=win;currentDoc=doc;const old=doc.getElementById('akexa-bazar-overlay');if(old)old.remove();const published=await getPublished();const created=getLocalAgents();
    const cards=published.map(x=>`<div class="akexa-agent-card"><h3>🤖 ${esc(x.name)}</h3><p>${esc(x.description||'AI agent for business automation.')}</p><div class="akexa-agent-meta"><span>${esc(x.category||'Business')}</span><span class="akexa-price">${Number(x.monthly_price)>0?'৳'+esc(Number(x.monthly_price).toFixed(2))+' / month':'Free'}</span></div><button class="btn btn-primary btn-sm" onclick="window.akexaBazarDetails('${esc(x.id)}')">View Agent</button></div>`).join('');
    const draftCards=created.map(a=>`<div class="akexa-agent-card"><h3>⚙️ ${esc(a.name||'Unnamed Agent')}</h3><p>Publish this agent to make it available in AKEXA AI Bazar.</p><div class="akexa-agent-meta"><span>My Agent</span><span class="akexa-price">Publish</span></div><button class="btn btn-success btn-sm" onclick="window.akexaBazarPublish('${esc(a.id)}')">Publish to Bazar</button></div>`).join('');
    const overlay=doc.createElement('div');overlay.id='akexa-bazar-overlay';overlay.className='akexa-bazar-overlay open';overlay.innerHTML=`<div class="akexa-bazar"><div class="akexa-bazar-head"><div><h2>${BRAND}</h2><p>${TAGLINE}</p></div><button class="akexa-bazar-close" id="akexa-bazar-close">Close</button></div><div class="akexa-bazar-body"><div class="akexa-bazar-toolbar"><button class="btn btn-primary btn-sm" id="akexa-refresh">Refresh</button><button class="btn btn-ghost btn-sm" id="akexa-myagents">My Agents</button></div>${(cards||draftCards)?`<div class="akexa-bazar-grid">${cards}${draftCards}</div>`:`<div class="akexa-empty">No agents are published yet.<br>Create an agent first, then publish it here.</div>`}<div class="akexa-bazar-note">Listings and publishing are now connected to Supabase. Subscription requests are server-validated; payment gateway is not connected yet.</div></div></div>`;doc.body.appendChild(overlay);doc.getElementById('akexa-bazar-close').onclick=()=>overlay.remove();doc.getElementById('akexa-refresh').onclick=()=>render(win,doc);doc.getElementById('akexa-myagents').onclick=()=>{overlay.remove();if(typeof win.showSection==='function')win.showSection('agents');};
  }
  async function details(id,win,doc){
    const client=await loadSupabase(doc);
    const {data:x,error}=await client.from('marketplace_agents').select('id,agent_id,name,description,category,monthly_price,commission_percent,owner_user_id,status').eq('id',id).eq('status','published').single();
    if(error||!x){alert('Agent not found.');return;}
    const {data:{user}}=await client.auth.getUser();
    const isOwner=!!user && String(x.owner_user_id)===String(user.id);
    const old=doc.getElementById('akexa-bazar-detail');if(old)old.remove();
    const price=Number(x.monthly_price)||0;
    const priceText=price>0?'৳'+esc(price.toFixed(2)):'Free';
    const commission=x.commission_percent==null?15:Number(x.commission_percent);
    const actionLabel=isOwner?'Use My Agent':(price>0?'Subscribe & Get Agent':'Get Agent — Free');
    const actionNote=isOwner?'This is your own Agent. No subscription or payment is required.':price>0?'Subscription will be created as pending until payment is connected.':'This Agent is free.';
    const overlay=doc.createElement('div');overlay.id='akexa-bazar-detail';overlay.className='akexa-bazar-overlay open';
    overlay.innerHTML=`<div class="akexa-bazar"><div class="akexa-bazar-head"><div><h2>AKEXA AI Bazar</h2><p>Agent details</p></div><button class="akexa-bazar-close" id="akexa-detail-close">Close</button></div><div class="akexa-bazar-body"><div class="akexa-detail-hero"><div class="akexa-detail-title"><div class="akexa-detail-icon">🤖</div><div><h2>${esc(x.name)}</h2><span class="akexa-category">${esc(x.category||'Business')}</span></div></div><div class="akexa-detail-price"><strong>${priceText}</strong><span>${price>0?'/ month':'No monthly charge'}</span></div></div><div class="akexa-detail-section"><h4>About this agent</h4><p>${esc(x.description||'This AI agent is designed to help automate business tasks and customer interactions.')}</p></div><div class="akexa-detail-section"><h4>What you get</h4><div class="akexa-detail-trust"><span>🤖 AI Agent</span><span>⚙️ Business Automation</span><span>🔗 Integration Ready</span><span>🛡️ Server-validated</span></div></div><div class="akexa-detail-section"><h4>Pricing</h4><p>${isOwner?'Owner access: no subscription required.':price>0?'Subscription: '+priceText+' / month.':'This agent is currently free.'} Marketplace commission: ${esc(commission)}% applies to seller payouts according to the platform configuration.</p></div><div class="akexa-detail-actions"><button class="btn btn-primary" id="akexa-buy-btn">${actionLabel}</button><button class="btn btn-ghost" id="akexa-back-bazar">Back to Bazar</button></div><div class="akexa-detail-note">${actionNote}</div></div></div>`;
    doc.body.appendChild(overlay);
    doc.getElementById('akexa-detail-close').onclick=()=>overlay.remove();
    doc.getElementById('akexa-back-bazar').onclick=()=>{overlay.remove();render(win,doc);};
    doc.getElementById('akexa-buy-btn').onclick=async()=>{
      if(isOwner){
  const targetId = String(x.agent_id || '');
  let selected = false;

  try {
    // 1. প্রথমে core window-এর agents ব্যবহার করি
    let agentList = Array.isArray(win.agents) ? win.agents : [];

    // 2. Core agents না থাকলে সঠিক localStorage key থেকে load করি
    if (!agentList.length) {
      try {
        const raw = localStorage.getItem('ah_agents');
        const stored = raw ? JSON.parse(raw) : [];

        if (Array.isArray(stored) && stored.length) {
          win.agents = stored;
          agentList = stored;
        }
      } catch (storageError) {
        console.warn(
          'AKEXA: ah_agents load failed:',
          storageError
        );
      }
    }

    // 3. Marketplace-এর agent_id দিয়ে local Agent খুঁজি
    // Match by stable agent id first; owner-owned marketplace rows can also
    // be matched by name if an older local agent was re-created/re-keyed.
    const localAgent = agentList.find(
      a => String(a.id) === targetId
    ) || agentList.find(
      a => String(a.name || '').trim().toLowerCase() === String(x.name || '').trim().toLowerCase()
    );

    if (!localAgent) {
      console.error(
        'AKEXA: Owner Agent পাওয়া যায়নি',
        {
          marketplaceAgentId: x.id,
          targetAgentId: targetId,
          availableAgents: agentList.map(a => ({
            id: a.id,
            name: a.name
          }))
        }
      );

      alert(
        'AKEXA Sales Assistant আপনার My Agents list-এ পাওয়া যাচ্ছে না।\n\n' +
        'আগে My Agents থেকে Agentটি load করুন।'
      );

      return;
    }

    // 4. Activate through the core bridge when available.
    // This keeps the marketplace and Agent Builder state in sync.
    if (typeof win.akexaActivateAgent === 'function') {
      selected = !!win.akexaActivateAgent(localAgent.id);
    } else {
      win.activeId = localAgent.id;
      if (typeof win.selectAgent === 'function') {
        win.selectAgent(localAgent.id);
      }
      localStorage.setItem('ah_active_agent', String(localAgent.id));
      selected = String(win.activeId) === String(localAgent.id);
    }

    // 6. Agent dropdown sync
    const mainSelect = doc.getElementById('agent-select');

    if (mainSelect) {
      mainSelect.value = String(localAgent.id);

      mainSelect.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );
    }

    // 7. UI badge সরাসরি update
    const activeBadge = doc.getElementById('active-badge');
    const activeName = doc.getElementById('active-name');

    if (activeBadge) {
      activeBadge.style.display = 'inline-flex';
    }

    if (activeName) {
      activeName.textContent = localAgent.name;
    }

    // 8. Agent chip selected state update
    doc.querySelectorAll('.agent-chip').forEach(chip => {
      chip.classList.remove('selected');
    });

    const chips = doc.querySelectorAll('.agent-chip');

    chips.forEach(chip => {
      const nameEl = chip.querySelector('.agent-name-text');

      if (
        nameEl &&
        nameEl.textContent.trim() ===
          String(localAgent.name).trim()
      ) {
        chip.classList.add('selected');
      }
    });

    selected =
      String(win.activeId) === String(localAgent.id);

    console.log(
      '✅ AKEXA: Agent successfully activated',
      {
        id: localAgent.id,
        name: localAgent.name
      }
    );

  } catch (error) {
    console.error(
      '❌ AKEXA owner agent selection failed:',
      error
    );
  }

  if (!selected) {
    alert(
      'Agent activate করা যায়নি। Console-এ বিস্তারিত error দেখুন।'
    );
    return;
  }

  // Detail page বন্ধ
  overlay.remove();

  // Test section-এ নিয়ে যাওয়া
  if (typeof win.showSection === 'function') {
    win.showSection('test');
  }

  return;
}
      }
      subscribe(x.id,win,doc);
    };
  }

  function mount(win,doc){
    if(!doc)return false;
    currentWin=win;currentDoc=doc;injectStyles(doc);
    const navWrap=doc.querySelector('.sidebar-nav');
    if(navWrap&&!doc.getElementById('akexa-bazar-nav')){
      const group=doc.createElement('div');group.className='nav-group-label';group.textContent='MARKETPLACE';
      const item=doc.createElement('div');item.id='akexa-bazar-nav';item.className='nav-item';item.innerHTML='<span class="nav-icon">🛒</span><span>AI Bazar</span>';item.onclick=()=>render(win,doc);
      navWrap.append(group,item);
    }
    win.akexaBazarOpen=()=>render(win,doc);
    win.akexaBazarPublish=id=>publish(id,win,doc);
    win.akexaBazarBuy=id=>subscribe(id,win,doc);
    win.akexaBazarDetails=id=>details(id,win,doc);
    return !!doc.getElementById('akexa-bazar-nav');
  }
  // Expose the opener immediately so the parent shell can detect that the
  // marketplace module itself loaded, even if UI mounting has to wait for DOM.
  // The actual render path is lazy and uses the current window/document.
  window.akexaBazarOpen=function(){
    try{
      mount(window,document);
      return render(window,document);
    }catch(error){
      console.error('AKEXA AI Bazar open failed:',error);
      alert('AI Bazar খুলতে সমস্যা হয়েছে: '+(error?.message||String(error)));
      return false;
    }
  };
  window.akexaBazarPublish=window.akexaBazarPublish||function(id){return publish(id,window,document);};
  window.akexaBazarBuy=window.akexaBazarBuy||function(id){return subscribe(id,window,document);};
  window.akexaBazarDetails=window.akexaBazarDetails||function(id){return details(id,window,document);};

  function boot(){
    // This script is loaded INSIDE app-core.html. Do not look for the parent iframe here.
    const doc=document,win=window;
    try{
      mount(win,doc);
    }catch(error){
      console.error('AKEXA AI Bazar mount failed:',error);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
