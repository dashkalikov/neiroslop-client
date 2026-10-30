import test from 'node:test';
import assert from 'node:assert/strict';

test('saloon lever tilts toward the viewer while remaining on its mounted centerline',async()=>{
  const {saloonLeverPose}=await import('../src/lib/saloon-machine.js');
  const upright=saloonLeverPose(0),forward=saloonLeverPose(.5),down=saloonLeverPose(1);
  assert.equal(upright.x,100);
  assert.equal(upright.y,170);
  assert.equal(upright.scale,1);
  assert.ok(forward.scale>1.25,'handle must grow as it approaches the viewer');
  assert.ok(forward.depth>down.depth);
  assert.ok(down.y>1000,'the long arm must pass below the mounting pivot');
  assert.deepEqual(saloonLeverPose(-1),upright);
  assert.deepEqual(saloonLeverPose(2),down);
  for(const p of [0,.2,.4,.6,.8,1,.8,.4,0])assert.equal(saloonLeverPose(p).x,100);
});

test('lever dragging follows the projected handle at desktop and half scale',async()=>{
  const {saloonLeverProgress}=await import('../src/lib/saloon-machine.js');
  assert.ok(Math.abs(saloonLeverProgress(100,437,1)-.5)<.005);
  assert.ok(Math.abs(saloonLeverProgress(100,268.5,.5)-.5)<.005);
  assert.equal(saloonLeverProgress(100,100,1),0);
  assert.equal(saloonLeverProgress(100,90,1),0);
  assert.equal(saloonLeverProgress(100,2000,.5),1);
});

test('shaft and crystal are depth-sorted geometry and gears track lever movement',async()=>{
  const {saloonLeverModel}=await import('../src/lib/saloon-machine.js');
  const up=saloonLeverModel(0),half=saloonLeverModel(.5),down=saloonLeverModel(1);
  assert.ok(up.faces.length>100,'shaft collars and crystal facets must be modeled');
  assert.equal(up.gearAngle,0);
  assert.equal(half.gearAngle,90);
  assert.equal(down.gearAngle,180);
  assert.equal(down.secondaryGearAngle,-288);
  assert.ok(half.front.opacity<up.front.opacity,'front texture must turn away as side facets face the viewer');
  assert.ok(up.shaftFront.height>350,'engraved shaft material spans the long arm');
  assert.ok(half.shaftFront.height<up.shaftFront.height,'shaft material foreshortens with the arm');
  assert.ok(half.shaftFront.width>up.shaftFront.width,'shaft material widens as it approaches the viewer');
  assert.equal(down.shaftFront.opacity,0,'back-facing arm uses modeled metal rather than a frontal photo');
  assert.notDeepEqual(half.faces.filter(f=>f.material==='crystal').map(f=>f.points),up.faces.filter(f=>f.material==='crystal').map(f=>f.points));
  for(const frame of [up,half,down]){
    assert.ok(frame.faces.every(face=>face.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
    assert.ok(frame.faces.every((face,i)=>!i||face.depth>=frame.faces[i-1].depth));
  }
});
