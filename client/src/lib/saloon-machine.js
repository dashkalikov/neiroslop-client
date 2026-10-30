const clamp=value=>Math.max(0,Math.min(1,value));
const angleFor=progress=>clamp(progress)*Math.PI*.75;
const camera=1700,cameraY=-400;

function project(point,angle){
  const y=point.y*Math.cos(angle)+point.z*Math.sin(angle);
  const z=-point.y*Math.sin(angle)+point.z*Math.cos(angle);
  const scale=camera/(camera-z);
  return {x:100+point.x*scale,y:600+(y-cameraY)*scale+cameraY,depth:z,scale};
}

export function saloonLeverPose(progress){
  const p=project({x:0,y:-430,z:0},angleFor(progress));
  return {...p,y:Math.round(p.y)};
}

export function saloonLeverProgress(startY,currentY,scale=1){
  const target=170+(currentY-startY)/Math.max(.1,scale);
  if(target<=170)return 0;
  if(target>=saloonLeverPose(1).y)return 1;
  let low=0,high=1;
  for(let i=0;i<20;i++){const mid=(low+high)/2;if(saloonLeverPose(mid).y<target)low=mid;else high=mid;}
  return (low+high)/2;
}

export function saloonLeverModel(progress){
  const p=clamp(progress),angle=angleFor(p),faces=[];
  function face(vertices,material,shade,index){
    const points=vertices.map(point=>project(point,angle));
    faces.push({points,material,shade,index,depth:points.reduce((n,v)=>n+v.depth,0)/points.length});
  }
  function cylinder(y1,y2,r1,r2,material='brass',segments=16){
    for(let i=0;i<segments;i++){
      const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      const vertices=[{x:Math.cos(a)*r1,y:y1,z:Math.sin(a)*r1},{x:Math.cos(b)*r1,y:y1,z:Math.sin(b)*r1},{x:Math.cos(b)*r2,y:y2,z:Math.sin(b)*r2},{x:Math.cos(a)*r2,y:y2,z:Math.sin(a)*r2}];
      const normal=(a+b)/2;
      const light=Math.max(0,Math.min(1,.48-Math.cos(normal)*.32+Math.sin(normal)*Math.cos(angle)*.38-Math.sin(normal)*Math.sin(angle)*.2));
      face(vertices,material,light,i);
    }
  }
  cylinder(-376,-15,10,13);
  cylinder(-350,-40,7.5,9,'steel',12);
  for(const [y,r] of [[-22,19],[-37,17],[-68,14],[-300,14],[-319,15],[-346,19],[-359,21],[-375,23],[-385,25]]){
    cylinder(y-3,y+3,r,r);
    cylinder(y-5,y-3,r-2,r,'groove');
  }
  cylinder(-398,-378,22,25);
  cylinder(-410,-398,18,22);
  cylinder(-538,-514,22,38,'crystal',8);
  cylinder(-514,-414,38,17,'crystal',8);
  cylinder(-414,-403,17,18,'crystal',8);
  face(Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4)*22,y:-538,z:Math.sin(i*Math.PI/4)*22})),'crystal',1,9);
  const top=project({x:0,y:-545,z:12},angle),bottom=project({x:0,y:-374,z:12},angle),center=project({x:0,y:-460,z:12},angle);
  const shaftTop=project({x:0,y:-385,z:13},angle),shaftBottom=project({x:0,y:-15,z:13},angle),shaftCenter=project({x:0,y:-200,z:13},angle);
  const frontSide=Math.cos(angle)>=0?1:-1;
  const engraving=Array.from({length:54},(_,i)=>{const t=i/53,x=Math.sin(t*Math.PI*8)*4;return project({x,y:-75-t*250,z:frontSide*Math.sqrt(10.5**2-x*x)},angle);});
  return {engraving,pose:saloonLeverPose(p),faces:faces.sort((a,b)=>a.depth-b.depth),gearAngle:p*180,secondaryGearAngle:-p*288,
    shaftFront:{x:shaftCenter.x-72.5*shaftCenter.scale,y:Math.min(shaftTop.y,shaftBottom.y),width:145*shaftCenter.scale,height:Math.abs(shaftBottom.y-shaftTop.y),opacity:Math.max(0,Math.cos(angle))**1.8},
    front:{x:center.x-59*center.scale,y:Math.min(top.y,bottom.y),width:118*center.scale,height:Math.abs(bottom.y-top.y),opacity:Math.max(0,Math.cos(angle))**1.8}};
}
