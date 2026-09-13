/* AKEXA AI Bazar — safe marketplace UX enhancements. */
(function(){
  'use strict';
  const root=window;

  function ready(){
    if(typeof root.openMarketplace!=='function') return false;
    if(root.__akexaMarketplaceEnhanced) return true;

    const original=root.openMarketplace;
    root.openMarketplace=function(){
      const originalAlert=root.alert;
      try{
        // Suppress only the temporary loading message.
        root.alert=function(message){
          if(String(message||'').trim()==='AI Bazar module loading...') return;
          return originalAlert.call(root,message);
        };
        return original.apply(this,arguments);
      }catch(error){
        console.error('AKEXA AI Bazar could not open:',error);
        originalAlert.call(root,'AI Bazar খুলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }finally{
        root.alert=originalAlert;
      }
    };

    root.__akexaMarketplaceEnhanced=true;
    return true;
  }

  if(!ready()){
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(ready()||attempts>40) clearInterval(timer);
    },250);
  }
})();
