/* AKEXA AI Bazar — reliable marketplace loader and safe UX enhancements. */
(function () {
  'use strict';

  const root = window;
  const doc = document;
  let attached = false;

  function openWhenReady() {
    if (typeof root.openMarketplace === 'function') {
      try {
        root.openMarketplace();
      } catch (error) {
        console.error('AKEXA AI Bazar could not open:', error);
        root.alert('AI Bazar খুলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
      return true;
    }
    return false;
  }

  function attachReliableHandlers() {
    const item = doc.getElementById('akexa-bazar-nav');
    if (!item || attached) return Boolean(item);

    attached = true;

    // Capture the click before the original fallback alert can run.
    item.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      let tries = 0;
      const timer = setInterval(function () {
        tries += 1;
        if (openWhenReady() || tries >= 30) {
          clearInterval(timer);
          if (tries >= 30 && typeof root.openMarketplace !== 'function') {
            console.error('AKEXA AI Bazar: marketplace.js did not load.');
            root.alert('AI Bazar লোড হয়নি। পেজটি Refresh করে আবার চেষ্টা করুন।');
          }
        }
      }, 250);
    }, true);

    const browse = doc.getElementById('akexa-browse-btn');
    if (browse) {
      browse.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openWhenReady();
      }, true);
    }

    return true;
  }

  let attempts = 0;
  const timer = setInterval(function () {
    attempts += 1;
    if (attachReliableHandlers() || attempts >= 80) clearInterval(timer);
  }, 250);

  attachReliableHandlers();
})();
