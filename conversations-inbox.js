// Conversations Inbox UI — authenticated Page-aware Facebook/Telegram history.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  let conversations=[];
  let selected=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const toast=(m,t)=>typeof window.toast==='function'?window.toast(m,t):alert(m);
  function agent(){return window.activeId||'';}
  function currentAgent(){
    return (Array.isArray(window.agents)?window.agents:[]).find(a=>String(a.id)===String(agent()))||{};
  }
  async function authHeaders(){
    const session=await window.akexaSupabase?.auth?.getSession?.();
    const token=session?.data?.session?.access_token||'';
    if(!token)throw new Error('Login session পাওয়া যায়নি। আবার Login করুন।');
    return {Authorization:'Bearer '+token};
  }
  function pageId(x){return String(x?.page_id||'');}
  function conversationKey(x){return [x?.platform,x?.page_id,x?.chat_id].join('|');}
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
    const list=document.getElementById('conv-list'),count=document.getElementById('conv-count');if(!list)return;
    count.textContent=conversations.length;
    if(!conversations.length){list.innerHTML='<p style="color:var(--text3);font-size:12px;padding:12px 0">এই Agent-এর কোনো conversation পাওয়া যায়নি।</p>';return;}
    list.innerHTML=conversations.map((x,i)=>`<div class="agent-row" style="cursor:pointer" onclick="window.openConversation(${i})"><div style="min-width:0;flex:1"><div style="font-weight:700;font-size:13px">${x.platform==='facebook'?'📘':'✈️'} ${esc(x.chat_id)}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(x.last_message||'')} </div><div style="font-size:10px;color:var(--text3);margin-top:4px">${x.page_id?'Page: '+esc(x.page_id):esc(x.platform)}</div></div><div style="text-align:right;margin-left:10px"><div class="badge badge-purple">${x.message_count} msgs</div>${x.platform==='facebook'?'<div class="badge '+(x.mode==='manual'?'badge-yellow':'badge-green')+'" style="margin-top:5px">'+(x.mode==='manual'?'Manual':'AI Mode')+'</div>':''}</div></div>`).join('');
  }
  window.loadConversations=async function(){
    const aid=agent();if(!aid)return toast('আগে একটি Agent নির্বাচন করুন','error');
    const q=encodeURIComponent(document.getElementById('conv-search')?.value.trim()||'');
    const p=encodeURIComponent(document.getElementById('conv-platform')?.value||'');
    const list=document.getElementById('conv-list');if(list)list.innerHTML='<p style="color:var(--text3);font-size:12px">লোড হচ্ছে...</p>';
    try{
      const headers=await authHeaders();
      const r=await fetch(`${API}/conversations/${encodeURIComponent(aid)}?q=${q}&platform=${p}`,{headers,cache:'no-store'});
      const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'লোড করা যায়নি');
      conversations=d.conversations||[];render();
    }catch(e){if(list)list.innerHTML=`<p style="color:var(--red);font-size:12px">${esc(e.message)}</p>`;}
  };
  function renderDetail(x,messages){
    const detail=document.getElementById('conv-detail');if(!detail)return;
    const history=(messages||[]).map(m=>`<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin:8px 0"><div class="bubble ${m.role==='user'?'user':'bot'}" style="max-width:82%"><div style="font-size:10px;opacity:.65;margin-bottom:4px">${m.role==='user'?'Customer':'Agent'} · ${esc(new Date(m.created_at).toLocaleString())}</div>${esc(m.content)}</div></div>`).join('')||'<p style="color:var(--text3)">কোনো মেসেজ নেই।</p>';
    let controls='';
    if(x.platform==='facebook'){
      if(!pageId(x)){
        controls='<div class="info-box">এই পুরোনো conversation-এর Page ID সংরক্ষিত নেই। নতুন Messenger message এলে AI/Manual control ব্যবহার করা যাবে।</div>';
      }else{
        const manual=x.mode==='manual';
        controls=`<div style="padding:13px;border:1px solid var(--border);border-radius:12px;margin:12px 0;background:var(--surface2)"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div style="font-weight:700">${manual?'🧑‍💼 Manual Mode':'🤖 AI Mode'}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${manual?'AI উত্তর বন্ধ। আপনি নিজে Messenger-এ উত্তর দিন।':'AI স্বয়ংক্রিয়ভাবে উত্তর দেবে।'}</div></div><button class="btn ${manual?'btn-success':'btn-ghost'} btn-sm" onclick="window.setConversationMode('${manual?'ai':'manual'}')">${manual?'🤖 AI চালু করুন':'✋ Manual Reply চালু করুন'}</button></div></div>`;
        if(manual)controls+=`<div style="margin-top:10px"><label style="display:block;font-size:12px;color:var(--text2);margin-bottom:6px">আপনার উত্তর</label><textarea id="conv-manual-message" rows="3" placeholder="গ্রাহককে Messenger-এ উত্তর লিখুন..." style="width:100%;min-height:80px"></textarea><div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn btn-primary" onclick="window.sendManualReply()">➤ Messenger-এ পাঠান</button></div><div class="helper">Meta-এর Messenger messaging window ও platform policy অনুযায়ী উত্তর পাঠানো যাবে।</div></div>`;
      }
    }
    detail.innerHTML=controls+`<div id="conv-message-history" style="margin-top:12px">${history}</div>`;
    const box=document.getElementById('conv-message-history');if(box)box.scrollTop=box.scrollHeight;
  }
  window.openConversation=async function(i){
    const x=conversations[i];if(!x)return;selected=x;
    const card=document.getElementById('conv-detail-card'),detail=document.getElementById('conv-detail');
    card.style.display='block';detail.innerHTML='<p style="color:var(--text3)">মেসেজ লোড হচ্ছে...</p>';card.scrollIntoView({behavior:'smooth'});
    try{
      const headers=await authHeaders();
      const query=x.page_id?'?pageId='+encodeURIComponent(x.page_id):'';
      const r=await fetch(`${API}/conversations/${encodeURIComponent(agent())}/${encodeURIComponent(x.platform)}/${encodeURIComponent(x.chat_id)}${query}`,{headers,cache:'no-store'});
      const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'লোড করা যায়নি');
      renderDetail(x,d.messages||[]);
    }catch(e){detail.innerHTML=`<p style="color:var(--red)">${esc(e.message)}</p>`;}
  };
  window.setConversationMode=async function(mode){
    if(!selected||selected.platform!=='facebook'||!pageId(selected))return;
    try{
      const headers=await authHeaders();
      const res=await fetch(API+'/facebook/conversation-mode',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({agentId:agent(),pageId:pageId(selected),chatId:selected.chat_id,mode,marketplaceAgentId:currentAgent().marketplaceAgentId||currentAgent().marketplace_agent_id||null})});
      const data=await res.json();if(!res.ok||!data.success)throw Error(data.error||'Mode পরিবর্তন করা যায়নি');
      selected.mode=data.mode;toast(data.mode==='manual'?'এই conversation-এ AI বন্ধ হয়েছে।':'এই conversation-এ AI আবার চালু হয়েছে।','success');
      renderDetail(selected,[]);
      await window.loadConversations();
      const idx=conversations.findIndex(x=>conversationKey(x)===conversationKey(selected));if(idx>=0)selected=conversations[idx];
    }catch(e){toast(e.message,'error');}
  };
  window.sendManualReply=async function(){
    if(!selected||selected.platform!=='facebook'||selected.mode!=='manual')return;
    const input=document.getElementById('conv-manual-message'),message=String(input?.value||'').trim();if(!message)return toast('উত্তর লিখুন','error');
    try{
      const headers=await authHeaders();
      const res=await fetch(API+'/facebook/manual-reply',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({agentId:agent(),pageId:pageId(selected),chatId:selected.chat_id,message,marketplaceAgentId:currentAgent().marketplaceAgentId||currentAgent().marketplace_agent_id||null})});
      const data=await res.json();if(!res.ok||!data.success)throw Error(data.error||'উত্তর পাঠানো যায়নি');
      input.value='';toast('Messenger-এ উত্তর পাঠানো হয়েছে।','success');
      const idx=conversations.findIndex(x=>conversationKey(x)===conversationKey(selected));if(idx>=0)await window.openConversation(idx);
      await window.loadConversations();
    }catch(e){toast(e.message,'error');}
  };
  window.closeConversation=()=>{const c=document.getElementById('conv-detail-card');if(c)c.style.display='none';selected=null;};
  window.initConversationsInbox=function(){if(shell())window.loadConversations();};
})();
