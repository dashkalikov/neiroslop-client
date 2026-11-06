import * as THREE from 'three';
import {WHEEL,numberColor} from './roulette.js';

export const WHEEL_PARTS=[
  {id:'housing',name:'Walnut housing',material:'Lacquered walnut & black plinth',detail:'The heavy, stationary cabinet supports the entire wheel.',lift:0},
  {id:'bearing',name:'Bearing assembly',material:'Steel hub & brass collar',detail:'A central bearing supports the independently rotating rotor.',lift:.4},
  {id:'track',name:'Ball track & apron',material:'Polished dark composite',detail:'The ball runs around the fixed outer track before falling down the sloped apron.',lift:.85},
  {id:'deflectors',name:'Diamond ball stops',material:'Twelve polished metal stops',detail:'Raised deflectors interrupt the ball’s path as it leaves the track.',lift:1.6},
  {id:'pockets',name:'Pocket bank',material:'37 wells & scalloped separators',detail:'Recessed pockets and raised separators catch and retain the ball.',lift:2.3},
  {id:'numbers',name:'Number ring',material:'Printed red, black & green enamel',detail:'The single-zero European sequence turns with the pocket bank.',lift:3.05},
  {id:'bowl',name:'Rotor bowl',material:'Walnut veneer & brass inlay',detail:'The curved inner bowl slopes down towards the pockets.',lift:3.8},
  {id:'turret',name:'Turret & cross-tree',material:'Turned brass & polished nickel',detail:'The raised spindle, collars and cross-tree are part of the rotating assembly.',lift:4.45},
  {id:'ball',name:'Ivory-colored ball',material:'Polished resin appearance',detail:'The ball counter-rotates, drops, bounces and settles into the returned pocket.',lift:5.4},
];
const radians=degrees=>degrees*Math.PI/180;
const radial=(radius,angle)=>[Math.sin(angle)*radius,-Math.cos(angle)*radius];

