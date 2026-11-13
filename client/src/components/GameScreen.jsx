import { useLanguage } from '../LanguageContext.jsx';
import { useEffect, useRef, useState } from 'react';
import { asset, formatCoins } from '../data/games.js';
import { useLounge } from '../LoungeContext.jsx';
import { api } from '../lib/api.js';
import { INITIAL_GRID, nextBet, PAYLINES, CLASSIC_PAYLINES, parseWager, autoAction, MIN_BET, MAX_BET } from '../lib/game-state.js';
import { createAutoSpin } from '../lib/auto-spin.js';
import { mechanicalCabinets } from '../lib/mechanical-cabinets.js';
import { VELVET_LEVER_IMAGE, VELVET_LEVER_MOUNT_IMAGE } from '../lib/saloon-machine.js';
import { playTone, playColumnLandings, prepareSlotAudio, stopGameEffects } from '../lib/audio.js';
import Icon from './Icon.jsx';
import Symbol from './Symbol.jsx';
import CoinRain from './CoinRain.jsx';
import { MineDetails } from './CabinetDetails.jsx';
import BassDetails from './BassDetails.jsx';
import MechanicalCabinet from './SaloonMachine.jsx';
import PaylinePicker from './PaylinePicker.jsx';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const symbols = ['gem','star','orb','crown','leaf','wild','scatter'];
const spinningGrid = Array.from({length:5}, (_,c) => Array.from({length:9}, (_,r) => symbols[(r%3+c*2)%symbols.length]));
const tallSpinningGrid = Array.from({ length: 5 }, (_, column) =>
  Array.from({ length: 18 }, (_, row) => symbols[(row % 6 + column * 2) % symbols.length]));
const lineColors = ['#eaca87','#b3a1ff','#86decc','#f4a5d7','#a5d5ff'];

