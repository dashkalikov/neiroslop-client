import { useLanguage } from '../LanguageContext.jsx';
import {useEffect,useState} from 'react';
import {WHEEL_PARTS} from '../lib/roulette-model.js';
import RouletteModelViewport from './RouletteModelViewport.jsx';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';

export default function RouletteWheel({angles,spinning,duration,number,locked=false,fullScreen,fullscreenButton,onToggleFullscreen}){
  const { t } = useLanguage();
  const [inspect,setInspect]=useState(false),[overhead,setOverhead]=useState(false),[exploded,setExploded]=useState(false),[part,setPart]=useState(null),[reset,setReset]=useState(0),[isolated,setIsolated]=useState(false);
  const [reflections, setReflections] = useState(() => {
    try { return localStorage.getItem('lounge-wheel-reflections') !== 'off'; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('lounge-wheel-reflections', reflections ? 'on' : 'off'); }
    catch { /* The switch still works for this visit. */ }
  }, [reflections]);

  return <div className="roulette-physical-wheel" data-reflections={reflections}>
    <div className="roulette-wheel-display">
      <div className="roulette-wheel-viewbar">
        <span><i/>{" " + t("THE RIVIERA WHEEL")}</span>
        <div className="roulette-view-actions">
          <button aria-label={overhead?t("Switch to table view"):t("Switch to overhead view")} aria-pressed={overhead} onClick={()=>setOverhead(!overhead)}>
            <Icon name="grid"/>{overhead?t("Table view"):t("Overhead")}
          </button>
          <button aria-label={t("Wheel reflections")} aria-pressed={reflections} onClick={() => setReflections(!reflections)}>
            <Icon name="sun"/>{t("Reflections") + " "}{reflections ? t("on") : t("off")}
          </button>
          <button ref={fullscreenButton} aria-label={t("Full-screen wheel")} aria-pressed={fullScreen} onClick={onToggleFullscreen}>
            <Icon name={fullScreen ? 'minimize' : 'expand'}/>{fullScreen ? t("Exit full screen") : t("Full screen")}
          </button>
        </div>
      </div>
      <RouletteModelViewport angles={angles} spinning={spinning} duration={duration} number={number} overhead={overhead} reflections={reflections}/>
    </div>
    <div className="roulette-wheel-signature"><div><strong>RIVIERA</strong><span>{t("WALNUT · BRASS · SINGLE ZERO")}</span></div><button disabled={spinning||locked} onClick={()=>{setInspect(true);setExploded(false);setPart(null);setIsolated(false);}} aria-label={t("Explore wheel components")}><Icon name="settings"/>{" " + t("Explore the craftsmanship") + " "}<Icon name="arrow"/></button></div>
    {inspect?<Modal title={t("Inside the wheel.")} wide onClose={()=>setInspect(false)}><div className="wheel-inspector" onKeyDown={event=>event.stopPropagation()}>
      <p className="wheel-inspector-intro">{t("A closer look at the pieces behind every spin. Drag to rotate. Scroll or pinch to zoom.")}</p>
      <div className="wheel-inspector-toolbar"><div role="group" aria-label={t("Wheel assembly view")}><button aria-pressed={!exploded} onClick={()=>{setExploded(false);setIsolated(false);}}>{t("Assembled")}</button><button aria-pressed={exploded} onClick={()=>{setExploded(true);setIsolated(false);}}>{t("Exploded view")}</button></div><button disabled={!part} aria-pressed={isolated} onClick={()=>setIsolated(!isolated)}>{t("Isolate part")}</button><button aria-pressed={overhead} onClick={()=>setOverhead(!overhead)}><Icon name="grid"/>{t("Overhead")}</button><button onClick={()=>{setOverhead(false);setReset(n=>n+1);}}><Icon name="undo"/>{t("Reset view")}</button></div>
      <div className="wheel-inspector-layout"><div className="wheel-inspector-stage"><RouletteModelViewport angles={angles} duration={duration} number={number} interactive exploded={exploded} overhead={overhead} selected={part} isolated={isolated} reset={reset} reflections={reflections}/><p>{isolated&&part?t("Showing only") + " "+t(WHEEL_PARTS.find(p=>p.id===part).name)+'.':exploded?t("Nine assemblies, separated for a closer look."):t("The cabinet and track stay fixed. The central rotor turns.")}</p></div><div className="wheel-part-list" role="group" aria-label={t("Roulette wheel components")}>{WHEEL_PARTS.map((item,index)=><button key={item.id} aria-pressed={part===item.id} onClick={()=>{if(part===item.id){setPart(null);setIsolated(false);}else setPart(item.id);}}><b>{String(index+1).padStart(2,'0')}</b><span><strong>{t(item.name)}</strong><small>{t(item.material)}</small>{part===item.id?<p>{t(item.detail)}</p>:null}</span><i>{part===item.id?'−':'+'}</i></button>)}</div></div>
    </div></Modal>:null}
  </div>;
}
