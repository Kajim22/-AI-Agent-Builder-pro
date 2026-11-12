// Customer CRM dashboard: agent-scoped customers, metrics and purchase history.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  const SUPABASE_URL='https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY='sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const toast=(m,t)=>typeof window.toast==='function'?window.toast(m,t):alert(m);
  let customers=[],supabaseClient=null;
  async function token(){
    if(!window.supabase?.createClient) await new Promise((resolve,reject)=>{const x=document.createElement('script');x.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js';x.onload=resolve;x.onerror=()=>reject(new Error('Login service load failed'));document.head.appendChild(x);});
    if(!supabaseClient)supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data,error}=await supabaseClient.auth.getSession();if(error)throw error;
    if(!data.session?.access_token)throw new Error('প্রথমে Login করুন।');
    return data.session.access_token;
  }
  function mount(){
    if(document.getElementById('nav-customers'))return true;
    const nav=document.querySelector('.sidebar-nav'),main=document.querySelector('.content');if(!nav||!main)return false;
    const group=document.createElement('div');group.className='nav-group-label';group.textContent='গ্রাহক';
    const item=document.createElement('div');item.className='nav-item';item.id='nav-customers';item.innerHTML='<span class="nav-icon">👥</span> Customers';item.onclick=show;nav.append(group,item);
    const section=document.createElement('div');section.className='section';section.id='section-customers';
    section.innerHTML=`
      <div class="card"><div class="card-header"><div class="card-title">👥 Customer Management</div><span class="badge badge-purple">Agent-specific CRM</span></div><div class="card-body">
      <div class="field"><label>কোন এজেন্টের গ্রাহক?</label><select id="customer-agent-select"></select></div>
      <div class="field"><label>🔎 Customer Search</label><input id="customer-search" type="search" placeholder="নাম, ফোন, ঠিকানা..." /></div></div></div>
      <div id="customer-stats" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px"></div>
      <div class="card"><div class="card-header"><div class="card-title">📋 গ্রাহক তালিকা</div><span id="customer-count" class="badge badge-purple">0</span></div><div class="card-body" style="padding-top:10px"><div id="customer-list">একজন Agent নির্বাচন করুন।</div></div></div>`;
    main.appendChild(section);
    syncAgents();document.getElementById('customer-agent-select').addEventListener('change',load);
    document.getElementById('customer-search').addEventListener('input',()=>render());return true;
  }
  function syncAgents(){
    const sel=document.getElementById('customer-agent-select');if(!sel)return;
    const current=sel.value||window.activeId||'',agents=Array.isArray(window.agents)?window.agents:[];
    const sig=agents.map(a=>String(a.id)).join('|');
    if(sel.dataset.agentSignature!==sig){sel.innerHTML='';agents.forEach(a=>{const o=document.createElement('option');o.value=String(a.id);o.textContent=a.name||a.id;sel.appendChild(o);});sel.dataset.agentSignature=sig;}
    if(current&&agents.some(a=>String(a.id)===String(current)))sel.value=current;else if(window.activeId)sel.value=String(window.activeId);
  }
  function show(){
    if(!mount())return;
    if(typeof oldShow==='function')oldShow.call(window,'customers');
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.getElementById('nav-customers')?.classList.add('active');syncAgents();load();
  }
  async function load(){
    syncAgents();const aid=document.getElementById('customer-agent-select')?.value||window.activeId||'';
    const list=document.getElementById('customer-list');if(!aid||!list)return;
    list.innerHTML='<p>লোড হচ্ছে...</p>';
    try{
      const accessToken=await token();
      const r=await fetch(`${API}/customer/profiles/${encodeURIComponent(aid)}`,{cache:'no-store',headers:{Authorization:'Bearer '+accessToken}});
      const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'লোড করা যায়নি');
      customers=Array.isArray(d.customers)?d.customers:[];render(d.stats||{});
    }catch(e){list.innerHTML=`<p style="color:var(--red)">লোড করা যায়নি: ${esc(e.message)}</p>`;}
  }
  function render(stats={}){
    const stat=document.getElementById('customer-stats');
    if(stat)stat.innerHTML=[['মোট কাস্টমার',stats.total??customers.length],['নিয়মিত ক্রেতা',stats.repeat??0],['নতুন / অর্ডার নেই',stats.new??0],['তথ্য অসম্পূর্ণ',stats.withFollowup??0]].map(([k,v])=>`<div class="card" style="padding:14px;margin:0"><div style="font-size:22px;font-weight:800">${esc(v)}</div><div style="font-size:11px;color:var(--text3)">${esc(k)}</div></div>`).join('');
    const q=(document.getElementById('customer-search')?.value||'').trim().toLowerCase();
    const rows=!q?customers:customers.filter(c=>[c.customer_name,c.customer_phone,c.customer_address,c.preferences,c.needs,c.platform,c.chat_id].some(v=>String(v||'').toLowerCase().includes(q)));
    const count=document.getElementById('customer-count');if(count)count.textContent=`${rows.length}/${customers.length}`;
    const list=document.getElementById('customer-list');if(!list)return;
    if(!rows.length){list.innerHTML='<p style="padding:10px 0;color:var(--text3)">এখনও কোনো Customer Profile পাওয়া যায়নি।</p>';return;}
    list.innerHTML=rows.map(c=>`<div class="agent-row" style="display:block;margin-bottom:10px;padding:14px"><div style="display:flex;justify-content:space-between;gap:10px"><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">${esc(c.customer_name||'নাম নেই')}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(c.platform||'')} · Chat ID: ${esc(c.chat_id||'')}</div><div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.7">${c.customer_phone?'📞 '+esc(c.customer_phone)+'<br>':''}${c.customer_address?'📍 '+esc(c.customer_address)+'<br>':''}${c.preferences?'⭐ '+esc(c.preferences)+'<br>':''}${c.needs?'🎯 '+esc(c.needs)+'<br>':''}🛍️ অর্ডার: ${esc(c.order_count||0)}টি ${c.last_order_at?'· সর্বশেষ: '+esc(new Date(c.last_order_at).toLocaleDateString()):''}</div></div><button class="btn btn-ghost btn-sm" onclick="window.viewCustomer('${esc(c.platform)}','${esc(c.chat_id)}')">View</button></div></div>`).join('');
  }
  window.viewCustomer=function(platform,chatId){
    const p=customers.find(c=>String(c.platform)===String(platform)&&String(c.chat_id)===String(chatId));if(!p)return toast('Customer পাওয়া যায়নি','error');
    const orders=Array.isArray(p.orders)?p.orders:[];
    const history=orders.length?orders.map(o=>`#${o.id} · ${o.order_details||'বিবরণ নেই'} · ${new Date(o.created_at).toLocaleString()}`).join('\n'):'কোনো অর্ডার পাওয়া যায়নি';
    alert(`Customer Profile\n\nনাম: ${p.customer_name||'—'}\nফোন: ${p.customer_phone||'—'}\nঠিকানা: ${p.customer_address||'—'}\nপছন্দ: ${p.preferences||'—'}\nপ্রয়োজন: ${p.needs||'—'}\nPlatform: ${p.platform}\nমোট অর্ডার: ${p.order_count||0}\n\nPurchase History\n${history}`);
  };
  const oldShow=window.showSection;
  window.showSection=function(n){if(n==='customers'){show();return;}return oldShow?oldShow.apply(this,arguments):undefined;};
  const oldSelect=window.selectAgent;
  if(typeof oldSelect==='function')window.selectAgent=function(id){const r=oldSelect.apply(this,arguments);const s=document.getElementById('customer-agent-select');if(s)s.value=id;return r;};
  const timer=setInterval(()=>{if(mount())clearInterval(timer);},200);
})();