/* AKEXA AI Bazar — catalog search and category filters. */
(function () {
  'use strict';
  const doc = document;
  let installed = false;

  function install() {
    const body = doc.querySelector('.akexa-bazar-body');
    if (!body || body.querySelector('[data-akexa-catalog-tools]')) return false;

    const grid = body.querySelector('.akexa-bazar-grid');
    const empty = body.querySelector('.akexa-empty');
    if (!grid && !empty) return false;

    const tools = doc.createElement('div');
    tools.setAttribute('data-akexa-catalog-tools', '1');
    tools.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px;';
    tools.innerHTML = '<input data-akexa-search type="search" placeholder="Search agents…" aria-label="Search agents" style="flex:1;min-width:180px;padding:11px 12px;border:1px solid #353550;border-radius:9px;background:#0d0d16;color:#fff;box-sizing:border-box">' +
      '<select data-akexa-category aria-label="Filter by category" style="min-width:145px;padding:11px 12px;border:1px solid #353550;border-radius:9px;background:#0d0d16;color:#fff"><option value="">All categories</option></select>';
    body.insertBefore(tools, body.firstChild);

    const search = tools.querySelector('[data-akexa-search]');
    const category = tools.querySelector('[data-akexa-category]');

    function refreshCategories() {
      const values = new Set();
      body.querySelectorAll('.akexa-agent-card').forEach(card => {
        const meta = card.querySelector('.akexa-agent-meta');
        const value = meta?.firstElementChild?.textContent?.trim();
        if (value && value !== 'My Agent') values.add(value);
      });
      const current = category.value;
      category.innerHTML = '<option value="">All categories</option>' + Array.from(values).sort().map(v => '<option></option>').join('');
      Array.from(category.options).slice(1).forEach((option, i) => { option.value = Array.from(values).sort()[i]; option.textContent = Array.from(values).sort()[i]; });
      if (values.has(current)) category.value = current;
    }

    function apply() {
      const query = search.value.trim().toLowerCase();
      const selected = category.value.toLowerCase();
      let visible = 0;
      body.querySelectorAll('.akexa-agent-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        const meta = card.querySelector('.akexa-agent-meta');
        const cat = meta?.firstElementChild?.textContent?.trim().toLowerCase() || '';
        const show = (!query || text.includes(query)) && (!selected || cat === selected);
        card.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });
      let result = body.querySelector('[data-akexa-filter-empty]');
      if (!result) { result = doc.createElement('div'); result.setAttribute('data-akexa-filter-empty', '1'); result.style.cssText = 'display:none;padding:25px;text-align:center;color:#9090b0;border:1px dashed #353550;border-radius:12px;'; body.appendChild(result); }
      result.textContent = 'No agents match your search.';
      result.style.display = visible || !grid ? 'none' : '';
    }

    search.addEventListener('input', apply);
    category.addEventListener('change', apply);
    refreshCategories();
    apply();
    installed = true;
    return true;
  }

  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  observer.observe(doc.documentElement, { childList: true, subtree: true });
  install();
})();