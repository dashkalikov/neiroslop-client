import {useEffect,useRef,useState,useId} from 'react';
import {leverPose,leverProgress} from '../lib/game-state.js';

/** Rigid shaft pivots from upright to downward, preserving both end positions. */
export default function Lever({disabled,onPull,spinning}) {
  const [progress,setProgress]=useState(0);
  const current=useRef(0), origin=useRef(null), dragged=useRef(false), frame=useRef(null);
  const id=useId().replaceAll(':','');
  const pose=leverPose(progress);
  function move(value) {current.current=value;setProgress(value);}
  function cycle(from=current.current,returnOnly=false) {
    cancelAnimationFrame(frame.current);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){move(0);return;}
    const started=performance.now();
    const tick=now=>{
      const elapsed=now-started;
      if(returnOnly){const t=Math.min(1,elapsed/300);move(from*(1-t)**3);if(t<1)frame.current=requestAnimationFrame(tick);return;}
      if(elapsed<220){const t=elapsed/220;move(from+(1-from)*(1-(1-t)**3));}
      else if(elapsed<380)move(1);
      else {const t=Math.min(1,(elapsed-380)/380);move((1-t)**3);if(t===1)return;}
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  useEffect(()=>{if(spinning)cycle();},[spinning]);
  useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
  function release(event,cancelled=false) {
    if(!origin.current)return;
    const p=leverProgress(origin.current.y,event.clientY,origin.current.scale);
    origin.current=null;
    if(!cancelled&&!disabled&&p>=.55){dragged.current=true;onPull();}
    else cycle(current.current,true);
  }
  return <div className="mechanical-lever pivot-lever">
    <span className="lever-upper-label" aria-hidden="true">PULL<br/><b>↓</b></span>
    <button className="lever-handle pivot-handle" aria-label="Pull lever to spin" disabled={disabled}
      onPointerDown={event=>{if(disabled)return;cancelAnimationFrame(frame.current);dragged.current=false;origin.current={y:event.clientY,scale:event.currentTarget.getBoundingClientRect().height/390};event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{if(!origin.current)return;const p=leverProgress(origin.current.y,event.clientY,origin.current.scale);dragged.current ||= p>.025;move(p);}}
      onPointerUp={event=>release(event)} onPointerCancel={event=>release(event,true)} onLostPointerCapture={event=>release(event,true)}
      onClick={event=>{if(!disabled&&(!dragged.current||event.detail===0))onPull();dragged.current=false;}}>
      <svg viewBox="0 0 104 390" aria-hidden="true">
        <defs>
          <linearGradient id={id+'-steel'} gradientUnits="userSpaceOnUse" x1="42" y1="0" x2="62" y2="0"><stop stopColor="#4d4840"/><stop offset=".22" stopColor="#d5d7ce"/><stop offset=".46" stopColor="#fffff2"/><stop offset=".68" stopColor="#aaa895"/><stop offset="1" stopColor="#59523c"/></linearGradient>
          <linearGradient id={id+'-brass'} x2=".2" y2="1"><stop stopColor="#ffdfa0"/><stop offset=".3" stopColor="#775532"/><stop offset=".55" stopColor="#d5b373"/><stop offset="1" stopColor="#684725"/></linearGradient>
          <radialGradient id={id+'-ruby'} cx=".3" cy=".24" r=".8"><stop stopColor="#ffd4bc"/><stop offset=".18" stopColor="#ff6a65"/><stop offset=".4" stopColor="#da233b"/><stop offset=".7" stopColor="#8b1227"/><stop offset="1" stopColor="#350612"/></radialGradient>
        </defs>
        <rect x="9" y="163" width="82" height="65" rx="22" fill={'url(#'+id+'-brass)'} stroke="#edcf91" strokeWidth="1.5"/>
        <circle cx="52" cy="195" r="25" fill="#4b3826" stroke="#e7c78e" strokeWidth="3"/>
        <circle cx="52" cy="195" r="18" fill={'url(#'+id+'-steel)'} stroke="#5b492e" strokeWidth="2"/>
        <line x1="55" y1="199" x2={pose.x+3} y2={pose.y+4} stroke="#0006" strokeWidth="18" strokeLinecap="round"/>
        <line x1="52" y1="195" x2={pose.x} y2={pose.y} stroke="#4d4030" strokeWidth="19" strokeLinecap="round"/>
        <line x1="52" y1="195" x2={pose.x} y2={pose.y} stroke={'url(#'+id+'-steel)'} strokeWidth="16" strokeLinecap="round"/>
        <circle cx="52" cy="195" r="7" fill={'url(#'+id+'-brass)'} stroke="#e4c58f"/>
        <circle className="grip-shadow" cx={pose.x+2} cy={pose.y+4} r="34" fill="#0005"/>
        <circle className="ruby-grip" cx={pose.x} cy={pose.y} r="33" fill={'url(#'+id+'-ruby)'} stroke="#f4828a" strokeWidth="1"/>
        <ellipse cx={pose.x-8} cy={pose.y-12} rx="11" ry="5" fill="#fff6" transform={'rotate(-25 '+(pose.x-8)+' '+(pose.y-12)+')'}/>
      </svg>
    </button>
    <span className="lever-instruction">ONE PULL<br/>ONE SPIN</span>
  </div>;
}

