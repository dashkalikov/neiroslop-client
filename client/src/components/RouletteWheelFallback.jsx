import {memo,useId} from 'react';
import {WHEEL,numberColor} from '../lib/roulette.js';

const point=(r,a)=>[250+Math.sin(a*Math.PI/180)*r,250-Math.cos(a*Math.PI/180)*r];
function sector(r1,r2,start,end){const a=point(r1,start),b=point(r1,end),c=point(r2,end),d=point(r2,start);return `M${a}A${r1},${r1} 0 0 1 ${b}L${c}A${r2},${r2} 0 0 0 ${d}Z`;}
const WheelFace=memo(function WheelFace(){
  const id=useId().replaceAll(':','');
  return <svg viewBox="0 0 500 500" className="roulette-wheel-face" aria-hidden="true">
    <defs>
      <radialGradient id={id+'wood'}><stop stopColor="#50301d"/><stop offset=".7" stopColor="#251a13"/><stop offset=".8" stopColor="#784425"/><stop offset="1" stopColor="#25170f"/></radialGradient>
      <linearGradient id={id+'brass'} x2="1" y2="1"><stop stopColor="#4f341a"/><stop offset=".2" stopColor="#f3d798"/><stop offset=".45" stopColor="#a37439"/><stop offset=".55" stopColor="#f7e0a6"/><stop offset=".8" stopColor="#705025"/><stop offset="1" stopColor="#d7b67a"/></linearGradient>
      <radialGradient id={id+'bowl'} cx=".35" cy=".25"><stop stopColor="#876233"/><stop offset=".3" stopColor="#d1ae70"/><stop offset=".5" stopColor="#3b2b1b"/><stop offset=".95" stopColor="#72502c"/><stop offset="1" stopColor="#d6b777"/></radialGradient>
    </defs>
    <circle cx="250" cy="250" r="246" fill={'url(#'+id+'wood)'} stroke="#241810" strokeWidth="7"/>
    {[241,236,225,218,210,163,158].map((r,i)=><circle key={r} cx="250" cy="250" r={r} fill="none" stroke={i%2?'#cba86a':'#f4d59a'} opacity={i%2?.55:.85} strokeWidth={i===3?5:1.4}/>)}
    {Array.from({length:96},(_,i)=><path key={i} d={sector(238,244,i*3.75,i*3.75+.55)} fill="#d6aa6c" opacity=".35"/>)}
    <circle cx="250" cy="250" r="217" fill="#201b15" stroke="#b89a60" strokeWidth="2"/>
    {WHEEL.map((n,i)=>{const angle=i*360/37,position=point(196,angle),inner=point(163,angle-180/37),outer=point(210,angle-180/37);return <g key={n}>
      <path d={sector(210,163,angle-180/37,angle+180/37)} fill={n===0?'#1b7059':numberColor(n)==='red'?'#a22d37':'#151e20'} stroke="#b9945e" strokeWidth=".65"/>
      <path d={`M${inner}L${outer}`} stroke="#f2d493" strokeWidth="1.5"/>
      <text x={position[0]} y={position[1]} transform={`rotate(${angle} ${position[0]} ${position[1]})`} textAnchor="middle" dominantBaseline="central" fill="#fff2d6" fontFamily="Georgia,serif" fontSize="13" fontWeight="bold">{n}</text>
      <path d={sector(181,165,angle-180/37+.8,angle+180/37-.8)} fill="#0004"/>
    </g>;})}
    <circle cx="250" cy="250" r="157" fill={'url(#'+id+'bowl)'} stroke={'url(#'+id+'brass)'} strokeWidth="5"/>
    {Array.from({length:74},(_,i)=><path key={i} d={sector(153,48,i*360/74,i*360/74+1.6)} fill={i%2?'#fff4bd':'#1a160e'} opacity=".07"/>)}
    <circle cx="250" cy="250" r="114" fill="none" stroke="#e9c58b" strokeWidth=".7" opacity=".4"/>
    <circle cx="250" cy="250" r="56" fill={'url(#'+id+'wood)'} stroke="#d2ab6b" strokeWidth="4"/>
    <circle cx="250" cy="250" r="39" fill={'url(#'+id+'brass)'} stroke="#f4d596"/>
    <path d="M206 244Q250 235 294 244L294 256Q250 265 206 256ZM244 206Q235 250 244 294L256 294Q265 250 256 206Z" fill={'url(#'+id+'brass)'} stroke="#604526" strokeWidth="2"/>
    {[0,90,180,270].map(a=>{const p=point(47,a);return <circle key={a} cx={p[0]} cy={p[1]} r="10" fill={'url(#'+id+'brass)'} stroke="#ead09b"/>;})}
    <circle cx="250" cy="250" r="23" fill={'url(#'+id+'brass)'} stroke="#f2d9a4" strokeWidth="2"/><circle cx="245" cy="244" r="8" fill="#fff0be" opacity=".75"/>
  </svg>;
});

export default function RouletteWheel({angles,spinning,duration,number}){
  return <div className={'roulette-wheel-scene '+(spinning?'is-spinning':'')} role="img" aria-label={spinning?'Roulette wheel and ball spinning':number===null?'European roulette wheel with 37 pockets':`Ball settled on ${number}`} style={{'--roll-time':duration+'ms'}}>
    <div className="roulette-wheel-shadow"/><div className="roulette-wheel-perspective"><div className="roulette-rotor" style={{transform:`rotate(${angles.wheel}deg)`}}><WheelFace/></div>
      <div className="roulette-ball-orbit" style={{transform:`rotate(${angles.ball}deg)`}}><span className="roulette-ball"/></div><div className="roulette-wheel-reflection"/>
    </div><div className="roulette-wheel-plaque"><span>RIVIERA</span><small>EUROPEAN · SINGLE ZERO</small></div>
  </div>;
}
