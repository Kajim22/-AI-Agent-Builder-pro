// Website Chat Widget Dashboard — additive UI.
(function(){
  const API='https://kajim-ai-agent-backend.onrender.com';
  let mounted=false;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  // app-core uses top-level `let agents`, which is not exposed as window.agents.
  // Read the same browser storage directly so the widget selector sees all agents.
  function getAgents(){
    try{
      const rows=JSON.parse(localStorage.getItem('ah_agents')||'[]');
      return Array.isArray(rows)?rows:[];
    }catch(e){ return []; }
  }

  function getActiveId(){
    const coreSelect=document.getElementById('agent-select');
    return coreSelect?.value||'';
  }

  function syncAgentOptions(){
    const sel=document.getElementById('widget-agent-select');
    if(!sel)return;
    const list=getAgents();
    const current=sel.value||getActiveId();
    const signature=list.map(a=>String(a.id)+':'+String(a.name||'')).join('|');
    if(sel.dataset.signature!==signature){
      sel.innerHTML='<option value="">— এজেন্ট বেছে নিন —</option>';
      list.forEach(a=>{
        const o=document.createElement('option');
        o.value=a.id;
        o.textContent=a.name||a.id;
        sel.appendChild(o);
      });
      sel.dataset.signature=signature;
    }
    if(current && list.some(a=>String(a.id)===String(current))) sel.value=current;
    render();
  }

  function mount(){
    if(mounted || document.getElementById('nav-website-widget')) return true;
    const nav=document.querySelector('.sidebar-nav'),main=document.querySelector('.content');
    if(!nav||!main)return false;
    mounted=true;

    const item=document.createElement('div');
    item.className='nav-item'; item.id='nav-website-widget';
    item.innerHTML='<span class="nav-icon">💬</span> Website Widget';
    item.onclick=show;
    nav.appendChild(item);

    const section=document.createElement('div');
    section.className='section'; section.id='section-website-widget';
    section.innerHTML=`
      <div class="card">
        <div class="card-header"><div class="card-title"><span class="step-badge">W</span> Website Chat Widget</div><span class="badge badge-green">Ready</span></div>
        <div class="card-body">
          <div class="info-box"><strong>আপনার website-এ AI Agent বসান</strong><br><span style="color:var(--text2)">একটি Agent নির্বাচন করুন, তারপর নিচের Embed Code কপি করে আপনার website-এর HTML-এ বসিয়ে দিন।</span></div>
          <div class="field"><label>Agent নির্বাচন করুন</label><select id="widget-agent-select"></select></div>
          <div id="widget-preview-box" class="share-box" style="display:none;flex-direction:column;align-items:stretch;gap:8px">
            <div style="font-size:12px;color:var(--text2);font-weight:600">Embed Code</div>
            <textarea id="widget-embed-code" readonly style="min-height:95px;font-family:'JetBrains Mono',monospace;font-size:11px"></textarea>
            <div class="btn-group"><button class="btn btn-primary" id="widget-copy-btn">📋 Copy Embed Code</button><button class="btn btn-ghost" id="widget-open-btn">🔗 Open Widget</button></div>
          </div>
          <div id="widget-status" class="helper">Agent নির্বাচন করলে embed code তৈরি হবে।</div>
        </div>
      </div>`;
    main.appendChild(section);

    const sel=section.querySelector('#widget-agent-select');
    sel.addEventListener('change',function(){
      render();
      const core=document.getElementById('agent-select');
      if(core && core.value!==sel.value && typeof window.selectAgent==='function') window.selectAgent(sel.value);
    });
    section.querySelector('#widget-copy-btn').addEventListener('click',copyCode);
    section.querySelector('#widget-open-btn').addEventListener('click',openWidget);
    syncAgentOptions();
    return true;
  }

  function codeFor(id){
    const base=location.origin+location.pathname.replace(/\/[^/]*$/,'/');
    const src=base+'widget.js';
    return `<script src="${src}" data-agent-id="${esc(id)}"></script>`;
  }

  function render(){
    const sel=document.getElementById('widget-agent-select'),box=document.getElementById('widget-preview-box'),code=document.getElementById('widget-embed-code'),status=document.getElementById('widget-status');
    if(!sel||!code)return;
    const id=sel.value||getActiveId()||'';
    if(id && sel.value!==id)sel.value=id;
    if(!id){box.style.display='none';status.textContent='প্রথমে একটি Agent তৈরি/নির্বাচন করুন।';return;}
    const c=codeFor(id);box.style.display='flex';code.value=c;status.textContent='এই code-টি website-এর </body> এর ঠিক আগে বসাতে পারেন।';
  }

  async function copyCode(){
    const code=document.getElementById('widget-embed-code')?.value;if(!code)return;
    try{await navigator.clipboard.writeText(code);if(typeof window.toast==='function')window.toast('✅ Embed Code কপি হয়েছে','success');}
    catch(e){const el=document.getElementById('widget-embed-code');el.select();document.execCommand('copy');if(typeof window.toast==='function')window.toast('✅ Embed Code কপি হয়েছে','success');}
  }

  function openWidget(){
    const id=document.getElementById('widget-agent-select')?.value;if(!id)return;
    const base=location.origin+location.pathname.replace(/\/[^/]*$/,'/');
    window.open(base+'widget.html?agent='+encodeURIComponent(id),'_blank');
  }

  function show(){
    if(!mount())return;
    syncAgentOptions();
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.getElementById('section-website-widget')?.classList.add('active');
    document.getElementById('nav-website-widget')?.classList.add('active');
    render();
  }

  // Wait for the iframe UI, then keep the selector synchronized with Agent Builder.
  const timer=setInterval(()=>{
    if(mount())syncAgentOptions();
    if(mounted && document.getElementById('agent-select'))syncAgentOptions();
  },500);

  // Preserve the existing Agent Builder selection behavior and mirror it here.
  const oldSelect=window.selectAgent;
  if(typeof oldSelect==='function'){
    window.selectAgent=function(id){
      const r=oldSelect.apply(this,arguments);
      setTimeout(()=>{syncAgentOptions();const s=document.getElementById('widget-agent-select');if(s){s.value=id;render();}},0);
      return r;
    };
  }

  // Preserve the original showSection for every existing section.
  const oldShow=window.showSection;
  window.showSection=function(n){
    if(n==='website-widget'){show();return;}
    return oldShow?.apply(this,arguments);
  };
})();
