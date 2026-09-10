// Conversations Inbox UI — agent-scoped Telegram/Facebook history.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  let conversations=[];
  let selected=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const toast=(m,t)=>typeof window.toast==='function'?window.toast(m,t):alert(m);
  function agent(){return window.activeId||'';}
  function shell(){
    const s=document.getElementById('section-conversations'); if(!s)return false;
    s.innerHTML=`<div class="card"><div class="card-header"><div class="card-title">💬 Conversations Inbox</div><span id="conv-count" class="badge badge-purple">0</span></div><div class="card-body">
      <div style="display:flex;gap:10px;flex-wrap:wrap"><input id="conv-search" placeholder="Customer Chat ID খুঁজুন..." style="flex:1;min-width:180px"><select id="conv-platform" style="max-width:180px"><option value="">সব Platform</option><option value="facebook">Facebook</option><option value="telegram">Telegram</option></select><button class="btn btn-primary" onclick="window.loadConversations()">↻ Refresh</button></div>
      <div id="conv-list" style="margin-top:14px"></div></div></div>
      <div class="card" id="conv-detail-card" style="display:none"><div class="card-header"><div class="card-title">🗨️ Conversation</div><button class="btn btn-ghost btn-sm" onclick="window.closeConversation()">✕ Close</button></div><div class="card-body"><div id="conv-detail"></div></div></div>`;
    document.getElementById('conv-search').addEventListener('input',loadConversations);
    document.getElementById('conv-platform').addEventListener('change',loadConversations);
    return true;
  }
  function render(){
    const list=document.getElementById('conv-list'), count=document.getElementById('conv-count'); if(!list)return;
    count.textContent=conversations.length;
    if(!conversations.length){list.innerHTML='<p style="color:var(--text3);font-size:12px;padding:12px 0">এই Agent-এর কোনো conversation পাওয়া যায়নি।</p>';return;}
    list.innerHTML=conversations.map((x,i)=>`<div class="agent-row" style="cursor:pointer" onclick="window.openConversation(${i})"><div style="min-width:0;flex:1"><div style="font-weight:700;font-size:13px">${x.platform==='facebook'?'📘':'✈️'} ${esc(x.chat_id)}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(x.last_message||'')} </div></div><div style="text-align:right;margin-left:10px"><div class="badge badge-green">${x.message_count} msgs</div><div style="font-size:10px;color:var(--text3);margin-top:5px">${esc(x.platform)}</div></div></div>`).join('');
  }
  window.loadConversations=async function(){
    const aid=agent(); if(!aid)return toast('আগে একটি Agent নির্বাচন করুন','error');
    const q=encodeURIComponent(document.getElementById('conv-search')?.value.trim()||''); const p=encodeURIComponent(document.getElementById('conv-platform')?.value||'');
    const list=document.getElementById('conv-list'); if(list)list.innerHTML='<p style="color:var(--text3);font-size:12px">লোড হচ্ছে...</p>';
    try{const r=await fetch(`${API}/conversations/${encodeURIComponent(aid)}?q=${q}&platform=${p}`);const d=await r.json();if(!d.success)throw Error(d.error||'লোড করা যায়নি');conversations=d.conversations||[];render();}catch(e){if(list)list.innerHTML=`<p style="color:var(--red);font-size:12px">${esc(e.message)}</p>`;}
  };
  window.openConversation=async function(i){
    const x=conversations[i]; if(!x)return; selected=x; const card=document.getElementById('conv-detail-card'),detail=document.getElementById('conv-detail');card.style.display='block';detail.innerHTML='<p style="color:var(--text3)">মেসেজ লোড হচ্ছে...</p>';card.scrollIntoView({behavior:'smooth'});
    try{const r=await fetch(`${API}/conversations/${encodeURIComponent(agent())}/${encodeURIComponent(x.platform)}/${encodeURIComponent(x.chat_id)}`);const d=await r.json();if(!d.success)throw Error(d.error||'লোড করা যায়নি');detail.innerHTML=(d.messages||[]).map(m=>`<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin:8px 0"><div class="bubble ${m.role==='user'?'user':'bot'}" style="max-width:82%"><div style="font-size:10px;opacity:.65;margin-bottom:4px">${m.role==='user'?'Customer':'Agent'} · ${esc(new Date(m.created_at).toLocaleString())}</div>${esc(m.content)}</div></div>`).join('')||'<p style="color:var(--text3)">কোনো মেসেজ নেই।</p>';}catch(e){detail.innerHTML=`<p style="color:var(--red)">${esc(e.message)}</p>`;}
  };
  window.closeConversation=()=>{const c=document.getElementById('conv-detail-card');if(c)c.style.display='none';};
  window.initConversationsInbox=function(){if(shell())window.loadConversations();};
})();
