import test from 'node:test';
import assert from 'node:assert/strict';
import * as state from '../src/lib/game-state.js';

test('lever stays centered for its entire downward and return travel', () => {
  assert.equal(typeof state.leverPose, 'function');
  assert.deepEqual(state.leverPose(0), {x:52,y:40});
  assert.deepEqual(state.leverPose(1), {x:52,y:350});
  assert.deepEqual(state.leverPose(.5), {x:52,y:195});
  for(const progress of [0,.1,.25,.5,.75,.9,1,.9,.5,.1,0])assert.equal(state.leverPose(progress).x,52);
  assert.deepEqual(state.leverPose(-1), {x:52,y:40});
  assert.deepEqual(state.leverPose(2), {x:52,y:350});
});

test('lever follows downward dragging at desktop and scaled phone sizes', () => {
  assert.equal(typeof state.leverProgress, 'function');
  assert.equal(state.leverProgress(100,410,1),1);
  assert.equal(state.leverProgress(100,255,.5),1);
  assert.equal(state.leverProgress(100,80,1),0);
  assert.equal(state.leverProgress(100,255,1),.5);
});

test('chosen background survives reload, resets to none and ignores unknown images', async () => {
  const {readBackground,writeBackground} = await import('../src/lib/appearance.js');
  const data = new Map();
  const storage = {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  writeBackground('coast',storage);
  assert.equal(readBackground(storage),'coast');
  writeBackground('miami',storage);
  assert.equal(readBackground(storage),'miami');
  writeBackground('none',storage);
  assert.equal(readBackground(storage),'none');
  storage.setItem('lounge-background','https://unknown.invalid/tracker.jpg');
  assert.equal(readBackground(storage),'none');
  const unavailable={getItem(){throw new Error('disabled');},setItem(){throw new Error('disabled');}};
  assert.equal(readBackground(unavailable),'none');
  assert.doesNotThrow(()=>writeBackground('aurora',unavailable));
});
