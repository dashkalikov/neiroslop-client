import { useEffect, useRef, useState } from 'react';
import { asset, formatCoins } from '../data/games.js';
import { useLounge } from '../LoungeContext.jsx';
import { api } from '../lib/api.js';
import { INITIAL_GRID, nextBet, PAYLINES, CLASSIC_PAYLINES, parseWager, autoAction, MIN_BET, MAX_BET } from '../lib/game-state.js';
import { createAutoSpin } from '../lib/auto-spin.js';
import { playTone, playColumnLandings, prepareSlotAudio, stopGameEffects } from '../lib/audio.js';
import Icon from './Icon.jsx';
import Symbol from './Symbol.jsx';
import Lever from './Lever.jsx';
import CoinRain from './CoinRain.jsx';
import { CoinSpill } from './WinToken.jsx';
import { ClassicMarquee, ClassicApron, MineDetails } from './CabinetDetails.jsx';
import BassDetails from './BassDetails.jsx';
import SaloonMachine from './SaloonMachine.jsx';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const symbols = ['gem','star','orb','crown','leaf','wild','scatter'];
const spinningGrid = Array.from({length:5}, (_,c) => Array.from({length:9}, (_,r) => symbols[(r%3+c*2)%symbols.length]));
const lineColors = ['#eaca87','#b3a1ff','#86decc','#f4a5d7','#a5d5ff'];

