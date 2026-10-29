import {useEffect} from 'react';
import {createStartup} from '../lib/startup.js';

/** The static intro paints before the React bundle; this gate only manages its lifetime. */
export default function StartupGate(){
  useEffect(()=>{
    const screen=document.getElementById('startup-screen'),root=document.getElementById('root');
    if(!screen)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function release(){
      screen.classList.add('startup-leaving');
      root.removeAttribute('inert');root.removeAttribute('aria-hidden');
      document.documentElement.classList.remove('is-starting');
      if(screen.contains(document.activeElement)){
        const target=root.querySelector('main');target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});
      }
    }
    function remove(){screen.remove();window.dispatchEvent(new Event('neiroslop:ready'));}
    const controller=createStartup({minimum:reduced?250:2600,fade:reduced?0:650,onExit:release,onRemove:remove});
    const skip=document.getElementById('startup-skip');
    skip?.addEventListener('click',controller.skip);
    let cancelled=false;
    const artwork=[...screen.querySelectorAll('img')].map(image=>image.decode());
    Promise.allSettled(artwork).then(()=>{if(!cancelled)controller.ready();});
    return ()=>{cancelled=true;controller.dispose();skip?.removeEventListener('click',controller.skip);release();remove();};
  },[]);
  return null;
}
