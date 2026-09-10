// Smart Orders Dashboard — additive UI.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  let orders=[];
  let lastOrderId=0;
  let notificationTimer=null;
  const statuses=['new','confirmed','processing','delivered','cancelled'];
  const labels={new:'New',confirmed:'Confirmed',processing:'Processing',delivered:'Delivered',cancelled:'Cancelled'};

  function getAgents(){
    try{
      const rows=JSON.parse(localStorage.getItem('ah_agents')||'[]');
      return Array.isArray(rows)?rows:[];
    }catch(e){return [];}
  }

  function getActiveId(){
    const core=document.getElementById('agent-select');
    return core?.value||'';
  }

  function syncAgentOptions(){
    const sel=document.getElementById('orders-agent-select');
    if(!sel)return;
    const list=getAgents();
    const current=sel.value||getActiveId();
    const signature=list.map(a=>String(a.id)+':'+String(a.name||'')).join('|');
    if(sel.dataset.signature!==signature){
      sel.innerHTML='<option value="">— Agent বেছে নিন —</option>';
      list.forEach(a=>{
        const o=document.createElement('option');
        o.value=a.id;
        o.textContent=a.name||a.id;
        sel.appendChild(o);
      });
      sel.dataset.signature=signature;
    }
    if(current && list.some(a=>String(a.id)===String(current))) sel.value=current;
  }

  function mount(){
    if(document.getElementById('nav-orders-smart')){syncAgentOptions();return true;}
    const nav=document.querySelector('.sidebar-nav'),main=document.querySelector('.content');
    if(!nav||!main)return false;
    const group=document.createElement('div');group.className='nav-group-label';group.textContent='অর্ডার';
    const item=document.createElement('div');item.className='nav-item';item.id='nav-orders-smart';item.innerHTML='<span class="nav-icon">🛒</span> Smart Orders';item.onclick=show;nav.append(group,item);
    const section=document.createElement('div');section.className='section';section.id='section-orders-smart';
    section.innerHTML=`<div class="card"><div class="card-header"><div class="card-title">🛒 Smart Order Dashboard</div><span id="orders-total" class="badge badge-purple">0</span></div><div class="card-body"><div class="field"><label>কোন Agent-এর Order?</label><select id="orders-agent-select"><option value="">— Agent বেছে নিন —</option></select></div><div id="order-summary" style="display:grid;grid-template-columns:repeat(5,minmax(90px,1fr));gap:8px;margin-top:12px"></div><div class="field" style="margin-top:14px"><label>🔎 Order Search</label><input id="order-search" type="search" placeholder="নাম, ফোন, ঠিকানা, Order..." /></div><div class="field"><label>Status Filter</label><select id="order-status-filter"><option value="all">সব</option>${statuses.map(s=>`<option value="${s}">${labels[s]}</option>`).join('')}</select></div></div></div><div class="card"><div class="card-header"><div class="card-title">📦 New Orders <span id="new-orders-badge" style="display:none;margin-left:8px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;background:var(--red);color:#fff">0 new</span></div></div><div class="card-body" style="padding-top:10px"><div id="smart-order-list"><p style="color:var(--text3);font-size:12px">Agent নির্বাচন করুন।</p></div></div></div>`;
    main.appendChild(section);
    const sel=document.getElementById('orders-agent-select');
    sel.addEventListener('change',function(){
      const id=sel.value;
      if(id && typeof window.selectAgent==='function') window.selectAgent(id);
      load();
    });
    document.getElementById('order-search').addEventListener('input',render);
    document.getElementById('order-status-filter').addEventListener('change',render);
    syncAgentOptions();
    return true;
  }

  async function load(){
    syncAgentOptions();
    const aid=document.getElementById('orders-agent-select')?.value||getActiveId()||'';
    const list=document.getElementById('smart-order-list');
    if(!aid||!list){if(list)list.innerHTML='<p style="color:var(--text3);font-size:12px">Agent নির্বাচন করুন।</p>';stopNotifications();return;}
    list.innerHTML='<p style="color:var(--text3);font-size:12px">লোড হচ্ছে...</p>';
    try{
      const r=await fetch(`${API}/orders/dashboard/${encodeURIComponent(aid)}`,{cache:'no-store'});
      const d=await r.json();
      if(!d.success)throw Error(d.error||'লোড করা যায়নি');
      orders=d.orders||[];
      if(orders.length){lastOrderId=Math.max(...orders.map(o=>Number(o.id)||0));}
      renderSummary(d.summary||{});
      render();
      startNotifications(aid);
    }catch(e){list.innerHTML=`<p style="color:var(--red);font-size:12px">লোড করা যায়নি: ${esc(e.message)}</p>`;}
  }

  function renderSummary(s){
    const el=document.getElementById('order-summary');if(!el)return;
    el.innerHTML=statuses.map(x=>`<div style="padding:10px;border:1px solid var(--border);border-radius:8px"><div style="font-size:11px;color:var(--text3)">${labels[x]}</div><div style="font-size:20px;font-weight:800">${Number(s[x]||0)}</div></div>`).join('');
    const t=document.getElementById('orders-total');if(t)t.textContent=String(s.total||0);
  }

  function render(){
    const q=(document.getElementById('order-search')?.value||'').toLowerCase().trim();
    const f=document.getElementById('order-status-filter')?.value||'all';
    const rows=orders.filter(o=>(f==='all'||String(o.status||'new')===f)&&(!q||[o.customer_name,o.customer_phone,o.customer_address,o.order_details,o.chat_id].some(v=>String(v||'').toLowerCase().includes(q))));
    const list=document.getElementById('smart-order-list');if(!list)return;
    if(!rows.length){list.innerHTML='<p style="color:var(--text3);font-size:12px;padding:10px 0">কোনো Order পাওয়া যায়নি।</p>';return;}
    list.innerHTML=rows.map(o=>{const st=String(o.status||'new');return `<div class="agent-row" style="display:block;margin-bottom:10px;padding:14px"><div style="display:flex;justify-content:space-between;gap:10px"><div style="flex:1"><div style="font-weight:700;font-size:13px">#${esc(o.id)} · ${esc(o.customer_name||'নাম নেই')}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(o.customer_phone||'ফোন নেই')} · ${esc(o.chat_id||'')}</div><div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.6">${esc(o.order_details||'Order details নেই')}<br>${o.customer_address?`📍 ${esc(o.customer_address)}`:''}</div></div><select class="order-status" data-id="${esc(o.id)}"><option value="new">New</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div></div>`}).join('');
    rows.forEach(o=>{const x=list.querySelector(`.order-status[data-id="${CSS.escape(String(o.id))}"]`);if(x)x.value=stSafe(o.status);});
    list.querySelectorAll('.order-status').forEach(x=>x.addEventListener('change',()=>updateStatus(x)));
  }

  function stSafe(v){return statuses.includes(String(v||''))?String(v):'new';}

  async function updateStatus(sel){
    const aid=document.getElementById('orders-agent-select')?.value||getActiveId()||'';
    const id=Number(sel.dataset.id),status=sel.value;
    sel.disabled=true;
    try{
      const r=await fetch(API+'/orders/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,agentId:aid,status})});
      const d=await r.json();if(!d.success)throw Error(d.error||'Update failed');
      const o=orders.find(x=>Number(x.id)===id);if(o)o.status=status;
      render();load();
    }catch(e){alert('Status update করা যায়নি: '+e.message);load();}
    finally{sel.disabled=false;}
  }

  function show(){
    if(!mount())return;
    syncAgentOptions();
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.getElementById('section-orders-smart')?.classList.add('active');
    document.getElementById('nav-orders-smart')?.classList.add('active');
    load();
  }

  function stopNotifications(){
    if(notificationTimer){clearInterval(notificationTimer);notificationTimer=null;}
  }

  function startNotifications(aid){
    stopNotifications();
    notificationTimer=setInterval(()=>checkNewOrders(aid),8000);
    checkNewOrders(aid);
  }

  async function checkNewOrders(aid){
    try{
      const url=`${API}/orders/notifications/${encodeURIComponent(aid)}?sinceId=${encodeURIComponent(lastOrderId)}`;
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      if(!d.success||!Array.isArray(d.orders)||!d.orders.length)return;
      const incoming=d.orders.sort((a,b)=>Number(a.id)-Number(b.id));
      incoming.forEach(o=>{
        if(!orders.some(x=>Number(x.id)===Number(o.id))){
          orders.unshift(o);
          notifyNewOrder(o);
        }
        lastOrderId=Math.max(lastOrderId,Number(o.id)||0);
      });
      renderSummaryFromOrders();
      render();
      showNewOrdersBadge(incoming.length);
    }catch(e){/* notification polling is best-effort */}
  }

  function renderSummaryFromOrders(){
    const s={new:0,confirmed:0,processing:0,delivered:0,cancelled:0,total:orders.length};
    orders.forEach(o=>{const st=stSafe(o.status);s[st]++;});
    renderSummary(s);
  }

  function showNewOrdersBadge(count){
    const b=document.getElementById('new-orders-badge');
    if(!b)return;
    b.textContent=`${count} new`;
    b.style.display='inline-block';
    clearTimeout(b.__hideTimer);
    b.__hideTimer=setTimeout(()=>{b.style.display='none';},12000);
  }

  function notifyNewOrder(o){
    const title='🔔 নতুন অর্ডার এসেছে';
    const text=`${o.customer_name||'Customer'} · ${o.customer_phone||'ফোন নেই'}\n${o.order_details||'Order details নেই'}`;
    try{
      if('Notification' in window && Notification.permission==='granted')new Notification(title,{body:text});
    }catch(e){}
    const old=document.getElementById('new-order-toast');
    if(old)old.remove();
    const toast=document.createElement('div');
    toast.id='new-order-toast';
    toast.style.cssText='position:fixed;right:20px;bottom:20px;z-index:99999;max-width:360px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;background:var(--card,#111);box-shadow:0 12px 35px rgba(0,0,0,.35);cursor:pointer';
    toast.innerHTML=`<div style="font-weight:800;margin-bottom:6px">🔔 নতুন অর্ডার</div><div style="font-size:12px;line-height:1.5">${esc(o.customer_name||'নাম নেই')} · ${esc(o.customer_phone||'ফোন নেই')}<br>${esc(o.order_details||'Order details নেই')}</div>`;
    toast.onclick=()=>toast.remove();
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),12000);
  }

  const oldSelect=window.selectAgent;
  if(typeof oldSelect==='function'){
    window.selectAgent=function(id){
      const r=oldSelect.apply(this,arguments);
      setTimeout(()=>{syncAgentOptions();const s=document.getElementById('orders-agent-select');if(s){s.value=id;load();}},0);
      return r;
    };
  }

  const timer=setInterval(()=>{if(mount())syncAgentOptions();},500);
})();
