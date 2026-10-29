import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoSpin } from '../src/lib/auto-spin.js';

function clock() {
  let id = 0;
  const pending = new Map();
  return {
    schedule(fn) { pending.set(++id, fn); return id; },
    cancel(id) { pending.delete(id); },
    async next() { const entry = pending.entries().next().value; if (entry) { pending.delete(entry[0]); await entry[1](); } },
    get size() { return pending.size; },
  };
}

test('auto-spin waits for settlement and never starts two simultaneous rounds', async () => {
  const timer = clock(); let rounds = 0; let settle;
  const controller = createAutoSpin({ ...timer, status:()=>'spin', spin:async()=>{rounds++; await new Promise(r=>settle=r); return true;} });
  controller.start(); controller.start();
  const active = timer.next();
  assert.equal(rounds, 1);
  assert.equal(timer.size, 0);
  controller.start();
  assert.equal(timer.size, 0);
  settle(); await active;
  assert.equal(timer.size, 1);
  controller.stop();
  await timer.next();
  assert.equal(rounds, 1);
});

test('stopping during a spin allows that round to finish without a following round', async () => {
  const timer = clock(); let rounds = 0; let settle;
  const controller = createAutoSpin({ ...timer, status:()=>'spin', spin:async()=>{rounds++; await new Promise(r=>settle=r); return true;} });
  controller.start(); const active = timer.next(); controller.stop(); settle(); await active;
  assert.equal(controller.isEnabled(), false);
  assert.equal(timer.size, 0);
  assert.equal(rounds, 1);
});

test('unaffordable rounds and failed requests stop the controller', async () => {
  const timer = clock(); let rounds = 0; const reasons = [];
  const controller = createAutoSpin({...timer,status:()=>'funds',spin:async()=>{rounds++;return true;},onStop:r=>reasons.push(r)});
  controller.start(); await timer.next();
  assert.equal(rounds, 0); assert.deepEqual(reasons, ['funds']); assert.equal(timer.size, 0);
  const failed = createAutoSpin({...timer,status:()=>'spin',spin:async()=>false,onStop:r=>reasons.push(r)});
  failed.start(); await timer.next();
  assert.equal(failed.isEnabled(), false); assert.deepEqual(reasons, ['funds','error']);
});

test('a modal pauses scheduling and disposing cancels all future spins', async () => {
  const timer=clock(); let rounds=0; let state='wait';
  const controller=createAutoSpin({...timer,status:()=>state,spin:async()=>{rounds++;return true;}});
  controller.start(); await timer.next(); assert.equal(rounds,0); assert.equal(timer.size,1);
  state='spin'; await timer.next(); assert.equal(rounds,1);
  controller.dispose(); await timer.next(); assert.equal(rounds,1); assert.equal(timer.size,0);
});