export default function GameScreen({ game, navigate }) {
  const { t, language } = useLanguage();
  const coins = value => formatCoins(value, language);
  const lounge = useLounge();
  const { player, setPlayer, catalog, setHistory, notify, reload, setBusy, setModal, modal, sound, setSound, turbo, setTurbo } = lounge;
  const rules = catalog.find(g => g.id === game.id);
  const reelCount = rules?.reels || game.reels || 5;
  const rowCount = rules?.rows ?? game.rows ?? 3;
  const tallReels = rowCount === 6;
  const bonusLength = rules?.bonus || game.bonus;
  const bonus = player?.rounds.find(r => r.game === game.id);
  const fishing=game.id==='bigbass';
  const multiplier = fishing ? (bonus?.feature?.batches?.[0]?.multiplier||1) : rules?.multiplier || game.multiplier || (game.id === 'neon' ? 2 : 1);
  const paylines = Array.isArray(rules?.paylines) ? rules.paylines : game.paylines || (reelCount === 3 ? CLASSIC_PAYLINES : PAYLINES);
  const cabinetSkin = mechanicalCabinets[game.id];
  const mining = Boolean(game.cascading);
  const freeSpins = bonus?.remaining || 0;
  const [betText, setBetText] = useState(String(freeSpins ? bonus.bet : player?.preferences?.defaultBet||20));
  const bet = freeSpins ? bonus.bet : parseWager(betText);
  const [grid, setGrid] = useState(() => game.initialGrid || INITIAL_GRID.slice(0, reelCount).map((reel, column) =>
    game.rows === 6 ? [...reel, ...INITIAL_GRID[(column + 2) % INITIAL_GRID.length]] : reel));
  const [moneyFish,setMoneyFish]=useState([]);
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState(reelCount);
  const [result, setResult] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState(cabinetSkin ? 'READY · PULL HANDLE OR PRESS SPIN' : 'Your next escape begins with a spin.');
  const [showLines, setShowLines] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoRounds, setAutoRounds] = useState(0);
  const [cascade, setCascade] = useState(0);
  const [collected, setCollected] = useState(0);
  const [tumbling, setTumbling] = useState(false);
  const [cascadeFrame, setCascadeFrame] = useState(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const spinRef = useRef(null);
  const requestRef = useRef(null);
  const controllerRef = useRef(null);
  const latest = useRef(null);

  latest.current = { ready:Boolean(player && assetsReady), paused:Boolean(modal || celebration), spinning,
    balance:player?.balance || 0, bet, freeSpins, turbo, sound, won:Boolean(result?.payout) };

  useEffect(() => {
    prepareSlotAudio();
    mounted.current = true;
    controllerRef.current = createAutoSpin({
      spin:() => spinRef.current('auto'),
      status:() => autoAction(latest.current),
      delay:() => latest.current.won ? 1600 : latest.current.turbo ? 350 : 700,
      onChange:enabled => { if (mounted.current) setAutoEnabled(enabled); },
      onStop:reason => {
        if (!mounted.current) return;
        if (reason === 'funds') notify('Auto-spin stopped: not enough coins for the next bet.');
        if (reason === 'invalid') notify('Auto-spin stopped: enter a whole-coin wager from 1 to 10,000.',true);
      },
    });
    return () => { mounted.current = false; controllerRef.current.dispose(); stopGameEffects(); setBusy(false); };
  }, [notify,setBusy]);

  useEffect(() => {
    const sources=[game.symbolAsset||asset(game.id,'symbols')];
    if (cabinetSkin) {
      sources.push(cabinetSkin.housing, asset(game.id));
      if (cabinetSkin.grip === 'ruby') sources.push(VELVET_LEVER_IMAGE, VELVET_LEVER_MOUNT_IMAGE);
      else sources.push('/assets/saloon-arm-metal.png', '/assets/saloon-crystal-grip.png');
    }
    let cancelled = false;
    Promise.all(sources.map(source=>{const image=new Image();image.src=source;return image.decode();})).then(() => { if (!cancelled) setAssetsReady(true); }).catch(() => {
      if (!cancelled) notify('The artwork could not load. Refresh to try again.',true);
    });
    return () => { cancelled = true; };
  }, [game.id,game.symbolAsset,notify,cabinetSkin]);
  useEffect(() => { if (freeSpins) setBetText(String(bonus.bet)); }, [freeSpins,bonus?.bet]);
  const preferenceApplied=useRef(Boolean(player));
  useEffect(()=>{if(!preferenceApplied.current&&player){preferenceApplied.current=true;if(!freeSpins&&!busyRef.current)setBetText(String(player.preferences?.defaultBet||20));}},[player,freeSpins]);
  useEffect(() => { if (!sound) stopGameEffects(); }, [sound]);
  useEffect(() => {
    if (!celebration || !autoEnabled) return;
    const timer = setTimeout(() => setCelebration(null),1800);
    return () => clearTimeout(timer);
  }, [celebration,autoEnabled]);
  useEffect(() => {
    const keyboard = event => {
      if (event.code === 'Space' && !event.target.closest('button,input,select,textarea,dialog') && !document.querySelector('dialog[open]')) {
        event.preventDefault(); void spinRef.current('button');
      }
    };
    document.addEventListener('keydown',keyboard);
    return () => document.removeEventListener('keydown',keyboard);
  }, []);

  function toggleAuto() {
    if (controllerRef.current.isEnabled()) { controllerRef.current.stop(); return; }
    if (!bet || !player || !assetsReady) return;
    setAutoRounds(0);
    controllerRef.current.start();
  }

  async function spin(source = 'button') {
    if (busyRef.current || !player || celebration || !assetsReady) return false;
    if (source !== 'auto' && controllerRef.current.isEnabled()) return false;
    if (bet === null) { notify('Enter a whole-coin wager from 1 to 10,000.',true); return false; }
    if (!freeSpins && player.balance < bet) { notify('Lower your wager or claim your daily gift to keep exploring.',true); return false; }
    busyRef.current = true; setSpinning(true); setBusy(true); setStopped(0);
    stopGameEffects(); setCascade(0); setCollected(0); setCascadeFrame(null); setTumbling(false);
    setMessage(cabinetSkin ? 'REELS IN MOTION' : 'A little anticipation…'); setResult(null); setShowLines(false); setSelectedLine(null);
    if (sound && cabinetSkin) playTone('lever');
    const started = Date.now();
    requestRef.current ||= {game:game.id,bet,requestId:crypto.randomUUID()};
    try {
      const data = await api('spin',requestRef.current,player.id);
      requestRef.current = null;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      await pause(Math.max(0,(reduced ? 0 : turbo ? 350 : cabinetSkin ? 1350 : 1050)-(Date.now()-started)));
      if (!mounted.current) { await reload(); return false; }
      setGrid(data.grid); setMoneyFish(data.moneyFish||[]);
      for (let c=0;c<data.grid.length;c++) {
        if (!mounted.current) { await reload(); return false; }
        setStopped(c+1);
        if (latest.current.sound) playColumnLandings(data.grid[c],c,{turbo,reduced});
        if (!reduced) await pause(tallReels ? (turbo ? 100 : 220) : (turbo ? 65 : 180));
      }
      if (tallReels && !reduced) await pause(turbo ? 180 : 300);
      if (data.cascades) {
        let total = 0;
        for (let i=0;i<data.cascades.length;i++) {
          if (!mounted.current) { await reload(); return false; }
          const frame = data.cascades[i];
          setGrid(frame.grid); setCascadeFrame(frame); setCascade(i + (frame.payout ? 1 : 0));
          total += frame.payout; setCollected(total);
          if (!frame.payout) break;
          setMessage(['Gold vein found · +{0} coins', frame.payout]);
          if (i>0 && latest.current.sound) frame.grid.forEach((reel,c)=>playColumnLandings(reel,c,{turbo,reduced}));
          if (!reduced) await pause(turbo ? 220 : 750);
          if (i < data.cascades.length-1) {
            setTumbling(true);
            if (!reduced) await pause(turbo ? 100 : 310);
            if (!mounted.current) { await reload(); return false; }
            setTumbling(false);
          }
        }
        setCascadeFrame(null);
      }
      setPlayer(current => ({...current,balance:data.balance,
        rounds:[...current.rounds.filter(r=>r.game!==game.id),{game:game.id,remaining:data.freeSpins,bet:data.bet,feature:data.feature}]}));
      setHistory(current => [{id:data.id,game:data.game,bet:data.cost,payout:data.payout,created_at:data.created_at},...current].slice(0,30));
      const finalFrame = data.cascades?.at(-1);
      setBetText(String(data.bet)); setResult(finalFrame ? {...data,lines:finalFrame.lines} : data); setLastWin(data.payout);
      if (source === 'auto') setAutoRounds(count => count + 1);
      if(data.winCapped){
        setMessage(['Maximum catch reached · +{0} coins', data.payout]);
        setCelebration({type:'win',amount:data.payout});
      } else if (data.bonusTriggered) {
        const awarded=data.bonusAwarded||bonusLength;
        setMessage([fishing ? (data.fishermenLanded ? '{0} more free spins · next catch tier queued.' : '{0} free spins unlocked · time to go fishing.') : '{0} bonus spins unlocked. The adventure continues.', awarded]);
        setCelebration({type:'bonus',amount:awarded});
      } else if (data.payout) {
        setMessage(fishing && data.collectionPayout
          ? ['Catch collected · +{0} coins · {1}× fish value', data.payout, data.multiplier]
          : mining
            ? [data.cascadeCount === 1 ? '{0} golden cascade · +{1} coins' : '{0} golden cascades · +{1} coins', data.cascadeCount, data.payout]
            : [data.lines.length === 1 ? '{0} winning line · +{1} coins' : '{0} winning lines · +{1} coins', data.lines.length, data.payout]);
        if (data.payout>=data.bet*10) setCelebration({type:'win',amount:data.payout});
      } else setMessage(data.freeSpins ? 'Your next spin is on us.' : cabinetSkin ? 'READY · PULL HANDLE TO PLAY' : 'Every spin is a new story. Ready for yours?');
      if (latest.current.sound && (data.payout || data.bonusTriggered)) { playTone('win'); if (data.payout) playTone('coins'); }
      return true;
    } catch (error) {
      controllerRef.current.stop('error');
      if (mounted.current) { setMessage('The round was interrupted. Auto-spin has stopped.'); notify(error.message,true); }
      try { await reload(); requestRef.current = null; } catch { /* Retain the request ID for an idempotent retry. */ }
      return false;
    } finally {
      busyRef.current = false;
      if (mounted.current) { setSpinning(false); setStopped(reelCount); }
      setBusy(false);
    }
  }
  spinRef.current = spin;
  const wins = cascadeFrame?.lines || result?.lines || [];
  const winningCells = new Set(wins.flatMap(line => line.cells.map(cell => cell.join('-'))));
  const lineOptions = showLines
    ? paylines.map((rows, index) => ({ index, cells: rows.map((row, column) => [column, row]) }))
    : wins;
  const inspectedLine = lineOptions.find(line => line.index === selectedLine);
  const selectedCells = new Set(inspectedLine?.cells.map(cell => cell.join('-')));
  const fishValues=Object.fromEntries(moneyFish.map(fish=>[fish.cell.join('-'),fish.value]));
  const reelSymbols=game.symbolTypes||symbols;
  const strips = fishing
    ? Array.from({ length: 5 }, (_, column) => Array.from({ length: 9 }, (_, row) => reelSymbols[(row + column * 2) % reelSymbols.length]))
    : tallReels ? tallSpinningGrid : spinningGrid;
  const locked = spinning || freeSpins>0 || autoEnabled;
  const displayedLines = showLines ? paylines.map((rows,index)=>({rows,index})) : wins.map(line=>({rows:paylines[line.index],index:line.index}));
  const hasWin = Boolean(result?.payout || result?.bonusTriggered);
  const canStart = Boolean(player && assetsReady && bet!==null && (freeSpins || player.balance>=bet));
  const status = Array.isArray(message)
    ? t(message[0], ...message.slice(1).map(coins))
    : t(message);
  const winMultiplier = result?.payout && result.multiplier > 1 && !result.collectionPayout
    ? ' ' + t('· {0}× bonus', result.multiplier)
    : '';
  const stopAutoButton = <button className={`auto-spin-button ${autoEnabled?'active':''}`} onClick={toggleAuto} disabled={!autoEnabled && (!canStart || Boolean(celebration))} aria-pressed={autoEnabled}><Icon name={autoEnabled?'stop':'auto'} />{autoEnabled?t('Stop auto-spin'):t('Auto-spin')}</button>;

  const reelDisplay=(
    <div className={`reel-machine${inspectedLine ? ' inspecting-line' : ''}`}>
      <div className="corner-detail tl"/><div className="corner-detail tr"/>
      <div className="corner-detail bl"/><div className="corner-detail br"/>
      {!tallReels && <span className="payline-mark">▶</span>}
      <div className="reels" aria-label={tallReels ? t("Five reels, six rows") : t("Slot reels")}
        style={{ gridTemplateColumns: `repeat(${reelCount}, minmax(0, 1fr))` }}>
        {grid.map((reel, column) => {
          const moving = spinning && column >= stopped;
          const landing = spinning && !moving;
          return <div key={column} className={`reel ${moving ? 'spinning' : ''} ${landing ? 'stopping' : ''}`}>
            <div className="reel-strip">{(moving ? strips[column] : reel).map((type, row) => {
              const cell = `${column}-${row}`;
              const won = !moving && winningCells.has(cell);
              const inspected = !moving && selectedCells.has(cell);
              return <div key={row} style={{ '--cell-land-delay': `${row * (turbo ? 18 : 65)}ms` }}
                className={`cell ${landing ? 'landing-cell' : ''} ${won ? 'winning' : ''} ${inspected ? 'line-cell' : ''} ${!moving && type === 'scatter' && result?.bonusTriggered ? 'scatter-triggered' : ''}`}>
                <Symbol type={type} game={game}/>
                {fishing && !moving && type === 'fish' && <span className={`fish-value ${result?.collectionPayout ? 'collected' : ''}`}>
                  {coins(fishValues[cell] ?? (bet || 20) * [2, 5, 10][column % 3])}
                </span>}
              </div>;
            })}</div>
          </div>;
        })}
      </div>
      {!tallReels && displayedLines.length > 0 && !spinning &&
        <svg className="payline-svg" viewBox={`0 0 ${reelCount * 100} 300`} preserveAspectRatio="none" aria-hidden="true">
          {displayedLines.map(({ rows, index }) => <polyline key={index}
            points={rows.map((row, column) => `${column * 100 + 50},${row * 100 + 50}`).join(' ')}
            fill="none" stroke={lineColors[index % lineColors.length]} strokeWidth="2"/>)}
        </svg>}
    </div>
  );

  return <main className={`game-main ${game.id}`}>
    <section className={`game-stage ${game.id}${tallReels ? ' tall-reels' : ''}`} aria-label={game.name} style={{'--accent':game.accent}}>
      <img className="stage-art" src={game.stageAsset || asset(game.id)} alt="" />
      {game.stageAsset && <img className="stage-art stage-art-detail" src={asset(game.id)} alt=""/>}
      <div className="stage-shade" />
      <div className="ambient-motes" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i}} />)}</div>
      <div className="stage-navigation"><button className="back-button" disabled={spinning} onClick={()=>navigate('all')}><span>←</span>{" " + t("Back to lobby")}</button><span className="stage-collection">{t(game.subtitle)}</span><div><button className="icon-button" onClick={()=>setModal({kind:'guide'})} aria-label={t("How to play")}><Icon name="info" /></button><button className="icon-button" onClick={()=>setSound(!sound)} aria-label={sound?t("Mute sound"):t("Enable sound")} aria-pressed={sound}><Icon name={sound?'volume':'mute'} /></button></div></div>
      <div className="game-logo"><span className="logo-ornament">✧ ───── ✦ ───── ✧</span><h1><span>{game.title[0]}</span><em>{game.title[1]}</em></h1><p>{t(game.copy)}</p>{fishing?<span className="recreation-label">{t("VIRTUAL-COIN RECREATION · ORIGINAL ARTWORK")}</span>:null}</div>
      <div className={`bonus-ribbon ${freeSpins?'active':''}`}><span>✦</span>{freeSpins?<strong>{freeSpins}{" " + t("FREE SPINS REMAINING") + " "}{multiplier>1?t('· {0}× WINS', multiplier):''}</strong>:<><strong>{t(game.label)}</strong><span className="ribbon-divider" /><span>{fishing?t("3 / 4 / 5 scatters → 10 / 15 / 20 free spins"):t('3 bonus symbols unlock {0} free spins', bonusLength)}</span></>}<span>✦</span></div>
      {cabinetSkin?<MechanicalCabinet game={game} skin={cabinetSkin} reels={reelDisplay} state={{spinning,assetsReady,canStart,locked,blocked:Boolean(celebration)||autoEnabled,freeSpins,bonusLength,multiplier,bet,betText:freeSpins?String(bonus.bet):betText,balance:player?.balance??null,lastWin,message:status + winMultiplier,hasWin,result,showLines,turbo,autoEnabled,autoRounds}}
        onSpin={()=>spin('button')} onBet={setBetText} onLines={()=>setShowLines(!showLines)} onTurbo={()=>setTurbo(!turbo)}
        onPaytable={()=>setModal({kind:'paytable',game,bet:bet||20})} onHistory={()=>setModal({kind:'history'})} autoButton={stopAutoButton}/>:<div className={`cabinet-frame ${tumbling?'tumbling':''}`}>
        <div className={`slot-cabinet ${hasWin?'has-win':''}`}>
          {tallReels && <div className="cabinet-housing" aria-hidden="true"><span/></div>}
          {mining ? <div className="cabinet-rivets" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} />)}</div> : null}
          {!assetsReady?<div className="cabinet-loading" role="status"><span>✦</span>{t("Preparing your world…")}</div>:null}
          {mining?<MineDetails cascades={cascade} collected={collected} freeSpins={freeSpins} />:null}
          {fishing?<BassDetails game={game} feature={bonus?.feature||result?.feature} freeSpins={freeSpins} result={result}/>:null}<div className="cabinet-top"><span>✧</span><div /><strong>{freeSpins?t("BONUS ROUND"):tallReels?t("5 REELS · 6 ROWS · 10 PAYLINES"):fishing?t("FIVE REELS · TEN PAYLINES · FISH & COLLECT"):t('{0} REELS OF POSSIBILITY', reelCount === 3 ? t('THREE') : t('FIVE'))}</strong><div /><span>✧</span></div>
          {reelDisplay}
          {tallReels && !spinning && lineOptions.length > 0 && <PaylinePicker lines={lineOptions} wins={wins} rows={rowCount}
            selected={selectedLine} onSelect={setSelectedLine} multiplier={result?.multiplier ?? 1}/>}
          <div className={`result-marquee ${hasWin?'winning-message':''}`} role="status" aria-live="polite"><span>✦</span>{status}{winMultiplier}<span>✦</span></div>
          <div className="cabinet-controls"><div className="game-stat"><small>{t("VIRTUAL BALANCE")}</small><strong><span className="stat-coin">✦</span>{player?coins(player.balance):'—'}</strong></div>
            <div className="bet-control"><label htmlFor="coin-wager">{freeSpins?t("BONUS BET · LOCKED"):t("YOUR WAGER")}</label><div className={`bet-stepper ${bet===null?'invalid':''}`}><button aria-label={t("Lower bet")} disabled={locked||bet===MIN_BET} onClick={()=>setBetText(String(nextBet(bet||20,-1)))}>−</button><input id="coin-wager" aria-label={t("Wager in coins")} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={7} value={freeSpins?String(bonus.bet):betText} disabled={locked} onChange={e=>setBetText(e.target.value)} aria-invalid={bet===null} aria-describedby="wager-help" /><button aria-label={t("Raise bet")} disabled={locked||bet===MAX_BET} onClick={()=>setBetText(String(nextBet(bet||20,1)))}>+</button></div></div>
            <button className="spin-button" onClick={()=>spin('button')} disabled={spinning||!canStart||Boolean(celebration)||autoEnabled}><Icon name="spin" /><span>{spinning?t("SPINNING"):freeSpins?t("FREE SPIN"):t("SPIN")}</span><small>{freeSpins?t("ON THE HOUSE"):t("LET’S FIND SOME MAGIC")}</small></button>
            <div className="game-stat last-win"><small>{t("LAST WIN")}</small><strong>{coins(lastWin)}</strong></div>
          </div>
          <div className="round-options"><span id="wager-help" className={bet===null?'wager-error':''}>{bet===null?t("Enter a whole number from 1 to 10,000."):autoEnabled?t('Auto-spin on · {0} rounds completed. Stop whenever you like.', autoRounds):freeSpins?t("Your triggering wager is locked for bonus spins."):t("Type any whole-coin wager from 1 to 10,000.")}</span>{stopAutoButton}</div>
          <div className="cabinet-bottom"><div><button onClick={()=>setModal({kind:'paytable',game,bet:bet||20})}><Icon name="book" />{t("Paytable")}</button><button className={showLines?'enabled':''} onClick={()=>{setShowLines(!showLines);setSelectedLine(null);}} aria-pressed={showLines}><Icon name="slots" />{paylines.length}{" " + t("paylines")}</button><button className={turbo?'enabled':''} onClick={()=>setTurbo(!turbo)} aria-pressed={turbo}><Icon name="bolt" />{t("Quick spin")}</button></div><button onClick={()=>setModal({kind:'history'})}><Icon name="clock" />{t("Spin history")}</button></div>
        </div>
      </div>}
      <div className="stage-bottom"><span>{t("100% VIRTUAL COINS") + " "}<i>✦</i>{" " + t("A LITTLE ESCAPE FROM THE EVERYDAY")}</span><span><kbd>{t("SPACE")}</kbd>{" " + t("TO SPIN")}</span></div>
      {result?.payout && !spinning ? <CoinRain key={`coins-${result.id}`} /> : null}
      {celebration?<div className="celebration-backdrop"><div className="celebration" role="dialog" aria-modal="true" aria-label={celebration.type==='bonus'?t("Free spin bonus"):t("Big win")}><span className="celebration-star">✦</span><p>{celebration.type==='bonus'?t("YOU FOUND A LITTLE EXTRA MAGIC"):t("A MOMENT WORTH CELEBRATING")}</p><h2>{celebration.type==='bonus'?t("Bonus unlocked"):t("Big win")}</h2><strong>{celebration.type==='bonus'?celebration.amount:'+'+coins(celebration.amount)}</strong><span>{celebration.type==='bonus'?t('FREE SPINS {0}', multiplier > 1 ? t('· {0}× WINS', multiplier) : ''):t("VIRTUAL COINS")}</span><button className="primary-button" autoFocus onClick={()=>setCelebration(null)}>{celebration.type==='bonus'?t("Enter the bonus"):t("Continue")}<Icon name="arrow" /></button>{autoEnabled?<><p>{t("Auto-spin continues after this celebration.")}</p><button className="celebration-stop" onClick={()=>controllerRef.current.stop()}>{t("Stop auto-spin")}</button></>:null}</div></div>:null}
    </section>
    <section className="game-story"><div><span className="eyebrow">{t("A WORLD WORTH GETTING LOST IN")}</span><h2>{game.name}</h2><p>{t(game.description)}</p></div><div className="game-facts"><span><strong>{reelCount}</strong>{t("REELS")}</span><span><strong>{paylines.length}</strong>{t("PAYLINES")}</span><span><strong>{fishing?'10–20':bonusLength}</strong>{t("FREE SPINS")}</span><span><strong>{multiplier>1?`${multiplier}×`:'✦'}</strong>{multiplier>1?t("BONUS WINS"):t("WILD SYMBOLS")}</span></div></section>
    <button className="another-world" onClick={()=>navigate('all')}>{t("Explore another world")}<Icon name="arrow" /></button>
  </main>;
}
