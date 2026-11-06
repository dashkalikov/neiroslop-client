import {useEffect,useId,useRef,useState} from 'react';
import {saloonLeverModel,saloonLeverProgress} from '../lib/saloon-machine.js';
import VelvetLeverHardware from './VelvetLeverHardware.jsx';

function facetFill({ material, shade, index }) {
  if (material === 'crystal') {
    const hue = [178,193,225,261,278,312,154,206][index % 8];
    return `hsla(${hue},75%,${42 + shade * 43}%,.88)`;
  }
  if (material === 'groove') return `hsl(34,33%,${14 + shade * 20}%)`;
  if (material === 'steel') return `hsl(42,13%,${24 + shade * 60}%)`;
  return `hsl(35,60%,${14 + shade * 45}%)`;
}

export default function SaloonLever({disabled,spinning,onPull,grip='crystal'}){
  const [progress,setProgress]=useState(0);
  const current=useRef(0),origin=useRef(null),dragged=useRef(false),frame=useRef(null),returning=useRef(false);
  function move(value){current.current=value;setProgress(value);}
  function springBack(from=current.current){
    cancelAnimationFrame(frame.current);
    if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      returning.current = false;
      move(0);
      return;
    }
    returning.current = true;
    move(from);
    const start=performance.now();
    const tick=now=>{
      const t=Math.min(1,(now-start)/300);
      move(from*(1-t)**3);
      if(t<1)frame.current=requestAnimationFrame(tick);
      else returning.current=false;
    };
    frame.current=requestAnimationFrame(tick);
  }
  useEffect(()=>{
    // A hand pull already has its own return. Simulate a pull only for other starts.
    if (!spinning || returning.current || origin.current) return;
    cancelAnimationFrame(frame.current);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){move(0);return;}
    const from=current.current,start=performance.now();
    const tick=now=>{
      const elapsed=now-start;
      if(elapsed<140){const t=elapsed/140;move(from+(1-from)*(1-(1-t)**3));}
      else{springBack(1);return;}
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  },[spinning]);
  useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
  function release(event,cancelled=false){
    const pointer = origin.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const p = cancelled ? current.current : saloonLeverProgress(pointer.y,event.clientY,pointer.scale);
    const startRound = !cancelled && !disabled && p >= .55;
    origin.current=null;
    if (startRound || cancelled) dragged.current = true;
    springBack(p);
    if (startRound) onPull();
  }
  return <button className="saloon-lever" aria-label={`Pull ${grip} lever to spin`} disabled={disabled}
    onPointerDown={event=>{
      if (disabled || event.button !== 0 || origin.current) return;
      cancelAnimationFrame(frame.current);
      returning.current = false;
      dragged.current = false;
      const { width, height } = event.currentTarget.getBoundingClientRect();
      origin.current = { id: event.pointerId, y: event.clientY, scale: Math.min(width / 200, height / 1200) };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event=>{
      const pointer = origin.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      const p = saloonLeverProgress(pointer.y,event.clientY,pointer.scale);
      dragged.current ||= Math.abs(event.clientY - pointer.y) > 3;
      move(p);
    }}
    onPointerUp={event=>release(event)} onPointerCancel={event=>release(event,true)} onLostPointerCapture={event=>release(event,true)}
    onClick={event=>{if(!disabled&&(!dragged.current||event.detail===0))onPull();dragged.current=false;}}>
    <svg viewBox="0 0 200 1200" aria-hidden="true">
      <g className="saloon-lever-mesh" data-tilt={progress.toFixed(3)}>
        {grip === 'ruby' ? <VelvetLeverHardware progress={progress} /> : <SaloonLeverHardware progress={progress} />}
      </g>
    </svg>
  </button>;
}

