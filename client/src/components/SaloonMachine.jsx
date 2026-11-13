import { useLanguage } from '../LanguageContext.jsx';
import {useRef,useState} from 'react';
import {formatCoins} from '../data/games.js';
import {MIN_BET,MAX_BET,nextBet} from '../lib/game-state.js';
import Icon from './Icon.jsx';
import Symbol from './Symbol.jsx';
import SaloonLever from './SaloonLever.jsx';
import SaloonControlPanel from './SaloonControlPanel.jsx';
import { CoinSpill } from './WinToken.jsx';

const bulbPoints=[[39.67,5.14],[60.19,4.87],[32.55,7.31],[67.49,6.96],[30.11,14.39],[69.9,14.48],[34.61,20.65],[63.92,20.69],[14.98,30.75],[84.5,30.83],[14.47,45.62],[85.23,45.51],[14.39,53.02],[85.27,53.14],[14.48,56.84],[85.31,56.81],[13.3,85.69],[86.16,85.6]];
function CabinetLighting(){
  return <div className="saloon-lighting" aria-hidden="true">
    {bulbPoints.map(([x,y],i)=><i key={i} className="saloon-bulb" style={{left:x+'%',top:y+'%','--phase':i*.19+'s'}}/>)}
    {['left','right'].map((side,index)=><div key={side} className={'saloon-lamp-fire '+side}>
      <span className="saloon-fire-aura"/><i className="saloon-fire-tongue outer"/><i className="saloon-fire-tongue inner"/><i className="saloon-fire-heart"/>
      {Array.from({length:9},(_,i)=><b className="saloon-ember" key={i} style={{'--delay':-(i*.47+index*.31)+'s','--drift':(((i*17)%31)-15)/8+'cqw','--rise':5+(i%4)*1.5+'cqw','--duration':2.2+(i%3)*.5+'s','--start':30+(i*13)%40+'%'}}/>)}
    </div>)}
    <span className="saloon-neon-bloom upper"/><span className="saloon-neon-bloom reels"/><span className="saloon-neon-bloom lower"/>
  </div>;
}

const velvetLampRows = [20.5, 26.8, 33.1, 39.4, 45.7, 52, 58.3, 64.6, 70.9];

function VelvetLighting() {
  return <div className="saloon-lighting velvet-lighting" aria-hidden="true">
    <span className="velvet-crown-glow" />
    <span className="velvet-reel-halo" />
    {velvetLampRows.map((y, index) => <i key={'left-'+y} className="saloon-bulb"
      style={{ left: '7.9%', top: y+'%', '--phase': index*.22+'s' }} />)}
    {velvetLampRows.map((y, index) => <i key={'right-'+y} className="saloon-bulb"
      style={{ left: '84.1%', top: y+'%', '--phase': index*.22+.14+'s' }} />)}
  </div>;
}

