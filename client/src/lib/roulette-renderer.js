import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildRouletteModel} from './roulette-model.js';
import {sampleRouletteMotion} from './roulette-motion.js';
import {WHEEL} from './roulette.js';

function numberTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
  const context=canvas.getContext('2d');context.translate(1024,1024);context.fillStyle='#fff7e4';context.font='600 61px Georgia,serif';context.textAlign='center';context.textBaseline='middle';
  for(let i=0;i<37;i++){context.save();context.rotate(i*Math.PI*2/37);context.fillText(String(WHEEL[i]),0,-954);context.restore();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function brushedTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle='#d8d8d8';c.fillRect(0,0,256,256);
  for(let y=0;y<256;y++){const v=180+Math.round((Math.sin(y*31.7)+1)*25);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(0,y,256,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,1);return texture;
}

/** Own GPU resources and render on demand; React never updates per-frame geometry. */
export function createRouletteRenderer(element,{angles,interactive=false,onReady,onError}){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');element.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,80);
  camera.position.set(0,11.2,9.1);camera.lookAt(0,.3,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.045);scene.environment=environment.texture;scene.environmentIntensity=.7;room.dispose();pmrem.dispose();
  const model=buildRouletteModel();scene.add(model.root);
  scene.add(new THREE.HemisphereLight('#fff1d9','#213c32',1.1));
  const key=new THREE.DirectionalLight('#fff1db',2.2);key.position.set(-5,10,5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:28});key.shadow.bias=-.0002;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
  const fill=new THREE.DirectionalLight('#d2e5ff',1.2);fill.position.set(6,5,-5);scene.add(fill);
  const rim=new THREE.DirectionalLight('#ffd392',.85);rim.position.set(-5,3,-6);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(35,35),new THREE.ShadowMaterial({opacity:.35}));floor.rotation.x=-Math.PI/2;floor.position.y=-.45;floor.receiveShadow=true;scene.add(floor);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=interactive;controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=8;controls.maxDistance=28;controls.minPolarAngle=.05;controls.maxPolarAngle=1.36;controls.target.set(0,.45,0);controls.update();
  const textures=new Set(),numbers=numberTexture(),brush=brushedTexture();textures.add(numbers);textures.add(brush);model.setNumberTexture(numbers);
  for(const m of [model.materials.brass,model.materials.nickel,model.materials.darkBrass]){m.roughnessMap=brush;m.needsUpdate=true;}
  let frame=0,disposed=false,visible=true,motion=null,explosion=0,targetExplosion=0,cameraMove=null,cameraViewKey='';
  let pose={...angles,ballRadius:2.43,ballHeight:.335};
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function invalidate(){if(!disposed&&visible&&!frame)frame=requestAnimationFrame(draw);}
  function draw(now){
    frame=0;if(disposed||!visible)return;
    let active=false;
    if(motion){const t=Math.min(1,(now-motion.start)/motion.duration);pose=sampleRouletteMotion(motion.from,motion.to,t);if(t<1)active=true;else motion=null;}
    if(Math.abs(targetExplosion-explosion)>.001){explosion=reduced()?targetExplosion:THREE.MathUtils.lerp(explosion,targetExplosion,.12);active=true;}else explosion=targetExplosion;
    if(cameraMove){const t=Math.min(1,(now-cameraMove.start)/650),e=1-(1-t)**3;camera.position.lerpVectors(cameraMove.from,cameraMove.to,e);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.toTarget,e);if(t<1)active=true;else cameraMove=null;}
    model.update({...pose,explosion});
    if(controls.update())active=true;
    renderer.render(scene,camera);
    if(active)invalidate();
  }
  controls.addEventListener('change',invalidate);
  const resize=new ResizeObserver(()=>{const {width,height}=element.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();});resize.observe(element);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();});observer.observe(element);
  const contextLost=event=>{event.preventDefault();onError?.();};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  new THREE.TextureLoader().load('/assets/roulette-walnut-burl.png',texture=>{
    if(disposed){texture.dispose();return;}
    texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,1);texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);model.setWoodTexture(texture);invalidate();
  },undefined,()=>{ /* The shaded walnut material remains usable if a texture is unavailable. */ });
  invalidate();onReady?.();
  return {
    setMotion(next,spinning,duration){
      if(spinning){motion={from:{wheel:pose.wheel,ball:pose.ball},to:next,start:performance.now(),duration:reduced()?1:duration};}
      else{motion=null;pose={...next,ballRadius:2.43,ballHeight:.335};}
      invalidate();
    },
    setView({exploded=false,overhead=false,selected=null,isolated=false,reset=false,reflections=true}){
      scene.environmentIntensity = reflections ? .7 : .32;
      model.setReflections(reflections);
      const isolate=isolated&&selected;
      targetExplosion=exploded&&!isolate?1:0;model.highlight(selected);model.isolate(isolate);
      const to=overhead?new THREE.Vector3(.01,exploded?20:14.5,.01):new THREE.Vector3(interactive?6.3:0,exploded?15:11.2,exploded?15:9.1);
      const toTarget=new THREE.Vector3(0,exploded?2.8:.3,0);
      controls.minDistance=8;
      if(isolate){
        model.update({...pose,explosion:0});model.root.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(model.parts[selected]),size=box.getSize(new THREE.Vector3());
        const distance=Math.max(.8,Math.max(size.x,size.z,size.y*1.2)*1.75);box.getCenter(toTarget);
        to.copy(overhead?new THREE.Vector3(.001,1,.001):new THREE.Vector3(.5,.8,.85)).normalize().multiplyScalar(distance).add(toTarget);
        controls.minDistance=Math.max(.18,distance*.4);
      }
      const key=exploded+':'+overhead+':'+(isolate||'all');
      if(reset||key!==cameraViewKey){cameraMove={from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget,start:performance.now()};cameraViewKey=key;}
      invalidate();
    },
    dispose(){
      disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);model.dispose();textures.forEach(t=>t.dispose());floor.geometry.dispose();floor.material.dispose();key.shadow.map?.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
