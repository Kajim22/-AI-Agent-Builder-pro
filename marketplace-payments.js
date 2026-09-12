/* AKEXA AI Bazar — payment transaction layer. */
(function(){
  'use strict';
  const BRAND='AKEXA AI Bazar';
  const SUPABASE_URL='https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY='sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  const PAYMENT_FUNCTION=SUPABASE_URL+'/functions/v1/create-marketplace-payment';
  const GATEWAYS=[
    {id:'sslcommerz',name:'SSLCOMMERZ',note:'Sandbox integration প্রস্তুত হলে checkout চালু হবে.'},
    {id:'bkash',name:'bKash',note:'Gateway configuration প্রয়োজন.'},
    {id:'nagad',name:'Nagad',note:'Gateway configuration প্রয়োজন.'}
  ];
  let sb=null,ready=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  function load(doc){
    if(sb)return Promise.resolve(sb);if(ready)return ready;
    ready=new Promise((resolve,reject)=>{if(window.supabase?.createClient){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb);return;}const s=doc.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js';s.onload=()=>{try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);resolve(sb)}catch(e){reject(e)}};s.onerror=()=>reject(new Error('Supabase SDK could not load'));doc.head.appendChild(s)});return ready;
  }
  function styles(doc){if(doc.getElementById('akexa-payment-style'))return;const s=doc.createElement('style');s.id='akexa-payment-style';s.textContent='.akexa-pay-overlay{position:fixed;inset:0;background:rgba(3,3,9,.84);backdrop-filter:blur(8px);z-index:1100;display:none;overflow:auto;padding:28px}.akexa-pay-overlay.open{display:block}.akexa-pay-box{max-width:900px;margin:0 auto;background:#0f0f1a;border:1px solid #2a2a40;border-radius:16px;overflow:hidden}.akexa-pay-head{padding:22px;border-bottom:1px solid #2a2a40;display:flex;justify-content:space-between;gap:12px}.akexa-pay-body{padding:22px}.akexa-pay-row{padding:15px;border:1px solid #2a2a40;border-radius:12px;margin-bottom:10px;background:#161626}.akexa-pay-row strong{display:block;margin-bottom:5px}.akexa-pay-meta{font-size:11px;color:#9090b0;line-height:1.7}.akexa-pay-status{font-weight:700}.akexa-pay-note{font-size:11px;color:#77778f;margin-top:15px;line-height:1.6}.akexa-pay-empty{text-align:center;padding:35px;color:#9090b0}.akexa-pay-close{background:transparent;border:1px solid #353550;color:#aaa;border-radius:8px;padding:7px 11px;cursor:pointer}.akexa-gateway-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.akexa-gateway-card{padding:14px;border:1px solid #2a2a40;border-radius:12px;background:#141421;cursor:pointer}.akexa-gateway-card:hover{border-color:#66668a}.akexa-gateway-card input{margin-right:8px}.akexa-gateway-note{font-size:11px;color:#8d8da5;margin-top:6px;line-height:1.5}@media(max-width:650px){.akexa-gateway-grid{grid-template-columns:1fr}}';doc.head.appendChild(s)}
  async function dashboard(win,doc){
    styles(doc);const client=await load(doc);const {data:{user}}=await client.auth.getUser();
    if(!user){alert('প্রথমে AKEXA AI Bazar-এ Login করুন।');return;}
    const {data:rows,error}=await client.from('marketplace_payments').select('id,subscription_id,gateway,gateway_reference,amount,status,checkout_url,paid_at,created_at').eq('buyer_user_id',user.id).order('created_at',{ascending:false});
    if(error){alert('Payment history load failed: '+error.message);return;}
    const old=doc.getElementById('akexa-payment-overlay');if(old)old.remove();const overlay=doc.createElement('div');overlay.id='akexa-payment-overlay';overlay.className='akexa-pay-overlay open';
    const items=(rows||[]).map(p=>`<div class="akexa-pay-row"><strong>Payment #${esc(p.gateway_reference)}</strong><div class="akexa-pay-meta">Amount: ৳${esc(Number(p.amount).toFixed(2))}<br>Gateway: ${esc(p.gateway)}<br>Status: <span class="akexa-pay-status">${esc(p.status)}</span><br>Created: ${esc(new Date(p.created_at).toLocaleString())}</div>${p.status==='created'||p.status==='pending'?`<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="window.akexaStartPayment('${esc(p.id)}')">Continue Payment</button>`:''}</div>`).join('');
    overlay.innerHTML=`<div class="akexa-pay-box"><div class="akexa-pay-head"><div><h2 style="margin:0">Payments</h2><p style="margin:6px 0 0;color:#9090b0;font-size:12px">${BRAND} payment transactions</p></div><button class="akexa-pay-close" id="akexa-pay-close">Close</button></div><div class="akexa-pay-body">${items||'<div class="akexa-pay-empty">No payment transactions yet.</div>'}<div class="akexa-pay-note">Payment transaction records are securely stored with RLS. Gateway credentials are not configured yet, so this screen does not charge money.</div></div></div>`;
    doc.body.appendChild(overlay);doc.getElementById('akexa-pay-close').onclick=()=>overlay.remove();
  }
  function gatewayPicker(doc,current){
    return new Promise(resolve=>{
      const old=doc.getElementById('akexa-gateway-overlay');if(old)old.remove();
      const overlay=doc.createElement('div');overlay.id='akexa-gateway-overlay';overlay.className='akexa-pay-overlay open';
      const cards=GATEWAYS.map(g=>`<label class="akexa-gateway-card"><input type="radio" name="akexa-gateway" value="${g.id}" ${current===g.id?'checked':''}><strong>${g.name}</strong><div class="akexa-gateway-note">${g.note}</div></label>`).join('');
      overlay.innerHTML=`<div class="akexa-pay-box"><div class="akexa-pay-head"><div><h2 style="margin:0">Choose Payment Gateway</h2><p style="margin:6px 0 0;color:#9090b0;font-size:12px">Select a supported gateway for this transaction.</p></div><button class="akexa-pay-close" id="akexa-gateway-cancel">Cancel</button></div><div class="akexa-pay-body"><div class="akexa-gateway-grid">${cards}</div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-primary" id="akexa-gateway-continue">Continue</button></div><div class="akexa-pay-note">Gateway checkout is not live yet. Continuing creates a payment record only; no money will be charged until the selected gateway is configured.</div></div></div>`;
      doc.body.appendChild(overlay);
      const close=()=>{overlay.remove();resolve(null)};
      doc.getElementById('akexa-gateway-cancel').onclick=close;
      doc.getElementById('akexa-gateway-continue').onclick=()=>{const selected=doc.querySelector('input[name="akexa-gateway"]:checked');if(!selected){alert('একটি gateway নির্বাচন করুন।');return;}overlay.remove();resolve(selected.value)};
    });
  }
  async function startPayment(paymentId,win,doc){
    const client=await load(doc);const {data:{session}}=await client.auth.getSession();const token=session?.access_token;if(!token){alert('Login session পাওয়া যায়নি।');return;}
    const {data:p,error}=await client.from('marketplace_payments').select('id,subscription_id,status,amount,gateway').eq('id',paymentId).single();
    if(error||!p){alert('Payment not found.');return;}if(!['created','pending'].includes(p.status)){alert('এই payment আর payable নয়। Status: '+p.status);return;}
    const gateway=await gatewayPicker(doc,GATEWAYS.some(g=>g.id===p.gateway)?p.gateway:'sslcommerz');if(!gateway)return;
    const res=await fetch(PAYMENT_FUNCTION,{method:'POST',headers:{Authorization:'Bearer '+token,'apikey':SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({subscription_id:p.subscription_id,gateway})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){alert('Payment setup failed: '+(data.error||'Unknown error'));return;}
    if(data.checkout_url){window.open(data.checkout_url,'_blank','noopener');}else{alert('Payment transaction created.\nReference: '+(data.payment?.gateway_reference||'')+'\n\n'+(data.message||'Gateway checkout এখনও configured নয়—কোনো টাকা কাটা হয়নি।'));}
    dashboard(win,doc);
  }
  function boot(){const frame=document.querySelector('#agenthub-frame');if(!frame)return;frame.addEventListener('load',async()=>{const win=frame.contentWindow,doc=frame.contentDocument;if(!doc)return;styles(doc);await load(doc);if(!doc.getElementById('akexa-pay-nav')){const item=doc.createElement('div');item.id='akexa-pay-nav';item.className='nav-item';item.innerHTML='<span class="nav-icon">💳</span><span>Payments</span>';item.onclick=()=>dashboard(win,doc);const nav=doc.querySelector('.sidebar-nav');if(nav)nav.appendChild(item)}win.akexaStartPayment=id=>startPayment(id,win,doc)});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();