export default function GameScreen({ game, navigate }) {
  const lounge = useLounge();
  const { player, setPlayer, catalog, setHistory, notify, reload, setBusy, setModal, modal, sound, setSound, turbo, setTurbo } = lounge;
  const rules = catalog.find(g => g.id === game.id);
  const reelCount = rules?.reels || game.reels || 5;
  const bonusLength = rules?.bonus || game.bonus;
  const bonus = player?.rounds.find(r => r.game === game.id);
  const fishing=game.id==='bigbass';
  const multiplier = fishing ? (bonus?.feature?.batches?.[0]?.multiplier||1) : rules?.multiplier || game.multiplier || (game.id === 'neon' ? 2 : 1);
  const paylines = game.paylines || (reelCount === 3 ? CLASSIC_PAYLINES : PAYLINES);
  const classic = game.id === 'royal';
  const saloon = game.id === 'saloon';
  const mining = Boolean(game.cascading);
  const freeSpins = bonus?.remaining || 0;
  const [betText, setBetText] = useState(String(freeSpins ? bonus.bet : 20));
  const bet = freeSpins ? bonus.bet : parseWager(betText);
  const [grid, setGrid] = useState(() => game.initialGrid || INITIAL_GRID.slice(0,reelCount));
  const [moneyFish,setMoneyFish]=useState([]);
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState(reelCount);
  const [result, setResult] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState((classic||saloon) ? 'READY · PULL HANDLE OR PRESS SPIN' : 'Your next escape begins with a spin.');
  const [showLines, setShowLines] = useState(false);
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
    if(saloon)sources.push('/assets/saloon-cabinet.png','/assets/saloon-crystal-grip.png','/assets/saloon-arm-metal.png',asset(game.id));
    let cancelled = false;
    Promise.all(sources.map(source=>{const image=new Image();image.src=source;return image.decode();})).then(() => { if (!cancelled) setAssetsReady(true); }).catch(() => {
      if (!cancelled) notify('The artwork could not load. Refresh to try again.',true);
    });
    return () => { cancelled = true; };
  }, [game.id,game.symbolAsset,notify,saloon]);
  useEffect(() => { if (freeSpins) setBetText(String(bonus.bet)); }, [freeSpins,bonus?.bet]);
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
    setMessage((classic||saloon) ? 'REELS IN MOTION' : 'A little anticipation…'); setResult(null); setShowLines(false);
    if (sound && (classic||saloon)) playTone('lever');
    const started = Date.now();
    requestRef.current ||= {game:game.id,bet,requestId:crypto.randomUUID()};
    try {
      const data = await api('spin',requestRef.current);
      requestRef.current = null;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      await pause(Math.max(0,(reduced ? 0 : turbo ? 350 : (classic||saloon) ? 1350 : 1050)-(Date.now()-started)));
      if (!mounted.current) { await reload(); return false; }
      setGrid(data.grid); setMoneyFish(data.moneyFish||[]);
      for (let c=0;c<data.grid.length;c++) {
        if (!mounted.current) { await reload(); return false; }
        setStopped(c+1);
        if (latest.current.sound) playColumnLandings(data.grid[c],c,{turbo,reduced});
        if (!reduced) await pause(turbo ? 65 : 180);
      }
      if (data.cascades) {
        let total = 0;
        for (let i=0;i<data.cascades.length;i++) {
          if (!mounted.current) { await reload(); return false; }
          const frame = data.cascades[i];
          setGrid(frame.grid); setCascadeFrame(frame); setCascade(i + (frame.payout ? 1 : 0));
          total += frame.payout; setCollected(total);
          if (!frame.payout) break;
          setMessage(`Gold vein found · +${formatCoins(frame.payout)} coins`);
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
        setMessage(`Maximum catch reached · +${formatCoins(data.payout)} coins`);
        setCelebration({type:'win',amount:data.payout});
      } else if (data.bonusTriggered) {
        const awarded=data.bonusAwarded||bonusLength;
        setMessage(fishing?`${awarded} free spins ${data.fishermenLanded?'added · next catch tier queued':'unlocked · time to go fishing'}.`:`${awarded} bonus spins unlocked. The adventure continues.`);
        setCelebration({type:'bonus',amount:awarded});
      } else if (data.payout) {
        setMessage(fishing&&data.collectionPayout?`Catch collected · +${formatCoins(data.payout)} coins · ${data.multiplier}× fish value`:mining ? `${data.cascadeCount} golden ${data.cascadeCount===1?'cascade':'cascades'} · +${formatCoins(data.payout)} coins` : `${data.lines.length} winning ${data.lines.length===1?'line':'lines'} · +${formatCoins(data.payout)} coins${data.multiplier>1?` · ${data.multiplier}× bonus`:''}`);
        if (data.payout>=data.bet*10) setCelebration({type:'win',amount:data.payout});
      } else setMessage(data.freeSpins ? 'Your next spin is on us.' : (classic||saloon) ? 'READY · PULL HANDLE TO PLAY' : 'Every spin is a new story. Ready for yours?');
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
  const winningCells = new Set((cascadeFrame?.lines||result?.lines||[]).flatMap(line=>line.cells.map(cell=>cell.join('-'))));
  const fishValues=Object.fromEntries(moneyFish.map(fish=>[fish.cell.join('-'),fish.value]));
  const reelSymbols=game.symbolTypes||symbols;
  const strips=fishing?Array.from({length:5},(_,c)=>Array.from({length:9},(_,r)=>reelSymbols[(r+c*2)%reelSymbols.length])):spinningGrid;
  const locked = spinning || freeSpins>0 || autoEnabled;
  const displayedLines = showLines ? paylines.map((rows,index)=>({rows,index})) : (result?.lines||[]).map(line=>({rows:paylines[line.index],index:line.index}));
  const hasWin = Boolean(result?.payout || result?.bonusTriggered);
  const canStart = Boolean(player && assetsReady && bet!==null && (freeSpins || player.balance>=bet));
  const stopAutoButton = <button className={`auto-spin-button ${autoEnabled?'active':''}`} onClick={toggleAuto} disabled={!autoEnabled && (!canStart || Boolean(celebration))} aria-pressed={autoEnabled}><Icon name={autoEnabled?'stop':'auto'} />{autoEnabled?'Stop auto-spin':'Auto-spin'}</button>;

  const reelDisplay=(
<div className="reel-machine"><div className="corner-detail tl" /><div className="corner-detail tr" /><div className="corner-detail bl" /><div className="corner-detail br" /><span className="payline-mark">▶</span>
            <div className="reels" aria-label="Slot reels" style={{gridTemplateColumns:`repeat(${reelCount},minmax(0,1fr))`}}>{grid.map((reel,c)=>{
              const moving=spinning && c>=stopped;
              return <div key={c} className={`reel ${moving?'spinning':''} ${spinning&&!moving?'stopping':''}`}><div className="reel-strip">{(moving?strips[c]:reel).map((type,r)=><div key={r} style={{'--cell-land-delay':`${r*(turbo?18:65)}ms`}} className={`cell ${spinning&&!moving?'landing-cell':''} ${!moving&&winningCells.has(`${c}-${r}`)?'winning':''} ${!moving&&type==='scatter'&&result?.bonusTriggered?'scatter-triggered':''}`}><Symbol type={type} game={game} />{fishing&&!moving&&type==='fish'?<span className={`fish-value ${result?.collectionPayout?'collected':''}`}>{formatCoins(fishValues[`${c}-${r}`]??(bet||20)*[2,5,10][c%3])}</span>:null}</div>)}</div></div>;
            })}</div>
            {displayedLines.length&&!spinning?<svg className="payline-svg" viewBox={`0 0 ${reelCount*100} 300`} preserveAspectRatio="none" aria-hidden="true">{displayedLines.map(({rows,index})=><polyline key={index} points={rows.map((r,c)=>`${c*100+50},${r*100+50}`).join(' ')} fill="none" stroke={lineColors[index%lineColors.length]} strokeWidth="2" />)}</svg>:null}
          </div>
  );

  return <main className={`game-main ${game.id}`}>
    <section className={`game-stage ${game.id}`} aria-label={game.name} style={{'--accent':game.accent}}>
      <img className="stage-art" src={asset(game.id)} alt="" /><div className="stage-shade" />
      <div className="ambient-motes" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i}} />)}</div>
      <div className="stage-navigation"><button className="back-button" disabled={spinning} onClick={()=>navigate('all')}><span>←</span> Back to lobby</button><span className="stage-collection">{game.subtitle}</span><div><button className="icon-button" onClick={()=>setModal({kind:'guide'})} aria-label="How to play"><Icon name="info" /></button><button className="icon-button" onClick={()=>setSound(!sound)} aria-label={sound?'Mute sound':'Enable sound'} aria-pressed={sound}><Icon name={sound?'volume':'mute'} /></button></div></div>
      <div className="game-logo"><span className="logo-ornament">✧ ───── ✦ ───── ✧</span><h1><span>{game.title[0]}</span><em>{game.title[1]}</em></h1><p>{game.copy}</p>{fishing?<span className="recreation-label">VIRTUAL-COIN RECREATION · ORIGINAL ARTWORK</span>:null}</div>
      <div className={`bonus-ribbon ${freeSpins?'active':''}`}><span>✦</span>{freeSpins?<strong>{freeSpins} FREE SPINS REMAINING {multiplier>1?`· ${multiplier}× WINS`:''}</strong>:<><strong>{game.label}</strong><span className="ribbon-divider" /><span>{fishing?'3 / 4 / 5 scatters → 10 / 15 / 20 free spins':`3 bonus symbols unlock ${bonusLength} free spins`}</span></>}<span>✦</span></div>
      {saloon?<SaloonMachine game={game} reels={reelDisplay} state={{spinning,assetsReady,canStart,locked,blocked:Boolean(celebration)||autoEnabled,freeSpins,bet,betText:freeSpins?String(bonus.bet):betText,balance:player?.balance??null,lastWin,message,hasWin,result,showLines,turbo}}
        onSpin={()=>spin('button')} onBet={setBetText} onLines={()=>setShowLines(!showLines)} onTurbo={()=>setTurbo(!turbo)}
        onPaytable={()=>setModal({kind:'paytable',game,bet:bet||20})} onHistory={()=>setModal({kind:'history'})} autoButton={stopAutoButton}/>:<div className={`cabinet-frame ${classic?'classic-frame':''} ${classic && spinning?'machine-shaking':''} ${tumbling?'tumbling':''}`}>
        <div className={`slot-cabinet ${hasWin?'has-win':''}`}>
          {classic || mining ? <div className="cabinet-rivets" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} />)}</div> : null}
          {!assetsReady?<div className="cabinet-loading" role="status"><span>✦</span>Preparing your world…</div>:null}
          {classic?<ClassicMarquee game={game} winning={hasWin} />:mining?<MineDetails cascades={cascade} collected={collected} freeSpins={freeSpins} />:null}
          {fishing?<BassDetails game={game} feature={bonus?.feature||result?.feature} freeSpins={freeSpins} result={result}/>:null}<div className="cabinet-top"><span>✧</span><div /><strong>{freeSpins?'BONUS ROUND':classic?'3 REELS · 5 PAYLINES · ALL WINS LEFT TO RIGHT':fishing?'FIVE REELS · TEN PAYLINES · FISH & COLLECT':`${reelCount===3?'THREE':'FIVE'} REELS OF POSSIBILITY`}</strong><div /><span>✧</span></div>
          {reelDisplay}
          {classic ? <div className="reel-index-rail" aria-hidden="true"><span>REEL I</span><b>✦</b><span>REEL II</span><b>✦</b><span>REEL III</span></div> : null}
          <div className={`result-marquee ${hasWin?'winning-message':''}`} role="status" aria-live="polite"><span>✦</span>{message}<span>✦</span></div>
          <div className="cabinet-controls"><div className="game-stat"><small>{classic?'CREDITS':'VIRTUAL BALANCE'}</small><strong><span className="stat-coin">✦</span>{player?formatCoins(player.balance):'—'}</strong></div>
            <div className="bet-control"><label htmlFor="coin-wager">{freeSpins?'BONUS BET · LOCKED':classic?'BET':'YOUR WAGER'}</label><div className={`bet-stepper ${bet===null?'invalid':''}`}><button aria-label="Lower bet" disabled={locked||bet===MIN_BET} onClick={()=>setBetText(String(nextBet(bet||20,-1)))}>−</button><input id="coin-wager" aria-label="Wager in coins" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={7} value={freeSpins?String(bonus.bet):betText} disabled={locked} onChange={e=>setBetText(e.target.value)} aria-invalid={bet===null} aria-describedby="wager-help" /><button aria-label="Raise bet" disabled={locked||bet===MAX_BET} onClick={()=>setBetText(String(nextBet(bet||20,1)))}>+</button></div></div>
            <button className="spin-button" onClick={()=>spin('button')} disabled={spinning||!canStart||Boolean(celebration)||autoEnabled}><Icon name="spin" /><span>{spinning?'SPINNING':freeSpins?'FREE SPIN':'SPIN'}</span><small>{freeSpins?'ON THE HOUSE':classic?'OR PULL THE LEVER':'LET’S FIND SOME MAGIC'}</small></button>
            <div className="game-stat last-win"><small>{classic?'WIN':'LAST WIN'}</small><strong>{formatCoins(lastWin)}</strong></div>
          </div>
          <div className="round-options"><span id="wager-help" className={bet===null?'wager-error':''}>{bet===null?'Enter a whole number from 1 to 10,000.':autoEnabled?`Auto-spin on · ${autoRounds} rounds completed. Stop whenever you like.`:freeSpins?'Your triggering wager is locked for bonus spins.':'Type any whole-coin wager from 1 to 10,000.'}</span>{stopAutoButton}</div>
          <div className="cabinet-bottom"><div><button onClick={()=>setModal({kind:'paytable',game,bet:bet||20})}><Icon name="book" />Paytable</button><button className={showLines?'enabled':''} onClick={()=>setShowLines(!showLines)} aria-pressed={showLines}><Icon name="slots" />{paylines.length} paylines</button><button className={turbo?'enabled':''} onClick={()=>setTurbo(!turbo)} aria-pressed={turbo}><Icon name="bolt" />Quick spin</button></div><button onClick={()=>setModal({kind:'history'})}><Icon name="clock" />Spin history</button></div>
          {classic ? <ClassicApron /> : null}
        </div>
        {classic?<><Lever disabled={spinning||!canStart||Boolean(celebration)||autoEnabled} spinning={spinning} onPull={()=>spin('lever')} /><div className="coin-tray" aria-hidden="true"><div className="coin-slot" /><span>LUCKY LOUNGE · VIRTUAL TOKENS</span>{result?.payout&&!spinning?<CoinSpill key={result.id}/>:null}</div></>:null}
      </div>}
      <div className="stage-bottom"><span>100% VIRTUAL COINS <i>✦</i> A LITTLE ESCAPE FROM THE EVERYDAY</span><span><kbd>SPACE</kbd> TO SPIN</span></div>
      {result?.payout && !spinning ? <CoinRain key={`coins-${result.id}`} /> : null}
      {celebration?<div className="celebration-backdrop"><div className="celebration" role="dialog" aria-modal="true" aria-label={celebration.type==='bonus'?'Free spin bonus':'Big win'}><span className="celebration-star">✦</span><p>{celebration.type==='bonus'?'YOU FOUND A LITTLE EXTRA MAGIC':'A MOMENT WORTH CELEBRATING'}</p><h2>{celebration.type==='bonus'?'Bonus unlocked':'Big win'}</h2><strong>{celebration.type==='bonus'?celebration.amount:'+'+formatCoins(celebration.amount)}</strong><span>{celebration.type==='bonus'?`FREE SPINS ${multiplier>1?`· ${multiplier}× WINS`:''}`:'VIRTUAL COINS'}</span><button className="primary-button" autoFocus onClick={()=>setCelebration(null)}>{celebration.type==='bonus'?'Enter the bonus':'Continue'}<Icon name="arrow" /></button>{autoEnabled?<><p>Auto-spin continues after this celebration.</p><button className="celebration-stop" onClick={()=>controllerRef.current.stop()}>Stop auto-spin</button></>:null}</div></div>:null}
    </section>
    <section className="game-story"><div><span className="eyebrow">A WORLD WORTH GETTING LOST IN</span><h2>{game.name}</h2><p>{game.description}</p></div><div className="game-facts"><span><strong>{reelCount}</strong>REELS</span><span><strong>{paylines.length}</strong>PAYLINES</span><span><strong>{fishing?'10–20':bonusLength}</strong>FREE SPINS</span><span><strong>{multiplier>1?`${multiplier}×`:'✦'}</strong>{multiplier>1?'BONUS WINS':'WILD SYMBOLS'}</span></div></section>
    <button className="another-world" onClick={()=>navigate('all')}>Explore another world<Icon name="arrow" /></button>
  </main>;
}
