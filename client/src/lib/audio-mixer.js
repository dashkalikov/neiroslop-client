import {normalizeVolume,DEFAULT_VOLUME} from './audio-preferences.js';

const effects={
  landing:['cell-landing.wav',.28],special:['cell-special.wav',.35],bonus:['cell-bonus.wav',.4],
  coins:['coin-rain.wav',.8],lever:['lever-clunk.wav',.33],win:['win-chord.wav',.32],
};

/** One music channel lives above routes. Game effects have their own cancellation boundary. */
export function createAudioMixer({createMedia=src=>new Audio(src),schedule=setTimeout,cancel=clearTimeout}={}){
  let music=null,enabled=false,volume=DEFAULT_VOLUME;
  const active=new Map(),pending=new Set(),prepared=new Map();
  function stopEffects(){
    for(const timer of pending)cancel(timer);
    pending.clear();
    for(const media of active.keys()){media.pause();media.currentTime=0;}
    active.clear();
  }
  function reconcileMusic(){
    if(!music)return;
    music.loop=true;music.volume=volume*.5;
    if(!enabled||volume===0){music.pause();return;}
    if(music.paused)void music.play().catch(()=>{/* Resume on the next explicit sound action. */});
  }
  function configure(options){
    if(options.enabled!==undefined)enabled=Boolean(options.enabled);
    if(options.volume!==undefined)volume=normalizeVolume(options.volume);
    for(const [media,gain] of active)media.volume=volume*gain;
    if(!enabled||volume===0)stopEffects();
    reconcileMusic();
  }
  function attachMusic(media){
    if(music===media)return;
    music?.pause();music=media;
    if(!media)stopEffects();
    reconcileMusic();
  }
  function prepareEffects(){
    for(const [file] of Object.values(effects)){
      if(prepared.has(file))continue;
      const media=createMedia('/assets/audio/'+file);
      media.preload='auto';media.load?.();prepared.set(file,media);
    }
  }
  function playEffect(name,{gain=effects[name]?.[1],rate=1,delay=0}={}){
    if(!effects[name]||!enabled||volume===0)return ()=>{};
    let media=null,timer=null;
    const start=()=>{
      if(timer!==null)pending.delete(timer);
      if(!enabled||volume===0)return;
      media=createMedia('/assets/audio/'+effects[name][0]);
      const level=normalizeVolume(gain);
      media.volume=volume*level;media.playbackRate=rate;media.preservesPitch=false;
      active.set(media,level);
      media.onended=media.onerror=()=>active.delete(media);
      void media.play().catch(()=>active.delete(media));
    };
    if(delay>0){timer=schedule(start,delay);pending.add(timer);}else start();
    return ()=>{
      if(timer!==null){cancel(timer);pending.delete(timer);}
      if(media){media.pause();media.currentTime=0;active.delete(media);}
    };
  }
  function landColumn(symbols,column,{turbo=false,reduced=false}={}){
    const semitones=[0,2,4,7,9][column%5];
    const stops=symbols.map((symbol,row)=>playEffect(symbol==='scatter'?'bonus':symbol==='wild'?'special':'landing',{
      rate:symbol==='scatter'||symbol==='wild'?1:2**(semitones/12),delay:reduced?0:row*(turbo?18:65),
    }));
    return ()=>stops.forEach(stop=>stop());
  }
  return {attachMusic,configure,prepareEffects,playEffect,landColumn,stopEffects};
}
