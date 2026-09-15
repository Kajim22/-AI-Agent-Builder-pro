/* AKEXA AI Bazar — launcher, publish-flow, storage and auth compatibility fix. */
(function () {
  'use strict';
  const root = window;
  const doc = document;
  const SUPABASE_URL = 'https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  let loading = null;
  let publishWrapped = false;

  function openMarketplaceNow() {
    const opener = root.openMarketplace || root.akexaBazarOpen;
    if (typeof opener === 'function') { opener.call(root); return true; }
    return false;
  }

  function showFallback(message) {
    let box = doc.getElementById('akexa-bazar-fallback');
    if (!box) {
      box = doc.createElement('div'); box.id = 'akexa-bazar-fallback';
      box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,5,12,.97);color:#fff;padding:20px;overflow:auto;font-family:Arial,sans-serif;';
      box.innerHTML = '<div style="max-width:700px;margin:20px auto;background:#151525;border:1px solid #393955;border-radius:16px;padding:24px"><h2 style="color:#c4b5fd">AKEXA AI Bazar</h2><p data-note style="color:#c9c9df"></p><button id="akexa-bazar-retry" style="margin-top:16px;background:#7c3aed;color:#fff;border:0;border-radius:9px;padding:11px 16px;font-weight:700">Try Again</button></div>';
      doc.body.appendChild(box);
      doc.getElementById('akexa-bazar-retry').onclick = () => { box.remove(); loading = null; open(); };
    }
    box.querySelector('[data-note]').textContent = message;
  }

  function loadMarketplace() {
    if (typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function') return Promise.resolve(true);
    if (loading) return loading;
    loading = new Promise(resolve => {
      const existing = doc.getElementById('akexa-bazar-script') || doc.getElementById('akexa-marketplace-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function'), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function'), 2000); return;
      }
      const script = doc.createElement('script'); script.id = 'akexa-bazar-script'; script.src = '/marketplace.js';
      script.onload = () => resolve(typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function');
      script.onerror = () => resolve(false); doc.head.appendChild(script);
    });
    return loading;
  }

  async function open() {
    if (openMarketplaceNow()) return true;
    showFallback('Loading the marketplace module…');
    const ready = await loadMarketplace();
    const box = doc.getElementById('akexa-bazar-fallback'); if (box) box.remove();
    if (ready && openMarketplaceNow()) return true;
    showFallback('The marketplace module could not be loaded. Please try again.'); return false;
  }

  function syncAgentStorage() {
    try {
      const primary = JSON.parse(root.localStorage.getItem('ah_agents') || '[]');
      const legacy = JSON.parse(root.localStorage.getItem('agents') || '[]');
      if (Array.isArray(primary) && primary.length && (!Array.isArray(legacy) || legacy.length !== primary.length)) {
        const normalized = primary.map(agent => ({
          ...agent,
          system_prompt: agent.system_prompt || agent.prompt || '',
          description: agent.description || '',
          category: agent.category || 'Business',
          monthly_price: agent.monthly_price ?? 0
        }));
        root.localStorage.setItem('agents', JSON.stringify(normalized));
      }
    } catch (_) {}
  }

  function showPublishAuth(afterLogin) {
    const old = doc.getElementById('akexa-publish-auth-overlay');
    if (old) old.remove();
    const overlay = doc.createElement('div');
    overlay.id = 'akexa-publish-auth-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(3,3,9,.86);display:flex;align-items:center;justify-content:center;padding:18px;';
    overlay.innerHTML = '<div style="width:min(420px,100%);background:#151525;border:1px solid #393955;border-radius:16px;padding:22px;color:#fff;font-family:Arial,sans-serif"><h2 style="margin:0 0 8px;color:#c4b5fd">Login to AKEXA AI Bazar</h2><p style="color:#b8b8d0;font-size:13px">Publish করতে আগে Login অথবা Create account করুন।</p><input id="akexa-publish-email" type="email" placeholder="Email" style="width:100%;box-sizing:border-box;margin:7px 0;padding:11px;background:#0d0d16;border:1px solid #454565;color:#fff;border-radius:8px"><input id="akexa-publish-password" type="password" placeholder="Password" style="width:100%;box-sizing:border-box;margin:7px 0;padding:11px;background:#0d0d16;border:1px solid #454565;color:#fff;border-radius:8px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button id="akexa-publish-login" style="background:#7c3aed;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700">Login</button><button id="akexa-publish-signup" style="background:#292945;color:#fff;border:1px solid #454565;border-radius:8px;padding:10px 14px;font-weight:700">Create account</button><button id="akexa-publish-cancel" style="background:transparent;color:#c9c9df;border:1px solid #454565;border-radius:8px;padding:10px 14px">Cancel</button></div><div id="akexa-publish-auth-msg" style="font-size:12px;margin-top:12px;color:#b8b8d0"></div></div>';
    doc.body.appendChild(overlay);
    const msg = doc.getElementById('akexa-publish-auth-msg');
    const credentials = () => ({ email: doc.getElementById('akexa-publish-email').value.trim(), password: doc.getElementById('akexa-publish-password').value });
    const getClient = () => {
      if (root.supabase?.createClient) return root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      throw new Error('Supabase SDK এখনও লোড হয়নি। Bazar আবার খুলুন।');
    };
    doc.getElementById('akexa-publish-cancel').onclick = () => overlay.remove();
    doc.getElementById('akexa-publish-login').onclick = async () => {
      const c = credentials(); if (!c.email || !c.password) { msg.textContent = 'Email এবং password দিন।'; return; }
      try { const { error } = await getClient().auth.signInWithPassword(c); if (error) throw error; overlay.remove(); afterLogin(); }
      catch (e) { msg.textContent = e.message || String(e); msg.style.color = '#ff8f8f'; }
    };
    doc.getElementById('akexa-publish-signup').onclick = async () => {
      const c = credentials(); if (!c.email || !c.password) { msg.textContent = 'Email এবং password দিন।'; return; }
      if (c.password.length < 6) { msg.textContent = 'Password কমপক্ষে ৬ অক্ষরের হতে হবে।'; return; }
      try {
        const { data, error } = await getClient().auth.signUp(c); if (error) throw error;
        if (data.session) { overlay.remove(); afterLogin(); }
        else { msg.textContent = 'Account তৈরি হয়েছে। Email verification করে আবার Login করুন।'; msg.style.color = '#79e2a4'; }
      } catch (e) { msg.textContent = e.message || String(e); msg.style.color = '#ff8f8f'; }
    };
  }

  function patchPublish() {
    if (publishWrapped || typeof root.akexaBazarPublish !== 'function') return;
    const originalPublish = root.akexaBazarPublish;
    root.akexaBazarPublish = async function (id) {
      try {
        if (root.supabase?.createClient) {
          const client = root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          const { data } = await client.auth.getUser();
          if (!data?.user) { showPublishAuth(() => root.akexaBazarPublish(id)); return false; }
        }
        return await originalPublish.call(root, id);
      } catch (error) { console.error('AKEXA AI Bazar publish error:', error); alert('Publish failed: ' + (error?.message || String(error))); return false; }
    };
    root.akexaBazarPublish.__akexaWrapped = true; publishWrapped = true;
  }

  function patchMarketplaceActions() {
    const myAgents = doc.getElementById('akexa-myagents');
    if (myAgents && !myAgents.dataset.akexaPatched) {
      myAgents.dataset.akexaPatched = '1'; myAgents.textContent = 'My Agents';
      myAgents.onclick = event => { event?.preventDefault(); event?.stopPropagation(); doc.getElementById('akexa-bazar-overlay')?.remove(); if (typeof root.showSection === 'function') root.showSection('build'); };
    }
    const toolbar = doc.querySelector('#akexa-bazar-overlay .akexa-bazar-toolbar');
    if (toolbar && !doc.getElementById('akexa-create-agent-from-bazar')) {
      const create = doc.createElement('button'); create.id = 'akexa-create-agent-from-bazar'; create.className = 'btn btn-ghost btn-sm'; create.textContent = '＋ Create Agent';
      create.onclick = event => { event?.preventDefault(); event?.stopPropagation(); doc.getElementById('akexa-bazar-overlay')?.remove(); if (typeof root.showSection === 'function') root.showSection('build'); };
      toolbar.appendChild(create);
    }
    const chips = Array.from(doc.querySelectorAll('.agent-chip'));
    const seen = new Set();
    chips.forEach(chip => {
      const name = (chip.querySelector('.agent-name-text')?.textContent || chip.textContent || '').trim();
      if (!name) return;
      if (seen.has(name)) { chip.remove(); return; }
      seen.add(name);
    });
  }

  function addPublishButtonsToMyAgents() {
    const list = doc.getElementById('agent-list');
    if (!list || typeof root.akexaBazarPublish !== 'function') return;
    let saved = [];
    try { saved = JSON.parse(root.localStorage.getItem('ah_agents') || '[]'); } catch (_) { saved = []; }
    Array.from(list.children).forEach((chip, index) => {
      if (!saved[index] || chip.querySelector('.akexa-inline-publish')) return;
      chip.style.gap = '7px';
      const button = doc.createElement('button');
      button.type = 'button'; button.className = 'akexa-inline-publish'; button.textContent = 'Publish to Bazar'; button.title = 'Publish this agent to AI Bazar';
      button.style.cssText = 'margin-left:auto;flex-shrink:0;border:1px solid rgba(167,139,250,.35);background:rgba(124,58,237,.18);color:#c4b5fd;border-radius:7px;padding:4px 7px;font-size:10px;font-weight:700;cursor:pointer;';
      button.onclick = event => { event.preventDefault(); event.stopPropagation(); root.akexaBazarPublish(saved[index].id); };
      chip.appendChild(button);
    });
  }

  function patch() {
    syncAgentStorage();
    const item = doc.getElementById('akexa-bazar-nav'); if (item) item.onclick = event => { event?.preventDefault(); event?.stopPropagation(); open(); return false; };
    const browse = doc.getElementById('akexa-browse-btn'); if (browse) browse.onclick = event => { event?.preventDefault(); event?.stopPropagation(); open(); return false; };
    const sell = doc.getElementById('akexa-sell-btn'); if (sell) sell.onclick = event => { event?.preventDefault(); event?.stopPropagation(); open(); return false; };
    patchMarketplaceActions(); patchPublish(); addPublishButtonsToMyAgents();
  }

  patch(); let tries = 0;
  const timer = setInterval(() => { patch(); tries += 1; if (tries >= 80 || (typeof root.akexaBazarOpen === 'function' && publishWrapped)) clearInterval(timer); }, 250);
})();
/* Supabase bearer-token bridge */
(function () {
  'use strict';

  const API_HOST = 'https://kajim-ai-agent-backend.onrender.com';
  const originalFetch = window.fetch.bind(window);

  function getAccessToken() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';

        if (!key.includes('auth-token')) continue;

        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);

        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.currentSession?.access_token) {
          return parsed.currentSession.access_token;
        }
      }
    } catch (_) {}

    return '';
  }

  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (!url.startsWith(API_HOST)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init.headers || (typeof input !== 'string' ? input.headers : undefined)
    );

    const token = getAccessToken();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    return originalFetch(input, { ...init, headers });
  };

  console.info('[AKEXA] Frontend auth bridge installed');
})();
