// New-order notification UI for AgentHub Pro.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  let timer=null;
  let lastSeenId=0;
  let initialized=false;
  let unread=0;

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function mount(){
    if(document.getElementById('order-notification-bell')) return true;
    if(!document.body) return false;
    const style=document.createElement('style');
    style.id='order-notification-style';
    style.textContent=`#order-notification-bell{position:fixed;right:18px;top:18px;z-index:99999;border:1px solid rgba(255,255,255,.12);background:#11111b;color:#fff;border-radius:12px;padding:10px 13px;cursor:pointer;font-size:18px;box-shadow:0 8px 28px rgba(0,0,0,.28)}#order-notification-badge{display:none;position:absolute;right:-5px;top:-5px;background:#eab308;color:#111;font:bold 10px Arial;border-radius:999px;padding:3px 6px}.on-panel{position:fixed;right:18px;top:62px;width:min(360px,calc(100vw - 36px));max-height:70vh;overflow:auto;z-index:99998;background:#10101a;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.38);display:none}.on-head{padding:13px 15px;border-bottom:1px solid rgba(255,255,255,.08);font-weight:700}.on-item{padding:13px 15px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;line-height:1.6}.on-item:last-child{border-bottom:0}.on-empty{padding:20px;color:#999;font-size:12px}`;
    document.head.appendChild(style);

    const bell=document.createElement('button');
    bell.id='order-notification-bell';
    bell.setAttribute('aria-label','New orders');
    bell.innerHTML='🔔<span id="order-notification-badge">0</span>';
    document.body.appendChild(bell);
    const panel=document.createElement('div');
    panel.id='order-notification-panel';
    panel.className='on-panel';
    panel.innerHTML='<div class="on-head">🛒 নতুন অর্ডার</div><div id="order-notification-list"><div class="on-empty">কোনো নতুন অর্ডার নেই।</div></div>';
    document.body.appendChild(panel);
    bell.onclick=()=>{panel.style.display=panel.style.display==='block'?'none':'block';unread=0;updateBadge();};
    return true;
  }

  function updateBadge(){
    const b=document.getElementById('order-notification-badge');
    if(!b)return;
    b.textContent=unread>99?'99+':String(unread);
    b.style.display=unread?'block':'none';
  }

  function addOrders(rows){
    const list=document.getElementById('order-notification-list');
    if(!list||!rows.length)return;
    const html=rows.slice().reverse().map(o=>`<div class="on-item"><b>🛒 অর্ডার #${esc(o.id)}</b><br>👤 ${esc(o.customerName||'নাম নেই')}<br>📞 ${esc(o.customerPhone||'—')}<br>📍 ${esc(o.customerAddress||'—')}<br>📦 ${esc(o.orderDetails||'—')}</div>`).join('');
    list.insertAdjacentHTML('afterbegin',html);
    unread+=rows.length;
    updateBadge();
    if('Notification' in window && Notification.permission==='granted') new Notification('নতুন অর্ডার এসেছে', {body:`${rows.length}টি নতুন অর্ডার পাওয়া গেছে`});
  }

  async function poll(){
    const aid=window.activeId;
    if(!aid)return;
    try{
      const r=await fetch(`${API}/orders/notifications/${encodeURIComponent(aid)}?sinceId=${lastSeenId}`,{cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      const rows=Array.isArray(d.orders)?d.orders:[];
      if(!initialized){
        if(rows.length)lastSeenId=Math.max(...rows.map(o=>Number(o.id)||0));
        initialized=true;
        return;
      }
      if(rows.length){
        lastSeenId=Math.max(lastSeenId,...rows.map(o=>Number(o.id)||0));
        addOrders(rows);
      }
    }catch(e){console.warn('Order notification poll failed:',e.message)}
  }

  function start(){
    if(timer)clearInterval(timer);
    initialized=false;
    lastSeenId=0;
    poll();
    timer=setInterval(poll,8000);
  }

  const oldSelect=window.selectAgent;
  if(typeof oldSelect==='function') window.selectAgent=function(id){const r=oldSelect.apply(this,arguments);start();return r;};
  if('Notification' in window && Notification.permission==='default'){
    document.addEventListener('click',()=>{Notification.requestPermission().catch(()=>{});},{once:true});
  }
  const ready=setInterval(()=>{if(mount()&&window.activeId){clearInterval(ready);start();}},500);
})();
