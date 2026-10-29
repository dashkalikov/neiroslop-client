import test from 'node:test';
import assert from 'node:assert/strict';

// HTMLMediaElement is an external browser boundary, unavailable in Node.
class Media {
  constructor(src=''){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;this.loop=false;}
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

test('volume preference survives reload and tolerates unavailable storage',async()=>{
  const {readVolume,writeVolume}=await import('../src/lib/audio-preferences.js');
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(readVolume(storage),.55);
  writeVolume(.37,storage);assert.equal(readVolume(storage),.37);
  writeVolume(0,storage);assert.equal(readVolume(storage),0);
  storage.setItem('lounge-volume','invalid');assert.equal(readVolume(storage),.55);
  assert.equal(readVolume({getItem(){throw new Error('disabled');}}),.55);
});
