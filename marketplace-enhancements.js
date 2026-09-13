/* AKEXA AI Bazar — robust launcher and absolute module loading fix. */
(function () {
  'use strict';

  const root = window;
  const doc = document;
  let loading = null;

  function fallbackOpen(message) {
    let overlay = doc.getElementById('akexa-bazar-fallback');
    if (overlay) {
      const note = overlay.querySelector('[data-bazar-note]');
      if (note && message) note.textContent = message;
      overlay.style.display = 'block';
      return;
    }

    overlay = doc.createElement('div');
    overlay.id = 'akexa-bazar-fallback';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,5,12,.97);color:#fff;padding:20px;overflow:auto;font-family:Arial,sans-serif;';
    overlay.innerHTML = '<div style="max-width:760px;margin:20px auto;background:#151525;border:1px solid #393955;border-radius:16px;padding:24px">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0;color:#c4b5fd">AKEXA AI Bazar</h2><p style="color:#aaaac0">Build AI Agents. Automate Businesses.</p></div><button id="akexa-bazar-fallback-close" style="background:#292940;color:#fff;border:1px solid #555577;border-radius:8px;padding:9px 13px">Close</button></div>' +
      '<hr style="border-color:#30304a;margin:20px 0">' +
      '<div data-bazar-note style="padding:22px;border:1px dashed #555577;border-radius:12px;color:#c9c9df">Loading the marketplace module…</div>' +
      '<button id="akexa-bazar-fallback-retry" style="margin-top:16px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:0;border-radius:9px;padding:11px 16px;font-weight:700">Try Again</button>' +
      '</div>';
    doc.body.appendChild(overlay);
    doc.getElementById('akexa-bazar-fallback-close').onclick = () => overlay.remove();
    doc.getElementById('akexa-bazar-fallback-retry').onclick = () => {
      overlay.remove();
      loading = null;
      open();
    };
    if (message) overlay.querySelector('[data-bazar-note]').textContent = message;
  }

  function loadMarketplace() {
    if (typeof root.openMarketplace === 'function') return Promise.resolve(true);
    if (loading) return loading;

    loading = new Promise((resolve) => {
      const existing = doc.getElementById('akexa-bazar-script') || doc.getElementById('akexa-marketplace-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(typeof root.openMarketplace === 'function'));
        existing.addEventListener('error', () => resolve(false));
        setTimeout(() => resolve(typeof root.openMarketplace === 'function'), 2000);
        return;
      }

      const script = doc.createElement('script');
      script.id = 'akexa-bazar-script';
      script.src = '/marketplace.js';
      script.onload = () => resolve(typeof root.openMarketplace === 'function');
      script.onerror = () => resolve(false);
      doc.head.appendChild(script);
    });

    return loading;
  }

  async function open() {
    if (typeof root.openMarketplace === 'function') {
      try {
        root.openMarketplace();
        return true;
      } catch (error) {
        console.error('AKEXA AI Bazar open failed:', error);
        fallbackOpen('The marketplace module failed to open. Please try again.');
        return false;
      }
    }

    fallbackOpen('Loading the marketplace module…');
    const ready = await loadMarketplace();
    const overlay = doc.getElementById('akexa-bazar-fallback');
    if (overlay) overlay.remove();
    if (ready && typeof root.openMarketplace === 'function') {
      root.openMarketplace();
      return true;
    }
    fallbackOpen('The marketplace module could not be loaded. Please try again.');
    return false;
  }

  function patchLauncher() {
    const item = doc.getElementById('akexa-bazar-nav');
    if (!item) return false;

    item.onclick = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      open();
      return false;
    };
    item.dataset.akexaLauncherFixed = '1';

    const browse = doc.getElementById('akexa-browse-btn');
    if (browse) {
      browse.onclick = function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        open();
        return false;
      };
    }
    return true;
  }

  let attempts = 0;
  const timer = setInterval(function () {
    attempts += 1;
    patchLauncher();
    if (typeof root.openMarketplace === 'function' || attempts >= 80) clearInterval(timer);
  }, 250);

  patchLauncher();
})();
