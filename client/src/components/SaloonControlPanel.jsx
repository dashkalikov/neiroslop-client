import { useLanguage } from '../LanguageContext.jsx';
import {formatCoins} from '../data/games.js';
import {MIN_BET,MAX_BET,nextBet} from '../lib/game-state.js';
import Icon from './Icon.jsx';

export default function SaloonControlPanel({game,skin,state,onSpin,onBet,onLines,onTurbo,onPaytable,onHistory,autoButton}){
  const { t } = useLanguage();
  const {spinning,canStart,locked,blocked,freeSpins,bonusLength,multiplier,bet,betText,balance,lastWin,message,showLines,turbo,autoEnabled,autoRounds}=state;
  const winMultiplier = multiplier > 1 ? ' ' + t('· {0}× wins', multiplier) : '';
  return <aside className="saloon-modern-panel" aria-label={t("Modern play controls")}>
    <p className="saloon-panel-kicker"><span/>{" " + t("YOUR PLAY CONSOLE")}</p><h2>{game.name}</h2><p className="saloon-panel-intro">{t(skin.panelIntro)}</p>
    <div className="saloon-panel-balance"><span>{t("VIRTUAL BALANCE")}</span><strong><i>✦</i>{balance===null?'—':formatCoins(balance)}</strong><div><span>{t("Last win")}</span><b>+{formatCoins(lastWin)}</b></div></div>
    <label className="saloon-panel-label" htmlFor="saloon-panel-wager">{freeSpins?t("BONUS WAGER · LOCKED"):t("WAGER IN COINS")}</label>
    <div className={'saloon-panel-wager '+(bet===null?'invalid':'')}><button aria-label={t("Panel decrease wager")} disabled={locked||bet===MIN_BET} onClick={()=>onBet(String(nextBet(bet||20,-1)))}>−</button><input id="saloon-panel-wager" aria-label={t("Panel wager in coins")} value={betText} disabled={locked} onChange={e=>onBet(e.target.value)} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={7} autoComplete="off" aria-invalid={bet===null}/><button aria-label={t("Panel increase wager")} disabled={locked||bet===MAX_BET} onClick={()=>onBet(String(nextBet(bet||20,1)))}>+</button></div>
    <p className={'saloon-panel-hint '+(bet===null?'error':'')}>{bet===null?t("Enter a whole number from 1 to 10,000."):autoEnabled?t('Auto-spin on · {0} rounds completed.', autoRounds):freeSpins?t("Your triggering wager stays locked."):t("Whole coins · 1–10,000")}</p>
    <button className="saloon-panel-spin" aria-label={t("Panel spin")} onClick={onSpin} disabled={spinning||!canStart||blocked}><Icon name="spin"/><span>{spinning?t('Spinning'):freeSpins?t("Free spin"):t("Spin the reels")}<small>{freeSpins?freeSpins+" " + t("LEFT")+winMultiplier.toUpperCase():t("OR PULL THE") + " "+t(skin.grip).toUpperCase()+" " + t("LEVER")}</small></span><span>↗</span></button>
    <div className="saloon-panel-auto">{autoButton}</div>
    <div className="saloon-panel-status">{message}</div>
    <div className="saloon-panel-tools"><button onClick={onPaytable}><Icon name="book"/>{t("Paytable")}</button><button onClick={onHistory}><Icon name="clock"/>{t("History")}</button><button onClick={onTurbo} aria-pressed={turbo}><Icon name="bolt"/>{t("Quick spin")}</button><button onClick={onLines} aria-pressed={showLines}><Icon name="slots"/>{t("5 paylines")}</button></div>
    <div className="saloon-panel-bonus"><span aria-hidden="true">{skin.grip==='ruby'?'◆':'✧'}</span><div><small>{t(skin.bonusName).toUpperCase()}</small><strong>{freeSpins?freeSpins+" " + t("free spins left"):bonusLength+" " + t("free spins")+winMultiplier}</strong><p>{t("Land 3") + " "}{t(skin.scatterLabel)}{" " + t("anywhere.")}</p></div></div>
    <p className="saloon-panel-note">{t("VIRTUAL COINS ONLY · NO CASH VALUE")}</p>
  </aside>;
}
