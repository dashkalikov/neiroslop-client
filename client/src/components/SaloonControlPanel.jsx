import {formatCoins} from '../data/games.js';
import {MIN_BET,MAX_BET,nextBet} from '../lib/game-state.js';
import Icon from './Icon.jsx';

export default function SaloonControlPanel({state,onSpin,onBet,onLines,onTurbo,onPaytable,onHistory,autoButton}){
  const {spinning,canStart,locked,blocked,freeSpins,bet,betText,balance,lastWin,message,showLines,turbo}=state;
  return <aside className="saloon-modern-panel" aria-label="Modern play controls">
    <p className="saloon-panel-kicker"><span/> YOUR PLAY CONSOLE</p><h2>Saloon Luck</h2><p className="saloon-panel-intro">Classic craft. Your kind of play.</p>
    <div className="saloon-panel-balance"><span>VIRTUAL BALANCE</span><strong><i>✦</i>{balance===null?'—':formatCoins(balance)}</strong><div><span>Last win</span><b>+{formatCoins(lastWin)}</b></div></div>
    <label className="saloon-panel-label" htmlFor="saloon-panel-wager">{freeSpins?'BONUS WAGER · LOCKED':'WAGER IN COINS'}</label>
    <div className={'saloon-panel-wager '+(bet===null?'invalid':'')}><button aria-label="Panel decrease wager" disabled={locked||bet===MIN_BET} onClick={()=>onBet(String(nextBet(bet||20,-1)))}>−</button><input id="saloon-panel-wager" aria-label="Panel wager in coins" value={betText} disabled={locked} onChange={e=>onBet(e.target.value)} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={7} autoComplete="off" aria-invalid={bet===null}/><button aria-label="Panel increase wager" disabled={locked||bet===MAX_BET} onClick={()=>onBet(String(nextBet(bet||20,1)))}>+</button></div>
    <p className={'saloon-panel-hint '+(bet===null?'error':'')}>{bet===null?'Enter a whole number from 1 to 10,000.':freeSpins?'Your triggering wager stays locked.':'Whole coins · 1–10,000'}</p>
    <button className="saloon-panel-spin" aria-label="Panel spin" onClick={onSpin} disabled={spinning||!canStart||blocked}><Icon name="spin"/><span>{spinning?'Spinning':freeSpins?'Free spin':'Spin the reels'}<small>{freeSpins?freeSpins+' LEFT · 2× WINS':'OR PULL THE CRYSTAL LEVER'}</small></span><span>↗</span></button>
    <div className="saloon-panel-auto">{autoButton}</div>
    <div className="saloon-panel-status">{message}</div>
    <div className="saloon-panel-tools"><button onClick={onPaytable}><Icon name="book"/>Paytable</button><button onClick={onHistory}><Icon name="clock"/>History</button><button onClick={onTurbo} aria-pressed={turbo}><Icon name="bolt"/>Quick spin</button><button onClick={onLines} aria-pressed={showLines}><Icon name="slots"/>5 paylines</button></div>
    <div className="saloon-panel-bonus"><span>✧</span><div><small>CRYSTAL RUSH</small><strong>{freeSpins?freeSpins+' free spins left':'8 free spins · 2× wins'}</strong><p>Land 3 crystals anywhere.</p></div></div>
    <p className="saloon-panel-note">VIRTUAL COINS ONLY · NO CASH VALUE</p>
  </aside>;
}
