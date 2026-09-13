/* AKEXA AI Bazar — reliable loader with standalone fallback. */
(function () {
  'use strict';

  const root = window;
  const doc = document;

  function fallbackOpen() {
    let overlay = doc.getElementById('akexa-bazar-fallback');
    if (overlay) {
      overlay.style.display = 'block';
      return;
    }

    overlay = doc.createElement('div');
    overlay.id = 'akexa-bazar-fallback';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,5,12,.96);color:#fff;padding:24px;overflow:auto;font-family:Arial,sans-serif;';
    overlay.innerHTML = '<div style="max-width:760px;margin:20px auto;background:#151525;border:1px solid #393955;border-radius:16px;padding:24px">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0;color:#c4b5fd">AKEXA AI Bazar</h2><p style="color:#aaaac0">Build, Buy & Sell AI Agents</p></div><button id="akexa-bazar-fallback-close" style="background:#292940;color:#fff;border:1px solid #555577;border-radius:8px;padding:9px 13px">Close</button></div>' +
      '<hr style="border-color:#30304a;margin:20px 0">' +
      '<div style="padding:22px;border:1px dashed #555577;border-radius:12px;color:#c9c9df">AI Bazar module is ready. The marketplace database module is still loading. Please refresh once and try again.</div>' +
      '<button id="akexa-bazar-fallback-refresh" style="margin-top:16px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:0;border-radius:9px;padding:11px 16px;font-weight:700">Refresh Marketplace</button>' +
      '</div>';
    doc.body.appendChild(overlay);
    doc.getElementById('akexa-bazar-fallback-close').onclick = () => overlay.remove();
    doc.getElementById('akexa-bazar-fallback-refresh').onclick = () => root.location.reload();
  }

  function tryOpen() {
    if (typeof root.openMarketplace === 'function') {
      root.openMarketplace();
      return true;
    }
    return false;
  }

  function attach() {
    const item = doc.getElementById('akexa-bazar-nav');
    if (!item || item.dataset.akexaFixed === '1') return;
    item.dataset.akexaFixed = '1';
    item.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (tryOpen()) return;
      fallbackOpen();
    }, true);
  }

  let count = 0;
  const timer = setInterval(function () {
    attach();
    if (tryOpen() || ++count > 40) clearInterval(timer);
  }, 250);
  attach();
})();
