/* AKEXA AI Bazar — robust launcher fix. */
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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,5,12,.97);color:#fff;padding:20px;overflow:auto;font-family:Arial,sans-serif;';
    overlay.innerHTML = '<div style="max-width:760px;margin:20px auto;background:#151525;border:1px solid #393955;border-radius:16px;padding:24px">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0;color:#c4b5fd">AKEXA AI Bazar</h2><p style="color:#aaaac0">Build AI Agents. Automate Businesses.</p></div><button id="akexa-bazar-fallback-close" style="background:#292940;color:#fff;border:1px solid #555577;border-radius:8px;padding:9px 13px">Close</button></div>' +
      '<hr style="border-color:#30304a;margin:20px 0">' +
      '<div style="padding:22px;border:1px dashed #555577;border-radius:12px;color:#c9c9df">The marketplace launcher is ready, but the main marketplace module is not available yet.</div>' +
      '<button id="akexa-bazar-fallback-retry" style="margin-top:16px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:0;border-radius:9px;padding:11px 16px;font-weight:700">Try Again</button>' +
      '</div>';
    doc.body.appendChild(overlay);
    doc.getElementById('akexa-bazar-fallback-close').onclick = () => overlay.remove();
    doc.getElementById('akexa-bazar-fallback-retry').onclick = () => {
      overlay.remove();
      root.location.reload();
    };
  }

  function open() {
    if (typeof root.openMarketplace === 'function') {
      try {
        root.openMarketplace();
        return true;
      } catch (e) {
        console.error('AKEXA AI Bazar open failed:', e);
        fallbackOpen();
        return true;
      }
    }
    return false;
  }

  function patchLauncher() {
    const item = doc.getElementById('akexa-bazar-nav');
    if (!item) return false;

    // Replace the original inline alert handler completely.
    item.onclick = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (!open()) fallbackOpen();
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
        if (!open()) fallbackOpen();
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