export default function MechanicalCabinet({game,skin,reels,state,onSpin,onBet,onLines,onTurbo,onPaytable,onHistory,autoButton}){
  const { t } = useLanguage();
  const [zoom,setZoom]=useState(false);
  const view=useRef(null);
  const {spinning,assetsReady,canStart,locked,blocked,freeSpins,bonusLength,multiplier,bet,betText,balance,lastWin,message,hasWin,result,showLines,turbo}=state;
  const disabled=spinning||!canStart||blocked;
  const velvet = skin.grip === 'ruby';
  const multiplierLabel = multiplier > 1 ? ' · '+multiplier+'×' : '';
  function toggleZoom(){
    setZoom(!zoom);
    requestAnimationFrame(()=>{if(view.current)view.current.scrollLeft=(view.current.scrollWidth-view.current.clientWidth)/2;});
  }
  return <div className={`saloon-layout ${velvet ? 'velvet-layout' : ''}`}>
    <div className="saloon-machine-wrap">
      <div ref={view} className={'saloon-cabinet-view '+(zoom?'enlarged':'')}>
        <div className={'saloon-machine '+(spinning?'saloon-rumbling ':'')+(hasWin&&!spinning?'saloon-winning':'')}>
          <img className="saloon-housing" src={skin.housing} alt={t(skin.artDescription)} fetchpriority="high"/>
          {velvet ? <VelvetLighting /> : <CabinetLighting />}
          {velvet ? <div className="velvet-marquee" aria-hidden="true">
            <small>{t("THE ART DECO COLLECTION")}</small>
            <strong>VELVET SEVENS</strong>
            <span>{t("MODEL 07") + " "}<i>◆</i>{" " + t("TOKEN PLAY")}</span>
          </div> : null}
          <div className="saloon-live-glass">
            <span className="saloon-glass-title">{t(skin.marquee)}</span>
            <div className="saloon-mini-paytable"><span><Symbol game={game} type="gem"/><b>{t("3 MATCH")}<small>{t("2× BET")}</small></b></span><span><Symbol game={game} type="wild"/><b>{t("3 WILDS")}<small>{t("10× BET")}</small></b></span><span><Symbol game={game} type="scatter"/><b>3 {t(skin.scatterLabel).toUpperCase()}<small>{bonusLength}{" " + t("FREE")}{multiplierLabel}</small></b></span></div>
            <div className="saloon-ledger"><span>{t("CREDITS")}<b>{balance===null?'—':formatCoins(balance)}</b></span><span>{t("BET")}<b>{bet??'—'}</b></span><span>{t("WIN")}<b>{formatCoins(lastWin)}</b></span></div>
            <div className={'saloon-round-status '+(hasWin?'won':'')} role="status" aria-live="polite">{message}</div>
            <div className="saloon-info-cover" aria-hidden="true"><i/></div>
          </div>
          <div className="saloon-live-reels">{reels}<div className="saloon-reel-glass" aria-hidden="true"><i className="saloon-glass-glint"/><i className="saloon-glass-edge"/></div></div>
          <div className="saloon-console" aria-label={t("Cabinet control panel")}>
            <div className="saloon-status-lamps" aria-hidden="true">{['READY','WILD','BONUS','WIN','PLAY'].map((label,i)=><span key={label} className={(!spinning&&i===0)||(i===2&&freeSpins)||(i===3&&hasWin)||(i===4&&spinning)?'lit':''} style={{'--lamp':(velvet?['#ffd184','#f5a3b2','#ff7d94','#ffe09f','#ffe2be']:['#f8ad6c','#f2a0d3','#ae8df2','#91efba','#83d8ef'])[i]}}><i/>{t(label)}</span>)}</div>
            <div className="saloon-console-main">
              <div className={'saloon-wager '+(bet===null?'invalid':'')}><button aria-label={t("Lower bet")} disabled={locked||bet===MIN_BET} onClick={()=>onBet(String(nextBet(bet||20,-1)))}>−</button><label htmlFor="saloon-wager"><span>{freeSpins?t("BONUS BET"):t("BET")}</span><input id="saloon-wager" aria-label={t("Wager in coins")} inputMode="numeric" pattern="[0-9]*" type="text" autoComplete="off" maxLength={7} value={betText} disabled={locked} onChange={e=>onBet(e.target.value)} aria-invalid={bet===null} aria-describedby="saloon-wager-help"/></label><button aria-label={t("Raise bet")} disabled={locked||bet===MAX_BET} onClick={()=>onBet(String(nextBet(bet||20,1)))}>+</button></div>
              <button className="saloon-start cabinet-key green-key" disabled={disabled} onClick={onSpin} aria-label={spinning?t("Reels spinning"):freeSpins?t("Play free spin"):t("Start machine")}><span>{spinning?t("SPINNING"):freeSpins?t("FREE SPIN"):'START'}</span><small>{freeSpins?freeSpins+" " + t("LEFT")+multiplierLabel:t("PULL OR PRESS")}</small></button>
              <div className="saloon-auto">{autoButton}</div>
              <button className="cabinet-key ruby-key" disabled={locked} onClick={()=>onBet(String(MAX_BET))} title={t("Set wager to 10,000 coins")} aria-label={t("Maximum bet")}>{t("MAX BET")}</button>
            </div>
            <div className="saloon-console-buttons"><button className="cabinet-key" onClick={onLines} aria-pressed={showLines}><Icon name="slots"/>{t("5 LINES")}</button><button className="cabinet-key" onClick={onPaytable}><Icon name="book"/>{t("RULES")}</button><button className="cabinet-key" onClick={onTurbo} aria-pressed={turbo}><Icon name="bolt"/>{t("QUICK")}</button><button className="cabinet-key" onClick={onHistory}><Icon name="clock"/>{t("HISTORY")}</button></div>
            <span id="saloon-wager-help" className={bet===null?'saloon-wager-error':''}>{bet===null?t("WHOLE COINS ONLY · 1–10,000"):freeSpins?t(skin.bonusName).toUpperCase()+" " + t("· TRIGGERING BET LOCKED"):t("VIRTUAL COINS · WINS CREDITED AUTOMATICALLY")}</span>
          </div>
          <div className="saloon-crystal-lever"><SaloonLever grip={skin.grip} disabled={disabled} spinning={spinning} onPull={onSpin}/></div>
          {result?.payout&&!spinning?<div className="saloon-payout" key={result.id} aria-hidden="true"><CoinSpill compact/></div>:null}
          {!assetsReady?<div className="saloon-preparing" role="status">{t(skin.preparing)}</div>:null}
        </div>
      </div>
      <div className="saloon-machine-tools"><span>{t(skin.footer)}</span><button onClick={toggleZoom} aria-pressed={zoom}><Icon name="search"/>{zoom?t("Fit cabinet"):t("Enlarge cabinet")}</button></div>
      <p className="saloon-play-note"><kbd>{t("SPACE")}</kbd>{" " + t("OR PULL THE") + " "}{t(skin.grip).toUpperCase()}{" " + t("LEVER · 3") + " "}{t(skin.scatterLabel).toUpperCase()} = {bonusLength}{" " + t("FREE SPINS")}{multiplier > 1 ? " " + t("WITH") + " "+multiplier+t("× WINS") : ''}</p>
    </div>
    <SaloonControlPanel game={game} skin={skin} state={state} onSpin={onSpin} onBet={onBet} onLines={onLines} onTurbo={onTurbo} onPaytable={onPaytable} onHistory={onHistory} autoButton={autoButton}/>
  </div>;
}
