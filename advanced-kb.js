// Advanced Knowledge Base UI — backward-compatible with the existing KB.
(function () {
  const API = 'https://kajim-ai-agent-backend.onrender.com';
  let editingId = null;
  let items = [];

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function agentId() {
    const sel = document.getElementById('knowledge-agent-select');
    return sel?.value || window.activeId || '';
  }

  function section() { return document.getElementById('section-knowledge'); }

  function toastMsg(message, type) {
    if (typeof window.toast === 'function') window.toast(message, type);
    else alert(message);
  }

  function renderShell() {
    const s = section();
    if (!s) return false;
    s.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">📚 Advanced Knowledge Base</div>
          <span class="badge badge-purple">Agent-specific</span>
        </div>
        <div class="card-body">
          <div class="field">
            <label>কোন এজেন্টের জন্য?</label>
            <select id="knowledge-agent-select"></select>
            <div class="helper">এক এজেন্টের Knowledge অন্য এজেন্টের সাথে মিশবে না।</div>
          </div>
          <div class="field">
            <label>🔎 Knowledge Search</label>
            <input id="kb-search" type="search" placeholder="যেমন: দাম, ডেলিভারি, রিটার্ন...">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🌐 Website থেকে Knowledge Import</div>
          <span class="badge badge-blue">HTML / TXT</span>
        </div>
        <div class="card-body">
          <div class="field">
            <label>Website / Public URL</label>
            <input id="kb-import-url" type="url" maxlength="2000" placeholder="https://example.com/about">
            <div class="helper">Public website-এর তথ্য এনে এই Agent-এর Knowledge Base-এ সংরক্ষণ করবে। Private/local URL নেওয়া হবে না।</div>
          </div>
          <button class="btn btn-primary" id="kb-import-btn" onclick="window.importKnowledgeFromUrl()">🌐 Import Website</button>
          <div id="kb-import-status" class="helper"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">➕ নতুন Knowledge যোগ করুন</div>
          <span id="kb-form-mode" class="badge badge-green">নতুন তথ্য</span>
        </div>
        <div class="card-body">
          <div class="field">
            <label>Title (ঐচ্ছিক)</label>
            <input id="kb-title" maxlength="500" placeholder="যেমন: ৮ শিকের ছাতার দাম">
          </div>
          <div class="field">
            <label>FAQ Question (ঐচ্ছিক)</label>
            <input id="kb-question" maxlength="2000" placeholder="যেমন: ৮ শিকের ছাতার দাম কত?">
          </div>
          <div class="field">
            <label>Answer / মূল তথ্য *</label>
            <textarea id="kb-answer" rows="4" placeholder="গ্রাহককে যে তথ্যটি জানাতে হবে..."></textarea>
          </div>
          <div class="field">
            <label>Source URL (ঐচ্ছিক)</label>
            <input id="kb-source-url" maxlength="2000" placeholder="https://example.com/product">
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" id="kb-save-btn" onclick="window.saveAdvancedKnowledge()">💾 সেভ করুন</button>
            <button class="btn btn-ghost" id="kb-cancel-btn" onclick="window.cancelAdvancedKnowledge()" style="display:none">বাতিল</button>
          </div>
          <div class="helper">পুরোনো Knowledge-গুলোও থাকবে। এই নতুন ফর্মটি একই agent_knowledge সিস্টেমে তথ্য সংরক্ষণ করে।</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🗂️ Knowledge তালিকা</div>
          <span id="kb-count" class="badge badge-purple">0</span>
        </div>
        <div class="card-body" style="padding-top:10px">
          <div id="knowledge-list"></div>
        </div>
      </div>`;

    const sel = document.getElementById('knowledge-agent-select');
    (window.agents || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.name;
      sel.appendChild(opt);
    });
    if (window.activeId) sel.value = window.activeId;
    sel.addEventListener('change', () => { editingId = null; resetForm(); loadAdvancedKnowledge(); });
    document.getElementById('kb-search').addEventListener('input', renderList);
    return true;
  }

  function resetForm() {
    ['kb-title', 'kb-question', 'kb-answer', 'kb-source-url'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    editingId = null;
    const mode = document.getElementById('kb-form-mode');
    const save = document.getElementById('kb-save-btn');
    const cancel = document.getElementById('kb-cancel-btn');
    if (mode) { mode.textContent = 'নতুন তথ্য'; mode.className = 'badge badge-green'; }
    if (save) save.textContent = '💾 সেভ করুন';
    if (cancel) cancel.style.display = 'none';
  }

  async function loadAdvancedKnowledge() {
    const id = agentId();
    const list = document.getElementById('knowledge-list');
    if (!id || !list) return;
    list.innerHTML = '<p style="color:var(--text3);font-size:12px;">লোড হচ্ছে...</p>';
    try {
      const res = await fetch(`${API}/knowledge/advanced/search/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'লোড করা যায়নি');
      items = Array.isArray(data.items) ? data.items : [];
      renderList();
    } catch (err) {
      list.innerHTML = `<p style="color:var(--red);font-size:12px;">লোড করা যায়নি: ${esc(err.message)}</p>`;
    }
  }

  function renderList() {
    const list = document.getElementById('knowledge-list');
    const count = document.getElementById('kb-count');
    if (!list) return;
    const q = (document.getElementById('kb-search')?.value || '').trim().toLowerCase();
    const filtered = !q ? items : items.filter(x =>
      [x.title, x.question, x.answer, x.content, x.source_url].some(v => String(v || '').toLowerCase().includes(q))
    );
    if (count) count.textContent = `${filtered.length}/${items.length}`;
    if (!filtered.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:12px;padding:10px 0;">কোনো Knowledge পাওয়া যায়নি।</p>';
      return;
    }
    list.innerHTML = filtered.map(x => `
      <div class="agent-row" style="display:block;margin-bottom:10px;padding:14px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;margin-bottom:5px">${esc(x.title || 'Untitled Knowledge')}</div>
            ${x.question ? `<div style="font-size:12px;color:var(--accent3);margin-bottom:5px">❓ ${esc(x.question)}</div>` : ''}
            <div style="font-size:12px;color:var(--text2);white-space:pre-wrap;line-height:1.6">${esc(x.answer || x.content)}</div>
            ${x.source_url ? `<div style="font-size:11px;color:var(--text3);margin-top:7px;word-break:break-all">🔗 ${esc(x.source_url)}</div>` : ''}
            <div style="font-size:10px;color:var(--text3);margin-top:7px">Source: ${esc(x.source_type || 'text')}</div>
          </div>
          <div class="btn-group" style="flex-shrink:0">
            <button class="btn btn-ghost btn-sm" onclick="window.editAdvancedKnowledge(${Number(x.id)})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteAdvancedKnowledge(${Number(x.id)})">🗑️</button>
          </div>
        </div>
      </div>`).join('');
  }

  window.importKnowledgeFromUrl = async function () {
    const aid = agentId();
    const input = document.getElementById('kb-import-url');
    const btn = document.getElementById('kb-import-btn');
    const status = document.getElementById('kb-import-status');
    const sourceUrl = input?.value.trim();
    if (!aid) return toastMsg('আগে একটি এজেন্ট নির্বাচন করুন', 'error');
    if (!sourceUrl) return toastMsg('Website URL দিন', 'error');
    if (!/^https?:\/\//i.test(sourceUrl)) return toastMsg('http:// বা https:// URL দিন', 'error');
    btn.disabled = true;
    btn.textContent = '⏳ Import হচ্ছে...';
    status.textContent = 'Website থেকে তথ্য আনা হচ্ছে...';
    try {
      const res = await fetch(`${API}/knowledge/advanced/import-url`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ agentId: aid, sourceUrl })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Import করা যায়নি');
      toastMsg(`✅ Website import হয়েছে (${data.characters || 0} characters)`, 'success');
      status.textContent = '✅ Import সম্পন্ন';
      input.value = '';
      await loadAdvancedKnowledge();
    } catch (err) {
      status.textContent = '';
      toastMsg('Import error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🌐 Import Website';
    }
  };

  window.saveAdvancedKnowledge = async function () {
    const id = agentId();
    const answer = document.getElementById('kb-answer')?.value.trim();
    if (!id) return toastMsg('আগে একটি এজেন্ট নির্বাচন করুন', 'error');
    if (!answer) return toastMsg('Answer / মূল তথ্য লিখুন', 'error');
    const payload = {
      agentId: id,
      title: document.getElementById('kb-title').value.trim(),
      question: document.getElementById('kb-question').value.trim(),
      answer,
      sourceType: document.getElementById('kb-source-url').value.trim() ? 'url' : 'text',
      sourceUrl: document.getElementById('kb-source-url').value.trim()
    };
    try {
      const endpoint = editingId ? `${API}/knowledge/advanced/update` : `${API}/knowledge/advanced/add`;
      if (editingId) payload.id = editingId;
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'সেভ করা যায়নি');
      toastMsg(editingId ? '✅ Knowledge আপডেট হয়েছে' : '✅ Knowledge যোগ হয়েছে', 'success');
      resetForm();
      await loadAdvancedKnowledge();
    } catch (err) { toastMsg('এরর: ' + err.message, 'error'); }
  };

  window.editAdvancedKnowledge = function (id) {
    const x = items.find(v => Number(v.id) === Number(id));
    if (!x) return;
    editingId = Number(id);
    document.getElementById('kb-title').value = x.title || '';
    document.getElementById('kb-question').value = x.question || '';
    document.getElementById('kb-answer').value = x.answer || x.content || '';
    document.getElementById('kb-source-url').value = x.source_url || '';
    document.getElementById('kb-form-mode').textContent = 'এডিট চলছে';
    document.getElementById('kb-form-mode').className = 'badge badge-yellow';
    document.getElementById('kb-save-btn').textContent = '💾 পরিবর্তন সেভ করুন';
    document.getElementById('kb-cancel-btn').style.display = 'inline-flex';
    document.getElementById('kb-title').scrollIntoView({behavior:'smooth', block:'center'});
  };

  window.cancelAdvancedKnowledge = function () { resetForm(); };

  window.deleteAdvancedKnowledge = async function (id) {
    const aid = agentId();
    if (!aid) return toastMsg('এজেন্ট নির্বাচন করুন', 'error');
    if (!confirm('এই Knowledge তথ্যটি মুছে ফেলবেন?')) return;
    try {
      const res = await fetch(`${API}/knowledge/advanced/delete`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, agentId:aid})
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'মুছে ফেলা যায়নি');
      toastMsg('🗑️ Knowledge মুছে ফেলা হয়েছে', 'success');
      await loadAdvancedKnowledge();
    } catch (err) { toastMsg('এরর: ' + err.message, 'error'); }
  };

  function install() {
    if (!renderShell()) return;
    loadAdvancedKnowledge();
    const originalSelect = window.selectAgent;
    if (typeof originalSelect === 'function' && !window.__advancedKbAgentHook) {
      window.selectAgent = function (id) {
        const result = originalSelect.apply(this, arguments);
        setTimeout(() => {
          const sel = document.getElementById('knowledge-agent-select');
          if (sel) { sel.value = id; loadAdvancedKnowledge(); }
        }, 0);
        return result;
      };
      window.__advancedKbAgentHook = true;
    }
  }

  install();
})();