function wedge(inner,outer,start,end,top,thickness){
  const vertices=[],indices=[],steps=8;
  for(let i=0;i<=steps;i++){
    const a=start+(end-start)*i/steps;
    for(const y of [top,top-thickness])for(const r of [inner,outer]){const [x,z]=radial(r,a);vertices.push(x,y,z);}
  }
  for(let i=0;i<steps;i++){
    const a=i*4,b=(i+1)*4;
    indices.push(a,a+1,b+1,a,b+1,b,a+2,b+3,a+3,a+2,b+2,b+3,
      a,b,a+2,b,b+2,a+2,a+1,a+3,b+1,a+3,b+3,b+1);
  }
  indices.push(0,2,1,1,2,3,steps*4,steps*4+1,steps*4+2,steps*4+1,steps*4+3,steps*4+2);
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** Construct actual independent meshes. No DOM or renderer is required. */
export function buildRouletteModel(){
  const root=new THREE.Group(),rotor=new THREE.Group(),parts={},pockets=[],separators=[];
  root.name='Riviera Roulette assembly';rotor.name='Independent rotor';root.add(rotor);
  const wood=new THREE.MeshPhysicalMaterial({color:'#9d6440',roughness:.34,metalness:0,clearcoat:.85,clearcoatRoughness:.24});
  const woodBowl=wood.clone();woodBowl.color.set('#b27e52');
  const brass=new THREE.MeshStandardMaterial({color:'#dfbc76',metalness:.92,roughness:.24});
  const darkBrass=new THREE.MeshStandardMaterial({color:'#9d7540',metalness:.85,roughness:.3});
  const nickel=new THREE.MeshStandardMaterial({color:'#dfdfe0',metalness:.95,roughness:.19});
  const trackMaterial=new THREE.MeshPhysicalMaterial({color:'#222b29',roughness:.4,metalness:.08,clearcoat:.35,clearcoatRoughness:.32,envMapIntensity:.45});
  const plinth=new THREE.MeshStandardMaterial({color:'#101613',roughness:.46,metalness:.12});
  const enamel={};for(const [key,color] of Object.entries({red:'#9e1829',black:'#131918',green:'#126744'}))enamel[key]=new THREE.MeshPhysicalMaterial({color,roughness:.33,metalness:.08,clearcoat:.75,clearcoatRoughness:.23});
  const labelsMaterial=new THREE.MeshStandardMaterial({color:'#fff5db',transparent:true,alphaTest:.25,roughness:.7,depthWrite:false});
  const mats={wood,woodBowl,brass,darkBrass,nickel,trackMaterial,plinth,...enamel,labelsMaterial};
  for(const part of WHEEL_PARTS){if(part.id==='ball')continue;const group=new THREE.Group();group.name=part.name;group.userData.part=part.id;parts[part.id]=group;( ['pockets','numbers','bowl','turret'].includes(part.id)?rotor:root).add(group);}
  function mesh(parent,geometry,material,name){const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function lathe(parent,points,material,name){return mesh(parent,new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),128),material,name);}
  function ring(parent,radius,tube,y,material,name='Turned trim ring'){const m=mesh(parent,new THREE.TorusGeometry(radius,tube,8,160),material,name);m.rotation.x=Math.PI/2;m.position.y=y;return m;}
  function cylinder(parent,radius,height,y,material,name){const m=mesh(parent,new THREE.CylinderGeometry(radius,radius,height,96),material,name);m.position.y=y;return m;}
  lathe(parts.housing,[[3.95,-.25],[4.43,-.25],[4.53,-.12],[4.57,.12],[4.57,.7],[4.53,.88],[4.45,1.01],[4.34,1.06],[4.17,1.06],[4.04,1.0],[3.98,.88],[3.95,-.25]],wood,'Moulded walnut cabinet');
  lathe(parts.housing,[[3.8,-.43],[4.32,-.43],[4.43,-.35],[4.43,-.25],[3.8,-.25],[3.8,-.43]],plinth,'Ebonized support plinth');
  ring(parts.housing,4.49,.024,.02,darkBrass,'Lower brass stringing');ring(parts.housing,4.51,.019,.78,brass,'Upper brass stringing');ring(parts.housing,4.06,.025,1.0,brass,'Outer ball rail');
  for(let i=0;i<12;i++){const a=i*Math.PI/6,[x,z]=radial(4.29,a);const screw=mesh(parts.housing,new THREE.CylinderGeometry(.029,.029,.012,12),darkBrass,'Countersunk cabinet screw');screw.position.set(x,1.065,z);}
  cylinder(parts.bearing,.54,.22,-.08,nickel,'Main bearing');cylinder(parts.bearing,.4,.18,.1,darkBrass,'Bearing collar');cylinder(parts.bearing,.18,.7,.3,nickel,'Central axle');
  lathe(parts.track,[[3.08,.21],[3.95,.82],[4.0,.96],[4.0,1.0],[3.89,.98],[3.78,.86],[3.58,.66],[3.3,.43],[3.08,.32],[3.08,.21]],trackMaterial,'Continuous ball race and sloped stator');
  ring(parts.track,3.96,.023,.985,nickel,'Track rail');ring(parts.track,3.085,.018,.34,darkBrass,'Rotor clearance rim');
  const diamondGeometry=new THREE.OctahedronGeometry(.13,0);diamondGeometry.scale(.8,.42,1.35);
  for(let i=0;i<12;i++){const a=i*Math.PI/6+.07,[x,z]=radial(3.48,a);const d=mesh(parts.deflectors,diamondGeometry,nickel,'Fixed diamond stop '+(i+1));d.position.set(x,.66,z);d.rotation.y=-a;}
  lathe(parts.pockets,[[.43,.09],[2.67,.09],[2.67,.22],[.43,.22],[.43,.09]],plinth,'Rotor support plate with central bearing bore');
  const step=Math.PI*2/37;
  const finShape=new THREE.Shape();finShape.moveTo(-.23,0);finShape.lineTo(.23,0);finShape.lineTo(.23,.065);finShape.quadraticCurveTo(.13,.15,.005,.105);finShape.quadraticCurveTo(-.14,.15,-.23,.065);finShape.closePath();
  const finGeometry=new THREE.ExtrudeGeometry(finShape,{depth:.018,bevelEnabled:true,bevelSize:.007,bevelThickness:.006,bevelSegments:2,steps:1,curveSegments:6});finGeometry.rotateY(Math.PI/2);finGeometry.translate(-.009,0,0);
  for(let i=0;i<37;i++){
    const n=WHEEL[i],a=i*step,[x,z]=radial(2.43,a),pocket=new THREE.Group();pocket.name='Pocket '+n;pocket.userData.number=n;pocket.position.set(x,.23,z);parts.pockets.add(pocket);pockets.push(pocket);
    const geometry=wedge(2.19,2.665,a-step/2+.008,a+step/2-.008,.02,.04);geometry.translate(-x,0,-z);mesh(pocket,geometry,enamel[numberColor(n)],'Recessed enamel pocket floor');
    const fin=mesh(parts.pockets,finGeometry,brass,'Scalloped pocket separator '+i);const [fx,fz]=radial(2.43,a+step/2);fin.position.set(fx,.25,fz);fin.rotation.y=-a-step/2;separators.push(fin);
    mesh(parts.numbers,wedge(2.675,3.065,a-step/2+.004,a+step/2-.004,.4,.045),enamel[numberColor(n)],'Enamel number panel '+n);
  }
  ring(parts.pockets,2.18,.022,.29,brass,'Inner pocket lip');ring(parts.pockets,2.666,.018,.36,brass,'Outer pocket lip');
  ring(parts.numbers,3.066,.025,.4,nickel,'Number ring outer rail');ring(parts.numbers,2.675,.017,.405,brass,'Number ring inner rail');
  const numberLabels=mesh(parts.numbers,new THREE.RingGeometry(2.68,3.06,296),labelsMaterial,'Printed European number sequence');numberLabels.rotation.x=-Math.PI/2;numberLabels.position.y=.403;numberLabels.castShadow=false;numberLabels.visible=false;
  lathe(parts.bowl,[[.42,.18],[2.185,.18],[2.185,.26],[2.05,.28],[1.8,.37],[1.5,.49],[1.1,.65],[.75,.78],[.46,.82],[.42,.18]],woodBowl,'Curved walnut rotor cone');
  ring(parts.bowl,2.16,.023,.276,brass,'Bowl perimeter inlay');ring(parts.bowl,1.39,.011,.54,darkBrass,'Fine bowl stringing');ring(parts.bowl,.48,.03,.81,brass,'Spindle foot ring');
  lathe(parts.turret,[[.001,.34],[.34,.34],[.41,.4],[.42,.47],[.33,.54],[.23,.62],[.18,.8],[.15,1.06],[.2,1.15],[.25,1.21],[.26,1.29],[.2,1.36],[.15,1.43],[.145,1.62],[.24,1.68],[.28,1.73],[.27,1.8],[.17,1.85],[.12,1.98],[.001,1.98]],brass,'Turned brass central turret');
  for(const [y,r] of [[.47,.42],[.57,.28],[1.23,.265],[1.72,.282],[1.8,.26]])ring(parts.turret,r,.018,y,nickel,'Polished turret collar');
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2,arm=mesh(parts.turret,new THREE.CylinderGeometry(.048,.067,.77,20),brass,'Cross-tree arm '+i);
    arm.rotation.z=Math.PI/2;arm.rotation.y=-a;const [x,z]=radial(.56,a);arm.position.set(x,1.27,z);
    // A quaternion keeps the cylinder's axis aligned to the radial direction.
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.sin(a),0,-Math.cos(a)));
    const [ex,ez]=radial(.98,a),knob=mesh(parts.turret,new THREE.SphereGeometry(.105,24,16),nickel,'Cross-tree finial');knob.position.set(ex,1.27,ez);
  }
  const cap=mesh(parts.turret,new THREE.SphereGeometry(.145,32,20),brass,'Turret crown');cap.position.y=2.015;
  const ball=mesh(root,new THREE.SphereGeometry(.085,32,24),new THREE.MeshPhysicalMaterial({color:'#fffbdf',roughness:.14,metalness:0,clearcoat:1,clearcoatRoughness:.08}),'Ivory-colored resin ball');parts.ball=ball;ball.userData.part='ball';
  function update({wheel=0,ball:angle=0,ballRadius=2.43,ballHeight=.335,explosion=0}){
    rotor.rotation.y=-radians(wheel);
    for(const item of WHEEL_PARTS)if(item.id!=='ball')parts[item.id].position.y=item.lift*explosion;
    const [x,z]=radial(ballRadius,radians(angle));ball.position.set(x,ballHeight+5.4*explosion,z);
  }
  const highlightedMaterials=new Map();
  function highlight(id){
    root.traverse(object=>{
      if(!object.isMesh)return;
      object.userData.baseMaterial??=object.material;
      let part=object;while(part.parent&&part.userData.part===undefined)part=part.parent;
      const original=object.userData.baseMaterial;
      if(part.userData.part===id){
        if(!highlightedMaterials.has(original)){const material=original.clone();material.emissive?.set('#c8bd77');material.emissiveIntensity=.035;highlightedMaterials.set(original,material);}
        object.material=highlightedMaterials.get(original);
      }else object.material=original;
    });
  }
  function dispose(){const geometries=new Set(),materials=new Set(Object.values(mats));root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.userData.baseMaterial)materials.add(o.userData.baseMaterial);});highlightedMaterials.forEach(m=>materials.add(m));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  update({});
  return {root,rotor,parts,pockets,separators,ball,materials:mats,update,highlight,dispose,
    isolate(id){for(const part of WHEEL_PARTS)parts[part.id].visible=!id||part.id===id;},
    setWoodTexture(texture){wood.map=texture;wood.color.set('#ffffff');wood.needsUpdate=true;woodBowl.map=texture;woodBowl.color.set('#d5b494');woodBowl.needsUpdate=true;highlightedMaterials.forEach((m,base)=>{m.map=base.map;m.color.copy(base.color);m.needsUpdate=true;});},
    setNumberTexture(texture){labelsMaterial.map=texture;labelsMaterial.needsUpdate=true;numberLabels.visible=true;}};
}
