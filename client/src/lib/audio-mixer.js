import {
  DEFAULT_AUDIO_PREFERENCES, getSoundtrack, normalizeAudioPreferences, normalizeVolume,
} from './audio-preferences.js';

const effects={
  landing:['cell-landing.wav',.28],special:['cell-special.wav',.35],bonus:['cell-bonus.wav',.4],
  coins:['coin-rain.wav',.8,'winVolume'],lever:['lever-clunk.wav',.33],win:['win-chord.wav',.32,'winVolume'],
};

/** Фоновая музыка живёт между экранами. Игровые эффекты можно остановить отдельно. */
export function createAudioMixer({createMedia=src=>new Audio(src),schedule=setTimeout,cancel=clearTimeout}={}){
  let music = null;
  let loadedTrack = null;
  let enabled = false;
  let mix = DEFAULT_AUDIO_PREFERENCES;
  // Раздельно храним играющие эффекты, таймеры и заранее загруженные файлы.
  const active=new Map(),pending=new Map(),prepared=new Map();
  function stopEffects(channel) {
    for (const [timer, queuedChannel] of pending) {
      if (channel && channel !== queuedChannel) continue;
      cancel(timer);
      pending.delete(timer);
    }
    for (const [media, effect] of active) {
      if (channel && channel !== effect.channel) continue;
      media.pause();
      media.currentTime = 0;
      active.delete(media);
    }
  }
  function reconcileMusic(){
    if(!music)return;
    music.loop = true;
    const gain = mix.volume * mix.musicVolume;
    music.volume = gain;
    // Пауза сохраняет позицию фоновой дорожки при отключении звука.
    if (!enabled || gain === 0) {
      music.pause();
      return;
    }
    if (loadedTrack !== mix.soundtrack) {
      music.pause();
      music.src = '/assets/audio/' + getSoundtrack(mix.soundtrack).file;
      loadedTrack = mix.soundtrack;
    }
    if(music.paused)void music.play().catch(()=>{/* Возобновим при следующем действии пользователя со звуком. */});
  }
  function configure(options){
    if(options.enabled!==undefined)enabled=Boolean(options.enabled);
    mix = normalizeAudioPreferences({ ...mix, ...options });
    if (!enabled || mix.volume === 0) {
      stopEffects();
    } else {
      if (mix.effectsVolume === 0) stopEffects('effectsVolume');
      if (mix.winVolume === 0) stopEffects('winVolume');
      for (const [media, { channel, gain }] of active) {
        media.volume = mix.volume * gain * mix[channel];
      }
    }
    reconcileMusic();
  }
  function attachMusic(media){
    if(music===media)return;
    music?.pause();music=media;
    loadedTrack = null;
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
  function playEffect(name,{gain,rate=1,delay=0}={}){
    if (!Object.hasOwn(effects, name)) return () => {};
    const [file, defaultGain, channel = 'effectsVolume'] = effects[name];
    if (!enabled || mix.volume === 0 || mix[channel] === 0) return () => {};
    let media=null,timer=null;
    const start=()=>{
      if(timer!==null)pending.delete(timer);
      if (!enabled || mix.volume === 0 || mix[channel] === 0) return;
      media=createMedia('/assets/audio/'+file);
      const level = normalizeVolume(gain, defaultGain);
      media.volume = mix.volume * level * mix[channel];
      media.playbackRate=rate;media.preservesPitch=false;
      active.set(media, { gain: level, channel });
      media.onended=media.onerror=()=>active.delete(media);
      void media.play().catch(()=>active.delete(media));
    };
    // Возвращаем отмену для обоих состояний: ожидание и воспроизведение.
    if(delay>0){timer=schedule(start,delay);pending.set(timer,channel);}else start();
    return ()=>{
      if(timer!==null){cancel(timer);pending.delete(timer);}
      if(media){media.pause();media.currentTime=0;active.delete(media);}
    };
  }
  function landColumn(symbols,column,{turbo=false,reduced=false}={}){
    // Обычные символы звучат выше по мере смены барабанов. У спецсимволов свой звук.
    const semitones=[0,2,4,7,9][column%5];
    const stops=symbols.map((symbol,row)=>playEffect(symbol==='scatter'?'bonus':symbol==='wild'?'special':'landing',{
      rate:symbol==='scatter'||symbol==='wild'?1:2**(semitones/12),delay:reduced?0:row*(turbo?18:65),
    }));
    return ()=>stops.forEach(stop=>stop());
  }
  return {attachMusic,configure,prepareEffects,playEffect,landColumn,stopEffects};
}
