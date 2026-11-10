import test from 'node:test';
import assert from 'node:assert/strict';

test('ball drops from the fixed track and is carried by its winning rotor pocket',async()=>{
  const {sampleRouletteMotion}=await import('../src/lib/roulette-motion.js');
  const from={wheel:0,ball:0},to={wheel:1853,ball:-3585.918918918919};
  const launch=sampleRouletteMotion(from,to,0),drop=sampleRouletteMotion(from,to,.68),finish=sampleRouletteMotion(from,to,1);
  assert.equal(launch.ballRadius,3.86);
  assert.ok(launch.ballHeight>.95);
  assert.ok(drop.ballRadius<3.86&&drop.ballRadius>2.43);
  assert.equal(finish.ballRadius,2.43);
  assert.equal(finish.ballHeight,.335);
  assert.equal(finish.wheel,to.wheel);
  assert.equal(finish.ball,to.ball);
  const captured=sampleRouletteMotion(from,to,.98);
  const relative=finish.ball-finish.wheel;
  assert.ok(Math.abs((captured.ball-captured.wheel)-relative)<.02,'captured ball follows the still-moving rotor');
  assert.ok(sampleRouletteMotion(from,to,.2).ball<launch.ball);
  assert.ok(sampleRouletteMotion(from,to,.2).wheel>launch.wheel);
});

test('only rotor parts turn; the housing, track and deflectors stay fixed',async()=>{
  const {buildRouletteModel}=await import('../src/lib/roulette-model.js');
  const model=buildRouletteModel();
  model.update({wheel:90,ball:-140,ballRadius:3.86,ballHeight:1.04,explosion:0});
  assert.equal(model.parts.housing.rotation.y,0);
  assert.equal(model.parts.track.rotation.y,0);
  assert.equal(model.parts.deflectors.rotation.y,0);
  assert.ok(Math.abs(model.rotor.rotation.y+Math.PI/2)<1e-9);
  assert.equal(model.pockets.length,37);
  assert.equal(model.separators.length,37);
  assert.ok(model.parts.numbers.parent===model.rotor);
  assert.ok(model.parts.pockets.parent===model.rotor);
  assert.ok(model.parts.turret.parent===model.rotor);
  const positions=Object.values(model.parts).map(p=>p.position.y);
  model.update({wheel:90,ball:-140,ballRadius:2.43,ballHeight:.335,explosion:1});
  assert.ok(model.parts.turret.position.y>model.parts.bowl.position.y);
  assert.ok(Object.values(model.parts).some((p,i)=>p.position.y!==positions[i]));
  model.dispose();
});

test('the 3D ball and labeled pocket share a world-space center at settlement',async()=>{
  const {buildRouletteModel}=await import('../src/lib/roulette-model.js');
  const {rouletteAngles,WHEEL}=await import('../src/lib/roulette.js');
  const model=buildRouletteModel();
  for(const number of [0,12,17,26,32]){
    const angles=rouletteAngles(0,0,number);
    model.update({...angles,ballRadius:2.43,ballHeight:.335,explosion:0});
    model.root.updateMatrixWorld(true);
    const pocket=model.pockets[WHEEL.indexOf(number)];
    const world=pocket.getWorldPosition(model.ball.position.clone());
    assert.ok(Math.hypot(world.x-model.ball.position.x,world.z-model.ball.position.z)<.00001,`ball must sit in pocket ${number}`);
  }
  model.dispose();
});

test('enamel pocket floors face upward and remain visible from the playing camera',async()=>{
  const {buildRouletteModel}=await import('../src/lib/roulette-model.js');
  const model=buildRouletteModel();
  for(const pocket of model.pockets){
    const g=pocket.children[0].geometry,p=g.attributes.position,index=g.index;
    const a=index.getX(0),b=index.getX(1),c=index.getX(2);
    const abx=p.getX(b)-p.getX(a),abz=p.getZ(b)-p.getZ(a),acx=p.getX(c)-p.getX(a),acz=p.getZ(c)-p.getZ(a);
    assert.ok(abz*acx-abx*acz>0,'top face must point toward the viewer above the table');
  }
  model.dispose();
});

test('roulette rolling audio is faster at launch and quiet once the ball is caught', async () => {
  const motion = await import('../src/lib/roulette-motion.js');
  const from = { wheel: 0, ball: 0 };
  const to = { wheel: 1853, ball: -3585.918918918919 };
  const launch = motion.sampleRouletteRoll(from, to, 0, 6200);
  const slowing = motion.sampleRouletteRoll(from, to, .45, 6200);
  const turbo = motion.sampleRouletteRoll(from, to, 0, 2800);
  assert.ok(launch.rate > slowing.rate && launch.gain > slowing.gain);
  assert.ok(turbo.rate > launch.rate);
  assert.equal(motion.sampleRouletteRoll(from, to, .8, 6200).gain, 0);
  assert.equal(motion.sampleRouletteRoll(from, to, 1, 6200).gain, 0);
});

test('the reflection switch removes enamel glare and restores the original finish', async () => {
  const {buildRouletteModel}=await import('../src/lib/roulette-model.js');
  const model=buildRouletteModel();
  const red=model.materials.red;
  const original={color:red.color.getHex(),clearcoat:red.clearcoat,roughness:red.roughness};
  model.highlight('numbers');
  const number=model.parts.numbers.children.find(mesh=>mesh.userData.baseMaterial===red);
  model.setReflections(false);
  for (const material of [red,number.material,model.materials.trackMaterial]) {
    assert.equal(material.clearcoat,0);
    assert.equal(material.specularIntensity,0);
  }
  assert.equal(red.color.getHex(),original.color);
  assert.equal(red.roughness,original.roughness);
  model.setReflections(true);
  assert.equal(red.clearcoat,original.clearcoat);
  assert.equal(number.material.clearcoat,original.clearcoat);
  assert.equal(red.specularIntensity,1);
  model.dispose();
});
