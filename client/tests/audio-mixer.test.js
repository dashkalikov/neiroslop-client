import test from 'node:test';
import assert from 'node:assert/strict';

// HTMLMediaElement is an external browser boundary, unavailable in Node.
class Media {
  constructor(src=''){this.src=src;this.volume=1;this.loop=false;}
  set src(value){this.source=value;this.paused=true;this.currentTime=0;}
  get src(){return this.source;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
}
function clock(){
  let now=0,id=0;const timers=new Map();
  return {schedule(fn,delay){timers.set(++id,{fn,at:now+delay});return id;},cancel(id){timers.delete(id);},
    advance(ms){now+=ms;for(const [id,item] of [...timers])if(item.at<=now){timers.delete(id);item.fn();}}};
}
async function setup(){
  const {createAudioMixer}=await import('../src/lib/audio-mixer.js');
  const effects=[],time=clock(),music=new Media('soundtrack');
  const mixer=createAudioMixer({createMedia:src=>{const media=new Media(src);effects.push(media);return media;},schedule:time.schedule,cancel:time.cancel});
  mixer.attachMusic(music);mixer.configure({enabled:true,volume:.8});
  return {mixer,effects,music,time};
}

test('one looping soundtrack keeps its playhead when game effects stop or volume changes',async()=>{
  const {mixer,music,effects}=await setup();
  music.currentTime=27.25;
  mixer.playEffect('coins');
  mixer.stopEffects();
  assert.equal(music.paused,false);
  assert.equal(music.loop,true);
  assert.equal(music.currentTime,27.25);
  assert.equal(effects[0].paused,true);
  mixer.configure({enabled:true,volume:.4});
  assert.equal(music.volume,.2);
  assert.equal(music.currentTime,27.25);
});

test('master volume updates currently sounding effects and silence stops queued cell cues',async()=>{
  const {mixer,music,effects,time}=await setup();
  mixer.playEffect('coins',{gain:.8});
  mixer.configure({enabled:true,volume:.25});
  assert.equal(effects[0].volume,.2);
  mixer.landColumn(['gem','wild','scatter'],0);
  mixer.configure({enabled:false,volume:.25});
  time.advance(1000);
  assert.equal(effects.length,2); // Coin rain and row 0; the other cells were cancelled.
  assert.equal(effects.every(media=>media.paused),true);
  assert.equal(music.paused,true);
  mixer.configure({enabled:true,volume:0});
  assert.equal(music.paused,true);
  mixer.playEffect('coins');
  assert.equal(effects.length,2);
});

test('each landed cell gets a timed cue and special symbols have distinct sounds',async()=>{
  const {mixer,effects,time}=await setup();
  mixer.landColumn(['gem','wild','scatter'],2);
  assert.equal(effects.length,1);
  assert.match(effects[0].src,/cell-landing/);
  time.advance(65);
  assert.equal(effects.length,2);
  assert.match(effects[1].src,/cell-special/);
  assert.equal(effects[1].playbackRate,1); // Keep the two-note accent in the soundtrack's key.
  time.advance(65);
  assert.equal(effects.length,3);
  assert.match(effects[2].src,/cell-bonus/);
  assert.equal(effects[2].playbackRate,1);
  mixer.playEffect('spin');
  assert.equal(effects.length,3); // There is no reel-spin effect.
});

test('muting and resuming preserves the soundtrack position',async()=>{
  const {mixer,music}=await setup();
  music.currentTime=12.5;
  mixer.configure({enabled:false,volume:.8});
  mixer.configure({enabled:true,volume:.8});
  assert.equal(music.paused,false);
  assert.equal(music.currentTime,12.5);
});

test('channel levels change active sounds independently',async()=>{
  const {mixer,music,effects}=await setup();
  mixer.playEffect('lever',{gain:.5});
  mixer.playEffect('coins',{gain:.5});
  mixer.configure({musicVolume:.25,effectsVolume:.5,winVolume:.75});
  assert.equal(music.volume,.8*.25);
  assert.equal(effects[0].volume,.8*.5*.5);
  assert.equal(effects[1].volume,.8*.5*.75);
  music.currentTime=9;
  mixer.configure({musicVolume:0});
  assert.equal(music.paused,true);
  assert.ok(effects.every(media=>!media.paused));
  mixer.configure({musicVolume:.25});
  assert.equal(music.paused,false);
  assert.equal(music.currentTime,9);
});

test('muting game effects cancels queued landings without interrupting wins',async()=>{
  const {mixer,music,effects,time}=await setup();
  mixer.landColumn(['gem','wild','scatter'],0);
  mixer.playEffect('win',{delay:100});
  mixer.configure({effectsVolume:0});
  time.advance(120);
  mixer.configure({effectsVolume:1});
  time.advance(1000);
  assert.equal(effects.length,2);
  assert.equal(effects[0].paused,true);
  assert.match(effects[1].src,/win-chord/);
  assert.equal(effects[1].paused,false);
  assert.equal(music.paused,false);
  mixer.configure({winVolume:0});
  assert.equal(effects[1].paused,true);
  mixer.playEffect('coins');
  assert.equal(effects.length,2);
});

test('the selected soundtrack loads on playback and keeps its place through mix changes',async()=>{
  const {mixer,music}=await setup();
  assert.match(music.src,/lounge-soundtrack\.wav$/);
  mixer.configure({enabled:false,soundtrack:'golden-hour'});
  assert.match(music.src,/lounge-soundtrack\.wav$/);
  mixer.configure({enabled:true});
  assert.match(music.src,/golden-hour\.wav$/);
  assert.equal(music.paused,false);
  music.currentTime=14;
  mixer.configure({effectsVolume:.25,soundtrack:'golden-hour'});
  assert.equal(music.currentTime,14);
  mixer.configure({soundtrack:'moonlit-keys'});
  assert.match(music.src,/moonlit-keys\.wav$/);
  assert.equal(music.paused,false);
});

test('mix and soundtrack survive reload while older master volume is preserved',async()=>{
  const {readAudioPreferences,writeAudioPreferences}=await import('../src/lib/audio-preferences.js');
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(readAudioPreferences(storage).volume,.55);
  storage.setItem('lounge-volume','.37');
  assert.equal(readAudioPreferences(storage).volume,.37);
  const mix={volume:0,musicVolume:.4,effectsVolume:.7,winVolume:0,soundtrack:'moonlit-keys'};
  writeAudioPreferences(mix,storage);
  assert.deepEqual(readAudioPreferences(storage),mix);
  const safe=writeAudioPreferences({musicVolume:'invalid',soundtrack:'unknown'},storage);
  assert.equal(safe.musicVolume,.5);
  assert.equal(safe.soundtrack,'lounge');
  assert.equal(readAudioPreferences({getItem(){throw new Error('disabled');}}).volume,.55);
});

test('the roulette loop tracks speed and uses the game effects channel', async () => {
  const { mixer, effects, music } = await setup();
  music.currentTime = 21;
  const roll = mixer.rouletteRoll();
  roll.update({ gain: .5, rate: 1.6 });
  const [media] = effects;
  assert.match(media.src, /roulette-roll\.wav$/);
  assert.equal(media.loop, true);
  assert.equal(media.playbackRate, 1.6);
  const launchVolume = media.volume;
  roll.update({ gain: .2, rate: .9 });
  assert.equal(effects.length, 1);
  assert.equal(media.playbackRate, .9);
  assert.ok(media.volume < launchVolume);
  mixer.configure({ effectsVolume: 0 });
  roll.update({ gain: .2, rate: .9 });
  assert.equal(media.paused, true);
  assert.equal(music.paused, false);
  mixer.configure({ effectsVolume: .4 });
  roll.update({ gain: .2, rate: .9 });
  assert.equal(effects.length, 1);
  assert.equal(media.paused, false);
  assert.ok(Math.abs(media.volume - .064) < 1e-9);
  roll.stop();
  assert.equal(media.paused, true);
  assert.equal(music.currentTime, 21);
});
