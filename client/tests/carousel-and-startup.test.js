import test from 'node:test';
import assert from 'node:assert/strict';

function clock(){
  let now=0,id=0;const tasks=new Map();
  return {schedule(fn,delay){tasks.set(++id,{fn,at:now+delay});return id;},cancel(id){tasks.delete(id);},
    advance(ms){const end=now+ms;while(true){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at).find(([,task])=>task.at<=end);if(!next)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();}now=end;}};
}

test('featured images advance every ten seconds and wrap to the first game',async()=>{
  const {createCarousel}=await import('../src/lib/carousel.js');
  const time=clock(),shown=[];
  const carousel=createCarousel({ids:['bass','royal','moon'],onChange:id=>shown.push(id),...time});
  carousel.start();time.advance(9999);assert.deepEqual(shown,[]);
  time.advance(1);assert.deepEqual(shown,['royal']);
  time.advance(20000);assert.deepEqual(shown,['royal','moon','bass']);
  carousel.dispose();time.advance(30000);assert.equal(shown.length,3);
});

test('manual arrows wrap both ways and restart a full ten-second timer',async()=>{
  const {createCarousel}=await import('../src/lib/carousel.js');
  const time=clock(),shown=[];
  const carousel=createCarousel({ids:['bass','royal','moon'],onChange:id=>shown.push(id),...time});
  carousel.start();time.advance(9000);carousel.previous();
  assert.deepEqual(shown,['moon']);time.advance(9999);assert.equal(shown.length,1);
  time.advance(1);assert.deepEqual(shown,['moon','bass']);
  carousel.next();assert.equal(shown.at(-1),'royal');
  carousel.select('bass');time.advance(10000);assert.equal(shown.at(-1),'royal');
});

test('rotation can be paused while arrows still work, then resumed without duplicate timers',async()=>{
  const {createCarousel}=await import('../src/lib/carousel.js');
  const time=clock(),shown=[];
  const carousel=createCarousel({ids:['bass','royal','moon'],onChange:id=>shown.push(id),...time});
  carousel.start();carousel.start();carousel.pause();time.advance(20000);assert.deepEqual(shown,[]);
  carousel.next();assert.deepEqual(shown,['royal']);time.advance(20000);assert.equal(shown.length,1);
  carousel.start();time.advance(10000);assert.deepEqual(shown,['royal','moon']);
});

test('startup waits for both its minimum presentation and ready artwork, then exits once',async()=>{
  const {createStartup}=await import('../src/lib/startup.js');
  const time=clock(),events=[];
  const startup=createStartup({...time,onExit:()=>events.push('exit'),onRemove:()=>events.push('remove')});
  startup.ready();time.advance(2599);assert.deepEqual(events,[]);
  time.advance(1);assert.deepEqual(events,['exit']);
  time.advance(650);assert.deepEqual(events,['exit','remove']);
  startup.skip();time.advance(10000);assert.equal(events.length,2);
});

test('startup cannot get stuck on missing assets and can be skipped immediately',async()=>{
  const {createStartup}=await import('../src/lib/startup.js');
  const time=clock(),events=[];
  createStartup({...time,onExit:()=>events.push('exit'),onRemove:()=>events.push('remove')});
  time.advance(6999);assert.deepEqual(events,[]);
  time.advance(1);assert.deepEqual(events,['exit']);time.advance(650);assert.equal(events.at(-1),'remove');
  const skipped=createStartup({...time,onExit:()=>events.push('skip'),onRemove:()=>events.push('removed')});
  skipped.skip();assert.equal(events.at(-1),'skip');time.advance(650);assert.equal(events.at(-1),'removed');
});

test('disposing startup cancels all pending UI callbacks',async()=>{
  const {createStartup}=await import('../src/lib/startup.js');
  const time=clock(),events=[];
  const startup=createStartup({...time,onExit:()=>events.push('exit'),onRemove:()=>events.push('remove')});
  startup.ready();startup.dispose();time.advance(20000);assert.deepEqual(events,[]);
});
