import {useEffect,useId,useRef,useState} from 'react';
import {saloonLeverModel,saloonLeverProgress} from '../lib/saloon-machine.js';

export default function SaloonLever({disabled,spinning,onPull}){
  const [progress,setProgress]=useState(0);
  const current=useRef(0),origin=useRef(null),dragged=useRef(false),frame=useRef(null);
  const id=useId().replaceAll(':','');
  const model=saloonLeverModel(progress);
  const rearOpacity=Math.max(0,-Math.cos(progress*Math.PI*.75))**.7;
  function move(value){current.current=value;setProgress(value);}
  function springBack(from=current.current){
    cancelAnimationFrame(frame.current);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){move(0);return;}
    const start=performance.now();
    const tick=now=>{const t=Math.min(1,(now-start)/480);move(from*(1-t)**3);if(t<1)frame.current=requestAnimationFrame(tick);};
    frame.current=requestAnimationFrame(tick);
  }
  useEffect(()=>{
    if(!spinning)return;
    cancelAnimationFrame(frame.current);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){move(0);return;}
    const from=current.current,start=performance.now();
    const tick=now=>{
      const elapsed=now-start;
      if(elapsed<320){const t=elapsed/320;move(from+(1-from)*(1-(1-t)**3));}
      else if(elapsed<560)move(1);
      else{springBack(1);return;}
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  },[spinning]);
  useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
  function release(event,cancelled=false){
    if(!origin.current)return;
    const p=saloonLeverProgress(origin.current.y,event.clientY,origin.current.scale);
    origin.current=null;
    if(!cancelled&&!disabled&&p>=.55){dragged.current=true;onPull();}else springBack();
  }
  return <button className="saloon-lever" aria-label="Pull crystal lever to spin" disabled={disabled}
    onPointerDown={event=>{if(disabled)return;cancelAnimationFrame(frame.current);dragged.current=false;origin.current={y:event.clientY,scale:event.currentTarget.getBoundingClientRect().height/1200};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{if(!origin.current)return;const p=saloonLeverProgress(origin.current.y,event.clientY,origin.current.scale);dragged.current ||= p>.025;move(p);}}
    onPointerUp={event=>release(event)} onPointerCancel={event=>release(event,true)} onLostPointerCapture={event=>release(event,true)}
    onClick={event=>{if(!disabled&&(!dragged.current||event.detail===0))onPull();dragged.current=false;}}>
    <svg viewBox="0 0 200 1200" aria-hidden="true">
      <defs>
        <linearGradient id={id+'-gear'} x2=".8" y2="1"><stop stopColor="#f0cd91"/><stop offset=".23" stopColor="#6c4827"/><stop offset=".5" stopColor="#d3a567"/><stop offset=".72" stopColor="#3f2d1f"/><stop offset="1" stopColor="#af824a"/></linearGradient>
        <radialGradient id={id+'-cap'} cx=".3" cy=".25"><stop stopColor="#fff0b9"/><stop offset=".3" stopColor="#c99b59"/><stop offset=".7" stopColor="#51341e"/><stop offset="1" stopColor="#d5a66b"/></radialGradient>
        <pattern id={id+'-patina'} width="7" height="11" patternUnits="userSpaceOnUse"><path d="M0 2h2m3 5h1M2 10h2" stroke="#1d1b1499" strokeWidth=".6"/><path d="M1 3h1m3 5h1" stroke="#fff0c333" strokeWidth=".3"/></pattern>
      </defs>
      <rect x="72" y="559" width="54" height="84" rx="8" fill="#3f3022" stroke="#b08a54" strokeWidth="3"/>
      {[570,633].map(y=><g key={y}><circle cx="83" cy={y} r="4" fill="#d8ad71"/><path d={'M81 '+y+'h4'} stroke="#382719"/></g>)}
      {[{x:100,y:600,r:38,a:model.gearAngle},{x:153,y:642,r:24,a:model.secondaryGearAngle}].map((gear,i)=><g className="saloon-drive-gear" key={i} transform={'rotate('+gear.a+' '+gear.x+' '+gear.y+')'}>
        <path d={Array.from({length:80},(_,n)=>{const r=n%4<2?gear.r:gear.r*.86,a=n*Math.PI/40;return (n?'L':'M')+(gear.x+Math.cos(a)*r)+' '+(gear.y+Math.sin(a)*r);}).join(' ')+'Z'} fill={'url(#'+id+'-gear)'} stroke="#e0bb7f" strokeWidth="1.2"/>
        <circle cx={gear.x} cy={gear.y} r={gear.r*.7} fill="#342d22" stroke="#95723f" strokeWidth="4"/>
        {[0,1,2,3,4,5].map(n=><path key={n} d={'M'+gear.x+' '+gear.y+'l'+Math.cos(n*Math.PI/3)*gear.r*.64+' '+Math.sin(n*Math.PI/3)*gear.r*.64} stroke="#b28b54" strokeWidth="5"/>)}
        <circle cx={gear.x} cy={gear.y} r="9" fill={'url(#'+id+'-cap)'} stroke="#e5c28a"/>
      </g>)}
      <g className="saloon-lever-mesh" data-tilt={progress.toFixed(3)}>
        {model.faces.map((face,i)=>{const crystal=face.material==='crystal',hue=[178,193,225,261,278,312,154,206][face.index%8];const fill=crystal?'hsla('+hue+',75%,'+(42+face.shade*43)+'%,.88)':face.material==='groove'?'hsl(34,33%,'+(14+face.shade*20)+'%)':face.material==='steel'?'hsl(42,13%,'+(24+face.shade*60)+'%)':'hsl(35,60%,'+(14+face.shade*45)+'%)';return <g key={i}><polygon className={crystal?'saloon-crystal-facet':'saloon-metal-facet'} points={face.points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')} fill={fill} stroke={crystal?'#dbfff6aa':'#cba96d55'} strokeWidth={crystal?.65:.3}/>{!crystal?<polygon points={face.points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')} fill={'url(#'+id+'-patina)'} opacity=".45"/>:null}</g>;})}
      </g>
      <path className="saloon-shaft-engraving" d={model.engraving.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ')} fill="none" stroke="#422c1b" strokeWidth="1.7" opacity=".8"/>
      <path d={model.engraving.map((p,i)=>(i?'L':'M')+(p.x-.5).toFixed(2)+' '+(p.y-.5).toFixed(2)).join(' ')} fill="none" stroke="#f2d396" strokeWidth=".5" opacity=".8"/>
      <image className="saloon-shaft-art" href="/assets/saloon-arm-metal.png" {...model.shaftFront} preserveAspectRatio="none"/>
      <image className="saloon-shaft-art" href="/assets/saloon-arm-metal.png" {...model.shaftFront} opacity={rearOpacity} transform={'rotate(180 '+(model.shaftFront.x+model.shaftFront.width/2)+' '+(model.shaftFront.y+model.shaftFront.height/2)+')'} preserveAspectRatio="none"/>
      <image className="saloon-crystal-art" href="/assets/saloon-crystal-grip.png" x={model.front.x} y={model.front.y} width={model.front.width} height={model.front.height} opacity={model.front.opacity} preserveAspectRatio="none"/>
      <image className="saloon-crystal-art" href="/assets/saloon-crystal-grip.png" {...model.front} opacity={rearOpacity} transform={'rotate(180 '+(model.front.x+model.front.width/2)+' '+(model.front.y+model.front.height/2)+')'} preserveAspectRatio="none"/>
      <circle cx="100" cy="600" r="14" fill={'url(#'+id+'-cap)'} stroke="#a97e47" strokeWidth="2"/><circle cx="100" cy="600" r="6" fill="#624225" stroke="#e6c58d"/><path d="M96 600h8" stroke="#322719" strokeWidth="2"/>
    </svg>
  </button>;
}
