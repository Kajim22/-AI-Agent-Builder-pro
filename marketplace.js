/* AKEXA AI Bazar — Marketplace layer for the existing dashboard. */
(function(){
  'use strict';
  const BRAND='AKEXA AI Bazar';
  const TAGLINE='Build AI Agents. Automate Businesses.';
  const KEY='akexa_marketplace_agents_v1';
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function getLocalAgents(){
    try{
      const raw=localStorage.getItem('agents');
      const a=raw?JSON.parse(raw):[];
      return Array.isArray(a)?a:[];
    }catch{return [];}
  }
  function getPublished(){
    try{return JSON.parse(localStorage.getItem(KEY)||'[]')||[];}catch{return [];}
  }
  function savePublished(items){localStorage.setItem(KEY,JSON.stringify(items));}

  function injectStyles(doc){
    if(doc.getElementById('akexa-bazar-style'))return;
    const s=doc.createElement('style');s.id='akexa-bazar-style';
    s.textContent=`
      .akexa-bazar-overlay{position:fixed;inset:0;background:rgba(3,3,9,.78);backdrop-filter:blur(8px);z-index:1000;display:none;overflow:auto;padding:28px}
      .akexa-bazar-overlay.open{display:block}
      .akexa-bazar{max-width:1100px;margin:0 auto;background:#0f0f1a;border:1px solid #2a2a40;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.55);overflow:hidden}
      .akexa-bazar-head{padding:24px;border-bottom:1px solid #2a2a40;display:flex;justify-content:space-between;align-items:flex-start;gap:15px}
      .akexa-bazar-head h2{margin:0;font-size:22px}.akexa-bazar-head p{margin:6px 0 0;color:#9090b0;font-size:12px}
      .akexa-bazar-close{background:transparent;border:1px solid #353550;color:#9090b0;border-radius:8px;padding:7px 11px;cursor:pointer}
      .akexa-bazar-body{padding:24px}.akexa-bazar-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
      .akexa-bazar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
      .akexa-agent-card{background:#161626;border:1px solid #2a2a40;border-radius:12px;padding:17px;display:flex;flex-direction:column;gap:11px}
      .akexa-agent-card h3{font-size:14px;margin:0}.akexa-agent-card p{font-size:12px;color:#9090b0;line-height:1.55;margin:0;min-height:38px}
      .akexa-agent-meta{display:flex;justify-content:space-between;align-items:center;color:#9090b0;font-size:11px}.akexa-price{color:#a89cff;font-weight:700}
      .akexa-empty{padding:40px 15px;text-align:center;color:#9090b0;border:1px dashed #353550;border-radius:12px}
      .akexa-bazar-note{font-size:11px;color:#50506a;margin-top:15px;line-height:1.6}
      @media(max-width:650px){.akexa-bazar-overlay{padding:10px}.akexa-bazar-head,.akexa-bazar-body{padding:16px}}
    `;doc.head.appendChild(s);
  }

  function render(win,doc){
    const old=doc.getElementById('akexa-bazar-overlay');if(old)old.remove();
    const published=getPublished();
    const created=getLocalAgents();
    const cards=published.map(x=>`<div class="akexa-agent-card"><h3>🤖 ${esc(x.name)}</h3><p>${esc(x.description||'AI agent for business automation.')}</p><div class="akexa-agent-meta"><span>${esc(x.category||'Business')}</span><span class="akexa-price">${x.price?esc(x.price)+' / month':'Free'}</span></div><button class="btn btn-primary btn-sm" onclick="window.akexaBazarBuy('${esc(x.id)}')">Get Agent</button></div>`).join('');
    const draftCards=created.filter(a=>!published.some(p=>String(p.sourceId)===String(a.id))).map(a=>`<div class="akexa-agent-card"><h3>⚙️ ${esc(a.name||'Unnamed Agent')}</h3><p>Publish this agent to make it available in AKEXA AI Bazar.</p><div class="akexa-agent-meta"><span>Draft</span><span class="akexa-price">Set price</span></div><button class="btn btn-success btn-sm" onclick="window.akexaBazarPublish('${esc(a.id)}')">Publish to Bazar</button></div>`).join('');
    const body=cards+draftCards;
    const overlay=doc.createElement('div');overlay.id='akexa-bazar-overlay';overlay.className='akexa-bazar-overlay';
    overlay.innerHTML=`<div class="akexa-bazar"><div class="akexa-bazar-head"><div><h2>${BRAND}</h2><p>${TAGLINE}</p></div><button class="akexa-bazar-close" id="akexa-bazar-close">Close</button></div><div class="akexa-bazar-body"><div class="akexa-bazar-toolbar"><button class="btn btn-primary btn-sm" id="akexa-refresh">Refresh</button><button class="btn btn-ghost btn-sm" id="akexa-myagents">My Agents</button></div>${body?`<div class="akexa-bazar-grid">${body}</div>`:`<div class="akexa-empty">No agents are published yet.<br>Create an agent first, then publish it here.</div>`}<div class="akexa-bazar-note">Marketplace foundation only: publishing is stored locally for now. Payments, subscriptions, commissions and server-side listings should be connected to the backend before accepting real customer payments.</div></div></div>`;
    doc.body.appendChild(overlay);
    overlay.classList.add('open');
    doc.getElementById('akexa-bazar-close').onclick=()=>overlay.remove();
    doc.getElementById('akexa-refresh').onclick=()=>render(win,doc);
    doc.getElementById('akexa-myagents').onclick=()=>{overlay.remove();if(typeof win.showSection==='function')win.showSection('agents');};
  }

  function publish(id,win,doc){
    const agent=getLocalAgents().find(a=>String(a.id)===String(id));
    if(!agent){alert('Agent not found.');return;}
    const price=prompt('Monthly price for this agent (optional):','9.99');
    if(price===null)return;
    const items=getPublished().filter(x=>String(x.sourceId)!==String(id));
    items.push({id:'bazar_'+Date.now(),sourceId:agent.id,name:agent.name||'AI Agent',description:agent.description||'',category:agent.category||'Business',price:price.trim()});
    savePublished(items);render(win,doc);
  }

  function boot(){
    const frame=document.querySelector('#agenthub-frame');if(!frame)return;
    frame.addEventListener('load',function(){
      const win=frame.contentWindow,doc=frame.contentDocument;if(!doc)return;
      injectStyles(doc);
      const nav=Array.from(doc.querySelectorAll('.nav-item')).find(x=>/agent|market|bazaar|বাজার/i.test(x.textContent||''));
      if(!doc.getElementById('akexa-bazar-nav')){
        const item=doc.createElement('div');item.id='akexa-bazar-nav';item.className='nav-item';item.innerHTML='<span class="nav-icon">🛒</span><span>AI Bazar</span>';item.onclick=()=>render(win,doc);
        const navWrap=doc.querySelector('.sidebar-nav');if(navWrap)navWrap.appendChild(item);
      }
      win.akexaBazarPublish=id=>publish(id,win,doc);
      win.akexaBazarBuy=id=>alert('Agent checkout is not connected yet. Next step: backend listing + subscription/commission checkout.');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
