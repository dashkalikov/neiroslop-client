import {useEffect,useRef,useState} from 'react';
import RouletteWheelFallback from './RouletteWheelFallback.jsx';

export default function RouletteModelViewport({angles,spinning=false,duration=6200,interactive=false,exploded=false,overhead=false,selected=null,isolated=false,reset=0,number=null}){
  const mount=useRef(null),engine=useRef(null),latest=useRef(null),lastReset=useRef(reset),[status,setStatus]=useState('loading');
  latest.current={angles,spinning,duration,exploded,overhead,selected,isolated};
  useEffect(()=>{
    let cancelled=false;
    import('../lib/roulette-renderer.js').then(({createRouletteRenderer})=>{
      if(cancelled)return;
      const current=latest.current;
      engine.current=createRouletteRenderer(mount.current,{angles:current.angles,interactive,onReady:()=>setStatus('ready'),onError:()=>setStatus('failed')});
      engine.current.setMotion(current.angles,current.spinning,current.duration);
      engine.current.setView({exploded:current.exploded,overhead:current.overhead,selected:current.selected,isolated:current.isolated});
    }).catch(()=>{if(!cancelled)setStatus('failed');});
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[interactive]);
  useEffect(()=>{engine.current?.setMotion(angles,spinning,duration);},[angles.wheel,angles.ball,spinning,duration]);
  useEffect(()=>{const changed=reset!==lastReset.current;lastReset.current=reset;engine.current?.setView({exploded,overhead,selected,isolated,reset:changed});},[exploded,overhead,selected,isolated,reset]);
  if(status==='failed')return <div className="roulette-model-fallback"><RouletteWheelFallback angles={angles} spinning={spinning} duration={duration} number={number}/><small>Simplified wheel view</small></div>;
  return <div ref={mount} className={'roulette-model-canvas '+(interactive?'interactive':'')} data-model-state={status} role="img" aria-label={isolated&&selected?'Isolated roulette wheel component':exploded?'Exploded roulette wheel showing individual assemblies':spinning?'Roulette rotor and ball spinning inside a stationary wooden cabinet':number===null?'Assembled roulette wheel in lacquered walnut and polished brass':`Roulette ball settled in pocket ${number}`}>
    {status==='loading'?<span className="roulette-model-loading" role="status">Preparing the wheel…</span>:null}
  </div>;
}
