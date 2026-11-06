import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';

test('Velvet Sevens shows the right side of the collar and turns it with the rigid lever', async () => {
  const { buildVelvetLeverRig } = await import('../src/lib/velvet-lever-rig.js');
  const rig = buildVelvetLeverRig();
  try {
    const position = part => part.getWorldPosition(new Vector3());
    assert.ok(rig.endFace, 'the rotating hub has a visible end face');
    const normal = rig.endFace.getWorldDirection(new Vector3());
    assert.ok(normal.x > .8 && normal.z > .2, 'the end face points right and is partly visible to the player');
    const rest = position(rig.grip);
    const pivot = position(rig.sleeve);
    const mark = position(rig.indexMark).sub(pivot);
    rig.setProgress(1);
    const pulled = position(rig.grip);
    const turnedMark = position(rig.indexMark).sub(pivot);
    assert.deepEqual(position(rig.sleeve), pivot);
    assert.ok(pulled.z > 250 && pulled.y < rest.y, 'the grip swings forward and down');
    assert.ok(Math.abs(pulled.length() - rest.length()) < 1e-6, 'the arm keeps its length');
    assert.ok(Math.abs(rest.angleTo(pulled) - mark.angleTo(turnedMark)) < 1e-6);
    assert.ok(normal.distanceTo(rig.endFace.getWorldDirection(new Vector3())) < 1e-6);
    rig.setProgress(0);
    assert.deepEqual(position(rig.grip), rest);
  } finally {
    rig.dispose();
  }
});

test('Velvet Sevens keeps the bearing fixed as the ruby approaches the player', async () => {
  const { velvetLeverArtwork } = await import('../src/lib/saloon-machine.js');
  const upright = velvetLeverArtwork(0);
  const pulled = velvetLeverArtwork(1);
  assert.deepEqual(pulled.mount, upright.mount);
  assert.ok(pulled.grip.y > upright.grip.y && pulled.grip.y + pulled.grip.height < 600);
  assert.ok(pulled.grip.width > upright.grip.width);
  assert.ok(pulled.shaft.height < upright.shaft.height);
  for (const progress of [0, .25, .5, .75, 1]) {
    const { grip, shaft, pin } = velvetLeverArtwork(progress);
    assert.ok(grip.y + grip.height >= shaft.y, 'the collar meets the shaft');
    assert.ok(shaft.y + shaft.height >= pin.y, 'the shaft meets the pivot pin');
  }
});

test('saloon lever tilts toward the viewer while remaining on its mounted centerline',async()=>{
  const {saloonLeverPose}=await import('../src/lib/saloon-machine.js');
  const upright=saloonLeverPose(0),forward=saloonLeverPose(.5),down=saloonLeverPose(1);
  assert.equal(upright.x,100);
  assert.equal(upright.y,170);
  assert.equal(upright.scale,1);
  assert.ok(upright.y < forward.y && forward.y < down.y && down.y < 600,
    'the grip should descend toward the viewer and stay above the pivot');
  const tilt = Math.asin(down.depth / 430) * 180 / Math.PI;
  assert.ok(tilt >= 30 && tilt <= 45, 'full pull should tilt 30 to 45 degrees from upright');
  assert.ok(upright.scale < forward.scale && forward.scale < down.scale);
  assert.deepEqual(saloonLeverPose(-1),upright);
  assert.deepEqual(saloonLeverPose(2),down);
  for(const p of [0,.2,.4,.6,.8,1,.8,.4,0])assert.equal(saloonLeverPose(p).x,100);
});

test('lever dragging follows the projected handle at desktop and half scale',async()=>{
  const {saloonLeverPose, saloonLeverProgress}=await import('../src/lib/saloon-machine.js');
  for (const scale of [1, .5]) {
    for (const progress of [.25, .55, .8, 1]) {
      const travel = (saloonLeverPose(progress).y - saloonLeverPose(0).y) * scale;
      assert.ok(Math.abs(saloonLeverProgress(100, 100 + travel, scale) - progress) < .005);
    }
  }
  assert.equal(saloonLeverProgress(100,100,1),0);
  assert.equal(saloonLeverProgress(100,90,1),0);
  assert.equal(saloonLeverProgress(100,2000,.5),1);
});

test('shaft and crystal are depth-sorted geometry and gears track lever movement',async()=>{
  const {saloonLeverModel}=await import('../src/lib/saloon-machine.js');
  const up=saloonLeverModel(0),half=saloonLeverModel(.5),down=saloonLeverModel(1);
  assert.ok(up.faces.length>100,'shaft collars and crystal facets must be modeled');
  assert.equal(up.gearAngle,0);
  assert.ok(0 < half.gearAngle && half.gearAngle < down.gearAngle && down.gearAngle < 90);
  assert.ok(down.secondaryGearAngle < half.secondaryGearAngle && half.secondaryGearAngle < 0);
  assert.ok(half.front.opacity<up.front.opacity,'front texture must turn away as side facets face the viewer');
  assert.ok(up.shaftFront.height>350,'engraved shaft material spans the long arm');
  assert.ok(half.shaftFront.height<up.shaftFront.height,'shaft material foreshortens with the arm');
  assert.ok(half.shaftFront.width>up.shaftFront.width,'shaft material widens as it approaches the viewer');
  assert.ok(down.shaftFront.opacity > 0,'the shallow pull keeps the engraved face visible');
  assert.notDeepEqual(half.faces.filter(f=>f.material==='crystal').map(f=>f.points),up.faces.filter(f=>f.material==='crystal').map(f=>f.points));
  for(const frame of [up,half,down]){
    assert.ok(frame.faces.every(face=>face.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
    assert.ok(frame.faces.every((face,i)=>!i||face.depth>=frame.faces[i-1].depth));
  }
});
