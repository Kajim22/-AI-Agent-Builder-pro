(function(){
  'use strict';
  const SUPABASE_URL='https://yhspipyrgdcdfqqxxges.supabase.co';
  const SUPABASE_KEY='sb_publishable_IcyDHTLjyPPspvcgnYZZiw_q1lUn8QW';
  const STORAGE_KEY='ah_agents';
  let sb=null;
  let syncing=false;

  function loadSdk(){
    return new Promise((resolve,reject)=>{
      if(window.supabase?.createClient) return resolve();
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js';
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Supabase SDK লোড হয়নি'));
      document.head.appendChild(s);
    });
  }

  function readLocal(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch(_){return [];}
  }

  function writeLocal(rows){
    syncing=true;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(rows));}
    finally{syncing=false;}
  }

  async function getUser(){
    if(!sb)return null;
    const result=await sb.auth.getUser();
    return result.data?.user||null;
  }

  async function pull(){
    const user=await getUser();
    if(!user)return;
    const {data,error}=await sb.from('user_agents').select('id,agent_data,created_at,updated_at').eq('owner_user_id',user.id).order('updated_at',{ascending:false});
    if(error){console.warn('[AKEXA DATA] Pull failed',error.message);return;}
    const remote=(data||[]).map(row=>row.agent_data).filter(Boolean);
    if(remote.length)writeLocal(remote);
  }

  async function push(){
    if(syncing)return;
    const user=await getUser();
    if(!user)return;
    const rows=readLocal();
    for(const agent of rows){
      if(!agent||!agent.id)continue;
      const payload={id:String(agent.id),owner_user_id:user.id,agent_data:agent,updated_at:new Date().toISOString()};
      const {error}=await sb.from('user_agents').upsert(payload,{onConflict:'id'});
      if(error)console.warn('[AKEXA DATA] Push failed',error.message);
    }
  }

  async function init(){
    await loadSdk();
    sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    window.akexaSupabase=sb;
    sb.auth.onAuthStateChange(async(_event,session)=>{
      if(session){
        await pull();
        setTimeout(push,300);
      }
    });
    const originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      const result=originalSetItem.call(this,key,value);
      if(this===localStorage&&key===STORAGE_KEY&&!syncing){setTimeout(push,250);}
      return result;
    };
    const originalRemoveItem=Storage.prototype.removeItem;
    Storage.prototype.removeItem=function(key){
      const result=originalRemoveItem.call(this,key);
      if(this===localStorage&&key===STORAGE_KEY&&!syncing){setTimeout(async()=>{const user=await getUser();if(user)await sb.from('user_agents').delete().eq('owner_user_id',user.id);},250);}
      return result;
    };
    const session=await sb.auth.getSession();
    if(session.data.session){await pull();setTimeout(push,300);}
  }

  init().catch(error=>console.error('[AKEXA DATA]',error));
})();
