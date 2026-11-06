import test from 'node:test';
import assert from 'node:assert/strict';

test('ball finishes in the returned wheel pocket after opposite rotations, including repeated spins',async()=>{
  const {rouletteAngles,WHEEL}=await import('../src/lib/roulette.js');
  let wheel=0,ball=0;
  for(const number of [0,32,26,17,0,36]){
    const next=rouletteAngles(wheel,ball,number);
    assert.ok(next.wheel>=wheel+1800);
    assert.ok(next.ball<=ball-3240);
    const relative=((next.ball-next.wheel)%360+360)%360;
    assert.ok(Math.abs(relative-WHEEL.indexOf(number)*360/37)<1e-7);
    wheel=next.wheel;ball=next.ball;
  }
});

test('chip placement aggregates positions and refuses unfunded or excessive wagers',async()=>{
  const {placeChip,totalStake}=await import('../src/lib/roulette.js');
  const first=placeChip([],{kind:'straight',value:0},7,100);
  const second=placeChip(first,{kind:'straight',value:0},7,100);
  assert.deepEqual(first,[{kind:'straight',value:0,amount:7}]);
  assert.equal(second[0].amount,14);
  assert.equal(totalStake(placeChip(second,{kind:'red'},3,100)),17);
  assert.throws(()=>placeChip(second,{kind:'red'},100,100));
  assert.throws(()=>placeChip([],{kind:'red'},10001,20000));
  assert.throws(()=>placeChip([],{kind:'red'},1.2,100));
});

test('game categories combine with search, favorites and theme filters',async()=>{
  const {filterCatalog}=await import('../src/lib/catalog.js');
  const games=[{id:'saloon',name:'Saloon Luck',category:'Mechanical',reels:3},
    {id:'roulette',name:'Riviera Roulette',category:'Table games',type:'table'},
    {id:'moon',name:'Moonlight Magic',category:'Fantasy'}];
  assert.deepEqual(filterCatalog(games,{group:'tables'}).map(g=>g.id),['roulette']);
  assert.deepEqual(filterCatalog(games,{group:'slots',query:'moon'}).map(g=>g.id),['moon']);
  assert.deepEqual(filterCatalog(games,{group:'mechanical'}).map(g=>g.id),['saloon']);
  assert.deepEqual(filterCatalog(games,{view:'favorites',favorites:['roulette'],group:'slots'}),[]);
  assert.deepEqual(filterCatalog(games,{theme:'Fantasy'}).map(g=>g.id),['moon']);
});
