/* AKEXA AI Bazar — safe marketplace UX enhancements. */
(function(){
  'use strict';
  const root=window;
  function ready(){
    if(typeof root.openMarketplace!=='function') return false;
    if(root.__akexaMarketplaceEnhanced) return true;
    const original=root.openMarketplace;
    root.openMarketplace=function(){
      try{return original.apply(this,arguments);}catch(error){
        console.error('AKEXA AI Bazar could not open:',error);
        alert('AI Bazar এখন প্রস্তুত হচ্ছে। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।');
      }
    };
    root.__akexaMarketplaceEnhanced=true;
    return true;
  }
  if(!ready()){
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(ready()||attempts>40)clearInterval(timer);
    },250);
  }
})();
