/* AKEXA AI Bazar — launcher compatibility fix. */
(function () {
  'use strict';
  const root = window;
  const doc = document;
  let loading = null;

  function openMarketplaceNow() {
    const opener = root.openMarketplace || root.akexaBazarOpen;
    if (typeof opener === 'function') {
      opener.call(root);
      return true;
    }
    return false;
  }

  function showFallback(message) {
    let box = doc.getElementById('akexa-bazar-fallback');
    if (!box) {
      box = doc.createElement('div');
      box.id = 'akexa-bazar-fallback';
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
        setTimeout(() => resolve(typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function'), 2000);
        return;
      }
      const script = doc.createElement('script');
      script.id = 'akexa-bazar-script';
      script.src = '/marketplace.js';
      script.onload = () => resolve(typeof root.akexaBazarOpen === 'function' || typeof root.openMarketplace === 'function');
      script.onerror = () => resolve(false);
      doc.head.appendChild(script);
    });
    return loading;
  }

  async function open() {
    if (openMarketplaceNow()) return true;
    showFallback('Loading the marketplace module…');
    const ready = await loadMarketplace();
    const box = doc.getElementById('akexa-bazar-fallback');
    if (box) box.remove();
    if (ready && openMarketplaceNow()) return true;
    showFallback('The marketplace module could not be loaded. Please try again.');
    return false;
  }

  function patch() {
    const item = doc.getElementById('akexa-bazar-nav');
    if (item) {
      item.onclick = event => { event?.preventDefault(); event?.stopPropagation(); open(); return false; };
    }
    const browse = doc.getElementById('akexa-browse-btn');
    if (browse) {
      browse.onclick = event => { event?.preventDefault(); event?.stopPropagation(); open(); return false; };
    }
  }

  function loadCatalog() {
    if (doc.getElementById('akexa-catalog-script')) return;
    const script = doc.createElement('script');
    script.id = 'akexa-catalog-script';
    script.src = '/marketplace-catalog.js';
    script.async = true;
    doc.head.appendChild(script);
  }

  patch();
  loadCatalog();
  let tries = 0;
  const timer = setInterval(() => { patch(); loadCatalog(); tries += 1; if (tries >= 80 || typeof root.akexaBazarOpen === 'function') clearInterval(timer); }, 250);
})();