// Customer Profile Dashboard — additive UI for the existing AgentHub frontend.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const toast=(m,t)=>typeof window.toast==='function'?window.toast(m,t):alert(m);
  let customers=[];

  function mount(){
    if(document.getElementById('nav-customers')) return true;
    const nav=document.querySelector('.sidebar-nav');
    if(!nav) return false;
    const group=document.createElement('div'); group.className='nav-group-label'; group.textContent='গ্রাহক';
    const item=document.createElement('div'); item.className='nav-item'; item.id='nav-customers'; item.innerHTML='<span class="nav-icon">👥</span> Customers';
    item.onclick=()=>show(); nav.appendChild(group); nav.appendChild(item);
    const main=document.querySelector('.content');
    if(!main) return false;
    const section=document.createElement('div'); section.className='section'; section.id='section-customers';
    section.innerHTML=`
      <div class="card"><div class="card-header"><div class="card-title">👥 Customer Profiles</div><span class="badge badge-purple">Agent-specific</span></div>
      <div class="card-body">
        <div class="field"><label>কোন এজেন্টের গ্রাহক?</label><select id="customer-agent-select"></select></div>
        <div class="field"><label>🔎 Customer Search</label><input id="customer-search" type="search" placeholder="নাম, ফোন, ঠিকানা..." /></div>
      </div></div>
      <div class="card"><div class="card-header"><div class="card-title">📋 গ্রাহক তালিকা</div><span id="customer-count" class="badge badge-purple">0</span></div>
      <div class="card-body" style="padding-top:10px"><div id="customer-list"><p style="color:var(--text3);font-size:12px">একজন Agent নির্বাচন করুন।</p></div></div></div>`;
    main.appendChild(section);
    const sel=document.getElementById('customer-agent-select');
    (window.agents||[]).forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;sel.appendChild(o);});
    if(window.activeId) sel.value=window.activeId;
    sel.addEventListener('change',load);
    document.getElementById('customer-search').addEventListener('input',render);
    return true;
  }

  function show(){
    if(!mount()) return;
    if(typeof window.showSection==='function') window.showSection('customers');
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.getElementById('nav-customers')?.classList.add('active');
    load();
  }

  async function load(){
    const aid=document.getElementById('customer-agent-select')?.value||window.activeId||'';
    const list=document.getElementById('customer-list'); if(!aid||!list)return;
    list.innerHTML='<p style="color:var(--text3);font-size:12px">লোড হচ্ছে...</p>';
    try{
      const r=await fetch(`${API}/customer/profiles/${encodeURIComponent(aid)}`,{cache:'no-store'});
      const d=await r.json(); if(!d.success)throw new Error(d.error||'লোড করা যায়নি');
      customers=Array.isArray(d.customers)?d.customers:[]; render();
    }catch(e){list.innerHTML=`<p style="color:var(--red);font-size:12px">লোড করা যায়নি: ${esc(e.message)}</p>`;}
  }

  function render(){
    const q=(document.getElementById('customer-search')?.value||'').trim().toLowerCase();
    const rows=!q?customers:customers.filter(c=>[c.customer_name,c.customer_phone,c.customer_address,c.preferences,c.needs,c.platform,c.chat_id].some(v=>String(v||'').toLowerCase().includes(q)));
    const count=document.getElementById('customer-count'); if(count)count.textContent=`${rows.length}/${customers.length}`;
    const list=document.getElementById('customer-list'); if(!list)return;
    if(!rows.length){list.innerHTML='<p style="color:var(--text3);font-size:12px;padding:10px 0">এখনও কোনো Customer Profile পাওয়া যায়নি।</p>';return;}
    list.innerHTML=rows.map(c=>`<div class="agent-row" style="display:block;margin-bottom:10px;padding:14px"><div style="display:flex;justify-content:space-between;gap:10px"><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">${esc(c.customer_name||'নাম নেই')}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(c.platform||'')} · Chat ID: ${esc(c.chat_id||'')}</div><div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.7">${c.customer_phone?`📞 ${esc(c.customer_phone)}<br>`:''}${c.customer_address?`📍 ${esc(c.customer_address)}<br>`:''}${c.preferences?`⭐ ${esc(c.preferences)}<br>`:''}${c.needs?`🎯 ${esc(c.needs)}`:''}</div></div><button class="btn btn-ghost btn-sm" onclick="window.viewCustomer('${esc(c.platform)}','${esc(c.chat_id)}')">View</button></div></div>`).join('');
  }

  window.viewCustomer=async function(platform,chatId){
    const aid=document.getElementById('customer-agent-select')?.value||window.activeId||'';
    try{const r=await fetch(`${API}/customer/profile/${encodeURIComponent(aid)}/${encodeURIComponent(platform)}/${encodeURIComponent(chatId)}`);const d=await r.json();const p=d.profile;if(!p)return toast('Profile পাওয়া যায়নি','error');alert(`Customer Profile\n\nনাম: ${p.customer_name||'—'}\nফোন: ${p.customer_phone||'—'}\nঠিকানা: ${p.customer_address||'—'}\nপছন্দ: ${p.preferences||'—'}\nপ্রয়োজন: ${p.needs||'—'}\nPlatform: ${p.platform}`);}catch(e){toast('Profile load error: '+e.message,'error');}
  };

  const oldShow=window.showSection;
  window.showSection=function(n){
    if(n==='customers'){show();return;}
    return oldShow?oldShow.apply(this,arguments):undefined;
  };
  const oldSelect=window.selectAgent;
  if(typeof oldSelect==='function') window.selectAgent=function(id){const r=oldSelect.apply(this,arguments);const s=document.getElementById('customer-agent-select');if(s)s.value=id;return r;};
  const timer=setInterval(()=>{if(mount())clearInterval(timer);},200);
})();