function SaloonLeverHardware({ progress }) {
  const id=useId().replaceAll(':','');
  const model=saloonLeverModel(progress);
  const gears = [{x:100,y:600,r:38,a:model.gearAngle},{x:153,y:642,r:24,a:model.secondaryGearAngle}];
  return <>
      <defs>
        <linearGradient id={id+'-gear'} x2=".8" y2="1"><stop stopColor="#f0cd91"/><stop offset=".23" stopColor="#6c4827"/><stop offset=".5" stopColor="#d3a567"/><stop offset=".72" stopColor="#3f2d1f"/><stop offset="1" stopColor="#af824a"/></linearGradient>
        <radialGradient id={id+'-cap'} cx=".3" cy=".25"><stop stopColor="#fff0b9"/><stop offset=".3" stopColor="#c99b59"/><stop offset=".7" stopColor="#51341e"/><stop offset="1" stopColor="#d5a66b"/></radialGradient>
        <pattern id={id+'-patina'} width="7" height="11" patternUnits="userSpaceOnUse"><path d="M0 2h2m3 5h1M2 10h2" stroke="#1d1b1499" strokeWidth=".6"/><path d="M1 3h1m3 5h1" stroke="#fff0c333" strokeWidth=".3"/></pattern>
      </defs>
      <rect x="72" y="559" width="54" height="84" rx="8" fill="#3f3022" stroke="#b08a54" strokeWidth="3"/>
      {[570,633].map(y=><g key={y}><circle cx="83" cy={y} r="4" fill="#d8ad71"/><path d={'M81 '+y+'h4'} stroke="#382719"/></g>)}
      {gears.map((gear,i)=><g className="saloon-drive-gear" key={i} transform={'rotate('+gear.a+' '+gear.x+' '+gear.y+')'}>
        <path d={Array.from({length:80},(_,n)=>{const r=n%4<2?gear.r:gear.r*.86,a=n*Math.PI/40;return (n?'L':'M')+(gear.x+Math.cos(a)*r)+' '+(gear.y+Math.sin(a)*r);}).join(' ')+'Z'} fill={'url(#'+id+'-gear)'} stroke="#e0bb7f" strokeWidth="1.2"/>
        <circle cx={gear.x} cy={gear.y} r={gear.r*.7} fill="#342d22" stroke="#95723f" strokeWidth="4"/>
        {[0,1,2,3,4,5].map(n=><path key={n} d={'M'+gear.x+' '+gear.y+'l'+Math.cos(n*Math.PI/3)*gear.r*.64+' '+Math.sin(n*Math.PI/3)*gear.r*.64} stroke="#b28b54" strokeWidth="5"/>)}
        <circle cx={gear.x} cy={gear.y} r="9" fill={'url(#'+id+'-cap)'} stroke="#e5c28a"/>
      </g>)}
      <g>
        {model.faces.map((face, i) => {
          const crystal = face.material === 'crystal';
          const points = face.points.map(p => p.x.toFixed(2) + ',' + p.y.toFixed(2)).join(' ');
          const stroke = crystal ? '#dbfff6aa' : '#cba96d55';
          return <g key={i}>
            <polygon className={crystal ? 'saloon-crystal-facet' : 'saloon-metal-facet'}
              points={points} fill={facetFill(face)} stroke={stroke} strokeWidth={crystal ? .65 : .3} />
            {!crystal ? <polygon points={points} fill={'url(#'+id+'-patina)'} opacity=".45" /> : null}
          </g>;
        })}
      </g>
      <path className="saloon-shaft-engraving" d={model.engraving.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ')} fill="none" stroke="#422c1b" strokeWidth="1.7" opacity=".8"/>
      <path d={model.engraving.map((p,i)=>(i?'L':'M')+(p.x-.5).toFixed(2)+' '+(p.y-.5).toFixed(2)).join(' ')} fill="none" stroke="#f2d396" strokeWidth=".5" opacity=".8"/>
      <image className="saloon-shaft-art" href="/assets/saloon-arm-metal.png" {...model.shaftFront} preserveAspectRatio="none"/>
      <image className="saloon-crystal-art" href="/assets/saloon-crystal-grip.png" {...model.front} preserveAspectRatio="none" />
      <circle cx="100" cy="600" r="14" fill={'url(#'+id+'-cap)'} stroke="#a97e47" strokeWidth="2"/><circle cx="100" cy="600" r="6" fill="#624225" stroke="#e6c58d"/><path d="M96 600h8" stroke="#322719" strokeWidth="2"/>
  </>;
}
