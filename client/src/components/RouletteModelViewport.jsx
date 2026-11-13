import { useLanguage } from '../LanguageContext.jsx';
import {useEffect,useRef,useState} from 'react';
import RouletteWheelFallback from './RouletteWheelFallback.jsx';

export default function RouletteModelViewport({angles,spinning=false,duration=6200,interactive=false,exploded=false,overhead=false,selected=null,isolated=false,reset=0,number=null,reflections=true}){
  const { t } = useLanguage();
  const mount=useRef(null),engine=useRef(null),latest=useRef(null),lastReset=useRef(reset),[status,setStatus]=useState('loading');
  latest.current={angles,spinning,duration,exploded,overhead,selected,isolated,reflections};
  useEffect(()=>{
    let cancelled=false;
    import('../lib/roulette-renderer.js').then(({createRouletteRenderer})=>{
      if(cancelled)return;
      const current=latest.current;
      engine.current=createRouletteRenderer(mount.current,{angles:current.angles,interactive,onReady:()=>setStatus('ready'),onError:()=>setStatus('failed')});
      engine.current.setMotion(current.angles,current.spinning,current.duration);
      engine.current.setView({exploded:current.exploded,overhead:current.overhead,selected:current.selected,isolated:current.isolated,reflections:current.reflections});
    }).catch(()=>{if(!cancelled)setStatus('failed');});
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[interactive]);
  useEffect(()=>{engine.current?.setMotion(angles,spinning,duration);},[angles.wheel,angles.ball,spinning,duration]);
  useEffect(()=>{const changed=reset!==lastReset.current;lastReset.current=reset;engine.current?.setView({exploded,overhead,selected,isolated,reset:changed,reflections});},[exploded,overhead,selected,isolated,reset,reflections]);
  if(status==='failed')return <div className="roulette-model-fallback"><RouletteWheelFallback angles={angles} spinning={spinning} duration={duration} number={number}/><small>{t("Simplified wheel view")}</small></div>;
  return <div ref={mount} className={'roulette-model-canvas '+(interactive?'interactive':'')} data-model-state={status} role="img" aria-label={isolated&&selected?t("Isolated roulette wheel component"):exploded?t("Exploded roulette wheel showing individual assemblies"):spinning?t("Roulette rotor and ball spinning inside a stationary wooden cabinet"):number===null?t("Assembled roulette wheel in lacquered walnut and polished brass"):t('Roulette ball settled in pocket {0}', number)}>
    {status==='loading'?<span className="roulette-model-loading" role="status">{t("Preparing the wheel…")}</span>:null}
  </div>;
}
