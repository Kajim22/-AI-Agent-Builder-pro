// AKEXA Messenger Inbox UI — uses the existing authenticated backend APIs.
(function(){
 const API='https://kajim-ai-agent-backend.onrender.com';
 let pages=[],conversations=[],selected=null,selectedPage='';
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const aid=()=>String((typeof activeId!=='undefined'?activeId:window.activeId)||'');
 const toast=(m,t)=>typeof window.toast==='function'?window.toast(m,t):alert(m);
 async function authHeaders(json=false){
  const session=await window.akexaSupabase?.auth?.getSession?.();
  const token=session?.data?.session?.access_token;
  if(!token)throw Error('Login session পাওয়া যায়নি। আবার Login করুন।');
  return {Authorization:'Bearer '+token,...(json?{'Content-Type':'application/json'}:{})};
 }
 function renderShell(){
  const root=$('section-conversations');if(!root)return;
  root.innerHTML=`<div class="card"><div class="card-header"><div class="card-title">💬 Messenger Inbox</div><button class="btn btn-ghost btn-sm" onclick="window.initConversationsInbox()">↻ Refresh</button></div><div class="card-body"><div style="display:flex;gap:10px;flex-wrap:wrap"><select id="mi-page" style="flex:1;min-width:180px" onchange="window.miPageChanged()"><option value="">Facebook Page নির্বাচন করুন</option></select><input id="mi-search" placeholder="Customer ID খুঁজুন" style="flex:1;min-width:150px"><button class="btn btn-primary" onclick="window.miLoad()">খুঁজুন</button></div><div id="mi-list" style="margin-top:12px"></div></div></div><div class="card" id="mi-detail-card" style="display:none"><div class="card-header"><div class="card-title" id="mi-chat-title">Conversation</div><button class="btn btn-ghost btn-sm" onclick="document.getElementById('mi-detail-card').style.display='none'">✕</button></div><div class="card-body"><div id="mi-controls"></div><div id="mi-history" style="max-height:420px;overflow:auto;margin:12px 0"></div><div id="mi-compose"></div></div></div>`;
 }
 async function loadPages(){
  const h=await authHeaders(),r=await fetch(API+'/facebook/pages/'+encodeURIComponent(aid()),{headers:h,cache:'no-store'}),d=await r.json();
  if(!r.ok||!d.success)throw Error(d.error||'Facebook Page list load failed');
  pages=d.pages||[];const sel=$('mi-page');sel.innerHTML='<option value="">Facebook Page নির্বাচন করুন</option>'+pages.map(p=>`<option value="${esc(p.page_id)}">${esc(p.page_id)}</option>`).join('');
  if(selectedPage&&pages.some(p=>String(p.page_id)===String(selectedPage)))sel.value=selectedPage;
  else if(pages.length===1){selectedPage=String(pages[0].page_id);sel.value=selectedPage;}
 }
 window.miPageChanged=()=>{selectedPage=$('mi-page').value;window.miLoad();};
 window.miLoad=async()=>{
  if(!aid())return toast('আগে একটি Agent নির্বাচন করুন','error');
  if(!selectedPage)return toast('Facebook Page নির্বাচন করুন','error');
  const el=$('mi-list');el.innerHTML='<p>লোড হচ্ছে...</p>';
  try{
   const h=await authHeaders(),q=encodeURIComponent($('mi-search').value.trim());
   const r=await fetch(API+'/conversations/'+encodeURIComponent(aid())+'?platform=facebook&pageId='+encodeURIComponent(selectedPage)+'&q='+q,{headers:h,cache:'no-store'});
   const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'Inbox load failed');
   conversations=(d.conversations||[]).filter(x=>!x.page_id||String(x.page_id)===String(selectedPage));renderList();
  }catch(e){el.innerHTML='<p style="color:var(--red)">'+esc(e.message)+'</p>';}
 };
 function renderList(){
  const el=$('mi-list');if(!conversations.length){el.innerHTML='<p style="color:var(--text3)">এই Page-এ কোনো Conversation পাওয়া যায়নি।</p>';return;}
  el.innerHTML=conversations.map((x,i)=>`<div class="agent-row" style="cursor:pointer" onclick="window.miOpen(${i})"><div style="flex:1;min-width:0"><b>${esc(x.chat_id)}</b><div style="font-size:11px;color:var(--text3);margin-top:4px">${esc(x.last_message||'')}</div></div><span class="badge ${x.mode==='manual'?'badge-yellow':'badge-green'}">${x.mode==='manual'?'Manual':'AI'}</span></div>`).join('');
 }
 window.miOpen=async i=>{
  selected=conversations[i];if(!selected)return;
  $('mi-detail-card').style.display='block';$('mi-chat-title').textContent='Messenger · '+selected.chat_id;
  try{
   const h=await authHeaders();
   const [mr,modeR]=await Promise.all([
    fetch(API+'/conversations/'+encodeURIComponent(aid())+'/facebook/'+encodeURIComponent(selected.chat_id)+'?pageId='+encodeURIComponent(selectedPage),{headers:h,cache:'no-store'}),
    fetch(API+'/facebook/conversation-mode/'+encodeURIComponent(aid())+'/'+encodeURIComponent(selectedPage)+'/'+encodeURIComponent(selected.chat_id),{headers:h,cache:'no-store'})
   ]);
   const md=await mr.json(),mode=await modeR.json();
   if(!mr.ok||!md.success)throw Error(md.error||'Messages load failed');
   if(!modeR.ok||!mode.success)throw Error(mode.error||'Conversation mode load failed');
   selected.mode=mode.mode;renderDetail(md.messages||[]);$('mi-detail-card').scrollIntoView({behavior:'smooth'});
  }catch(e){$('mi-history').textContent=e.message;}
 };
 function renderDetail(messages){
  const manual=selected.mode==='manual';
  $('mi-controls').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;border:1px solid var(--border);border-radius:10px"><b>${manual?'🧑‍💼 Manual Reply Mode':'🤖 AI Reply Mode'}</b><button class="btn btn-primary btn-sm" onclick="window.miToggleMode()">${manual?'AI চালু করুন':'Manual Reply চালু করুন'}</button></div>`;
  $('mi-history').innerHTML=messages.map(m=>`<div style="display:flex;justify-content:${m.role==='user'?'flex-end':'flex-start'};margin:8px 0"><div style="padding:10px 12px;border-radius:12px;max-width:85%;background:var(--surface2);border:1px solid var(--border)"><div style="font-size:10px;color:var(--text3);margin-bottom:4px">${m.role==='user'?'Customer':m.role==='human'?'You':'AI Agent'}</div><div style="white-space:pre-wrap">${esc(m.content)}</div></div></div>`).join('')||'<p>কোনো মেসেজ নেই।</p>';
  $('mi-compose').innerHTML=manual?`<textarea id="mi-message" rows="3" style="width:100%" maxlength="2000" placeholder="গ্রাহককে Messenger-এ উত্তর লিখুন..."></textarea><div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn btn-primary" onclick="window.miSend()">➤ Messenger-এ পাঠান</button></div>`:'<p class="helper">ম্যানুয়ালি উত্তর দিতে চাইলে প্রথমে Manual Reply চালু করুন।';
 }
 window.miToggleMode=async()=>{
  if(!selected)return;
  const mode=selected.mode==='manual'?'ai':'manual';
  try{
   const h=await authHeaders(true),r=await fetch(API+'/facebook/conversation-mode',{method:'PUT',headers:h,body:JSON.stringify({agentId:aid(),pageId:selectedPage,chatId:selected.chat_id,mode})}),d=await r.json();
   if(!r.ok||!d.success)throw Error(d.error||'Mode update failed');
   selected.mode=mode;toast(mode==='manual'?'Manual Reply চালু হয়েছে':'AI Reply আবার চালু হয়েছে','success');
   const i=conversations.findIndex(x=>x.chat_id===selected.chat_id);if(i>=0){conversations[i].mode=mode;renderList();}await window.miOpen(i);
  }catch(e){toast(e.message,'error');}
 };
 window.miSend=async()=>{
  const message=$('mi-message')?.value.trim();if(!message)return toast('উত্তর লিখুন','error');
  try{
   const h=await authHeaders(true),r=await fetch(API+'/facebook/manual-reply',{method:'POST',headers:h,body:JSON.stringify({agentId:aid(),pageId:selectedPage,chatId:selected.chat_id,message})}),d=await r.json();
   if(!r.ok||!d.success)throw Error(d.error||'Messenger reply পাঠানো যায়নি');
   $('mi-message').value='';toast('Messenger-এ উত্তর পাঠানো হয়েছে','success');await window.miOpen(conversations.findIndex(x=>x.chat_id===selected.chat_id));await window.miLoad();
  }catch(e){toast(e.message,'error');}
 };
 window.initConversationsInbox=async()=>{
  renderShell();if(!aid())return;
  try{await loadPages();await window.miLoad();}
  catch(e){$('mi-list').innerHTML='<p style="color:var(--red)">'+esc(e.message)+'</p>';}
 };
})();