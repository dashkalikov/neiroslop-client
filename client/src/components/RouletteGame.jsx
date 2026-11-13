import { useLanguage } from '../LanguageContext.jsx';
import {useEffect,useRef,useState} from 'react';
import {useLounge} from '../LoungeContext.jsx';
import {api} from '../lib/api.js';
import {formatCoins} from '../data/games.js';
import {parseWager} from '../lib/game-state.js';
import {betLabel,numberColor,placeChip,rouletteAngles,totalStake} from '../lib/roulette.js';
import {playTone,prepareSlotAudio,createRouletteRoll} from '../lib/audio.js';
import {sampleRouletteRoll} from '../lib/roulette-motion.js';
import Icon from './Icon.jsx';
import RouletteWheel from './RouletteWheel.jsx';

const OUTSIDE=[['low','1–18'],['even','EVEN'],['red','RED'],['black','BLACK'],['odd','ODD'],['high','19–36']];
const TABLE_COLUMNS = [1, 2, 3];
const VERTICAL_NUMBERS = Array.from({ length: 36 }, (_, index) => index + 1);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pendingKey=id=>'lounge-roulette-pending-'+id;

export default function RouletteGame({navigate}){
  const { t, language } = useLanguage();
  const coins = value => formatCoins(value, language);
  const {player,setPlayer,history,loadHistory,setBusy,notify,setModal,modal,sound,turbo,setTurbo}=useLounge();
  const [bets,setBets]=useState([]),[undo,setUndo]=useState([]),[lastBets,setLastBets]=useState([]);
  const [chip,setChip]=useState(String(player?.preferences?.defaultBet||20));
  const [phase,setPhase]=useState('ready'),[result,setResult]=useState(null),[pending,setPending]=useState(null);
  const [angles,setAngles]=useState({wheel:0,ball:0}),[duration,setDuration]=useState(6200);
  const [message,setMessage]=useState('The table is yours. Place your chips.');
  const mounted=useRef(true),inFlight=useRef(false),spinRef=useRef(null),chipTouched=useRef(false),rollFrom=useRef(angles);
  const busy=phase!=='ready',locked=busy||Boolean(pending),total=totalStake(bets),amount=parseWager(chip);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const playArea = useRef(null);
  const fullscreenButton = useRef(null);
  const fullScreen = nativeFullscreen || expanded;
  const recent=history.filter(r=>r.game==='roulette').slice(0,12);
  useEffect(()=>{mounted.current=true;prepareSlotAudio({ roulette: true });return()=>{mounted.current=false;setBusy(false);};},[setBusy]);
  useEffect(()=>{
    if(!player?.id)return;
    if(!chipTouched.current)setChip(String(player.preferences?.defaultBet||20));
    try{const saved=JSON.parse(sessionStorage.getItem(pendingKey(player.id))||'null');if(saved?.requestId&&Array.isArray(saved.bets)){setPending(saved);setBets(saved.bets);setMessage('An unfinished round was found. Resume to reveal the saved result.');}}catch{/* Storage is optional. */}
  },[player?.id,player?.preferences?.defaultBet]);
  useEffect(()=>{const key=e=>{if(e.code==='Space'&&!modal&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();spinRef.current?.();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[modal]);
  useEffect(() => {
    if (phase !== 'rolling' || duration <= 30) return;
    const audio = createRouletteRoll();
    const from = rollFrom.current;
    const started = performance.now();
    let frame;
    function tick(now) {
      const progress = (now - started) / duration;
      audio.update(sampleRouletteRoll(from, angles, progress, duration));
      if (progress < .8) frame = requestAnimationFrame(tick);
    }
    tick(started);
    return () => { cancelAnimationFrame(frame); audio.stop(); };
  }, [angles, duration, phase]);
  useEffect(() => {
    const sync = () => setNativeFullscreen(document.fullscreenElement === playArea.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const area = playArea.current;
    const button = fullscreenButton.current;
    button.focus({ preventScroll: true });

    function handleKey(event) {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        button.focus({ preventScroll: true });
      } else if (event.key === 'Tab') {
        const controls = [...area.querySelectorAll('button:not(:disabled),input:not(:disabled)')]
          .filter(control => control.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        const edge = event.shiftKey ? first : last;
        if (document.activeElement === edge || !area.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded]);

  async function toggleFullscreen() {
    const area = playArea.current;
    if (document.fullscreenElement === area) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (document.fullscreenEnabled && area.requestFullscreen) {
      try {
        await area.requestFullscreen();
        return;
      } catch { /* The same table can also expand within the page. */ }
    }
    setExpanded(true);
  }

  function remember(next){setUndo(items=>[...items.slice(-63),bets]);setBets(next);}
  function add(position){
    if(locked)return;
    if(!player)return notify('Connect your wallet to place chips.',true);
    if(amount===null)return notify('Enter a whole chip value from 1 to 10,000.',true);
    try{remember(placeChip(bets,position,amount,player.balance));setMessage('Chips placed. Spin whenever you’re ready.');if(sound)playTone('landing');}catch(error){notify(error.message,true);}
  }
  async function spin(){
    if(inFlight.current||busy||!player||(!pending&&!bets.length)||modal)return;
    if(!pending&&total>player.balance)return notify('Your balance cannot cover these bets.',true);
    const request=pending||{requestId:crypto.randomUUID(),bets};
    setPending(request);try{sessionStorage.setItem(pendingKey(player.id),JSON.stringify(request));}catch{/* Optional storage. */}
    inFlight.current=true;setPhase('requesting');setBusy(true);setResult(null);setMessage('Bets accepted. Preparing the wheel…');
    try{
      const data=await api('roulette/spin',request,player.id);
      if(!mounted.current)return;
      const ms=matchMedia('(prefers-reduced-motion: reduce)').matches?30:turbo?2800:6200;
      rollFrom.current = angles;
      setDuration(ms);setAngles(rouletteAngles(angles.wheel,angles.ball,data.number));setPhase('rolling');setMessage('No more bets. Watch the ball.');
      await pause(ms+100);
      if(!mounted.current)return;
      setResult(data);setPlayer(current=>({...current,balance:data.balance}));setLastBets(data.bets);setBets([]);setUndo([]);setPending(null);
      try{sessionStorage.removeItem(pendingKey(player.id));}catch{/* Optional storage. */}
      setMessage(null);
      if(sound)playTone(data.payout?'coins':'landing');
      void loadHistory().catch(()=>notify('The round is saved. History will refresh when reconnected.'));
    }catch(error){
      if(!mounted.current)return;
      if(error.status&&error.status<500){setPending(null);try{sessionStorage.removeItem(pendingKey(player.id));}catch{/* Optional storage. */}}
      setMessage(error.status&&error.status<500?error.message:'Connection interrupted. Retry this round to recover its result.');notify(error.message,true);
    }finally{inFlight.current=false;if(mounted.current){setPhase('ready');setBusy(false);}}
  }
  spinRef.current=spin;
  function spot(kind,value,label,className=''){
    const position={kind,...(value===undefined?{}:{value})},placed=bets.find(b=>b.kind===kind&&b.value===value);
    const won=result?.wins.some(b=>b.kind===kind&&b.value===value);
    return <button key={kind+String(value)} className={`roulette-spot ${className} ${placed?'has-chip':''} ${won?'winning':''}`} disabled={locked} onClick={()=>add(position)} aria-label={t('Bet on {0}', (kind === 'straight' ? t('Number {0}', value) : kind === 'column' ? t('Column {0}', value) : t(betLabel(position))).toLowerCase())}><span>{t(label)}</span>{placed?<i className="table-chip">{coins(placed.amount)}</i>:null}{won?<b className="roulette-win-dot"/>:null}</button>;
  }
  const numberSpot = n => spot('straight', n, n, numberColor(n));
  const columnSpot = column => spot('column', column, '2:1', 'column');
  const numberBoard = fullScreen
    ? VERTICAL_NUMBERS.map(numberSpot).concat(TABLE_COLUMNS.map(columnSpot))
    : [3, 2, 1].flatMap(column => Array.from({ length: 12 }, (_, row) => numberSpot(row * 3 + column)).concat(columnSpot(column)));

  return <main className="roulette-page">
    <section className="roulette-room" aria-label="Riviera Roulette">
      <div className="roulette-room-art" aria-hidden="true"/>
      <div className="roulette-topline"><button onClick={()=>navigate('all')} disabled={busy}><Icon name="arrow"/>{" " + t("Back to lobby")}</button><span><i/>{" " + t("EUROPEAN · SINGLE ZERO")}</span><button onClick={()=>setModal({kind:'rouletteRules'})}><Icon name="book"/>{" " + t("How to play")}</button></div>
      <header className="roulette-title"><p>{t("THE TABLE COLLECTION")}</p><h1>Riviera <em>Roulette</em></h1><span>{t("A timeless game. A seat just for you.")}</span></header>
      <div ref={playArea} className={`roulette-play-area${expanded ? ' is-expanded' : ''}`}
        role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined}
        aria-label={expanded ? t("Full-screen Riviera Roulette") : undefined}>
        <div className="roulette-upper">
          <div className="roulette-wheel-column"><RouletteWheel locked={busy} angles={angles} spinning={phase==='rolling'} duration={duration} number={result?.number??null} fullScreen={fullScreen} fullscreenButton={fullscreenButton} onToggleFullscreen={toggleFullscreen}/><div className="roulette-status" role="status" aria-live="polite"><i className={busy?'rolling':''}/>{message ? t(message) : result && t('{0} · {1} {2}', result.number, t(result.color).toUpperCase(), result.payout ? t('· {0} coins returned', coins(result.payout)) : t('· A new round awaits'))}</div></div>
          <aside className="roulette-round-panel"><div className="roulette-panel-heading"><span>{t("YOUR SEAT AT THE RIVIERA")}</span><Icon name="sparkles"/></div>
            <div className="roulette-result-display"><span className={`roulette-result-number ${result?.color||'waiting'}`}>{result?.number??'✧'}</span><div><small>{result?t("THE WINNING NUMBER"):t("EVERY SPIN, A NEW STORY")}</small><h2>{result?result.color==='green'?t("Le zéro."):t(result.color === 'red' ? 'Red' : 'Black') + ' ' + t(result.number % 2 ? 'odd' : 'even') + '.':t("Make your moment.")}</h2><p>{result?result.payout?t('+{0} coins returned, including winning stakes.', coins(result.payout)):t("The wheel has settled. Your next round is ready."):t("Place chips on a number, a color, or your favorite corner of the table.")}</p></div></div>
            <div className="roulette-round-stats"><div><span>{t("YOUR BALANCE")}</span><strong>✦ {player?coins(player.balance):'—'}</strong></div><div><span>{t("ON THE TABLE")}</span><strong>{coins(total)} <small>{t("coins")}</small></strong></div></div>
            <div className="roulette-recent-heading"><span>{t("YOUR RECENT NUMBERS")}</span><button onClick={()=>setModal({kind:'history'})}>{t("History") + " "}<Icon name="arrow"/></button></div><div className="roulette-recent">{recent.length?recent.map(r=><span key={r.id} className={r.color}>{r.number}</span>):<p>{t("Your first number is waiting to be written.")}</p>}</div>
            <div className="roulette-payout-note"><Icon name="shield"/><p>{t("37 pockets. One green zero.")}<br/><span>{t("Straight-up pays 35:1 · Outside bets 1:1")}</span></p></div>
          </aside>
        </div>
        <section className="roulette-table" aria-label={t("Roulette betting table")}><div className="roulette-table-heading"><div><span>{t("PLACE YOUR CHIPS")}</span><p>{t("Choose a chip value, then tap any betting area.")}</p></div><span>{t("TABLE LIMIT · 10,000 COINS")}</span></div>
          <div className="roulette-chip-tray" role="group" aria-label={t("Chip value")}>{[1,5,10,25,100,500].map((n,i)=><button key={n} className={`roulette-chip chip-${i} ${Number(chip)===n?'selected':''}`} aria-pressed={Number(chip)===n} onClick={()=>{chipTouched.current=true;setChip(String(n));}} disabled={locked} aria-label={t('{0} coin chip', n)}>{n}</button>)}<label className="roulette-custom-chip">{t("CUSTOM CHIP")}<input aria-label={t("Custom chip value")} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={chip} disabled={locked} onChange={e=>{chipTouched.current=true;setChip(e.target.value);}} aria-invalid={amount===null}/><span>{t("coins per click")}</span></label><div className="roulette-bet-tools"><button disabled={locked||!undo.length} onClick={()=>{setBets(undo.at(-1));setUndo(items=>items.slice(0,-1));}}><Icon name="undo"/>{t("Undo")}</button><button disabled={locked||!bets.length} onClick={()=>remember([])}>{t("Clear")}</button><button disabled={locked||!lastBets.length} onClick={()=>{if(totalStake(lastBets)>(player?.balance||0))return notify('Not enough coins to repeat those bets.',true);remember(lastBets);}}>{t("Rebet")}</button></div></div>
          <div className="roulette-betting-scroll"><div className="roulette-betting-layout"><div className="roulette-number-grid">{spot('straight',0,'0','zero green')}{numberBoard}</div><div className="roulette-dozens">{[1,2,3].map(n=>spot('dozen',n,t(['1st 12', '2nd 12', '3rd 12'][n - 1])))}</div><div className="roulette-outside">{OUTSIDE.map(([kind,label])=>spot(kind,undefined,label,kind==='red'||kind==='black'?kind:''))}</div></div></div>
          <div className="roulette-table-footer"><div><span>{t("TOTAL WAGER")}</span><strong>{coins(total)} <small>{t("virtual coins")}</small></strong><p>{bets.length?t(bets.length === 1 ? '{0} betting position' : '{0} betting positions', bets.length):t("Your chips stay in your wallet until you spin.")}</p></div><button className="roulette-spin" disabled={busy||!player||(!pending&&!total)||(!pending&&total>player.balance)} onClick={spin}><Icon name={busy?'auto':'spin'}/><span>{phase==='requesting'?t("Preparing…"):phase==='rolling'?t("Ball in motion"):pending?t("Resume round"):t("Spin the wheel")}<small>{pending&&!busy?t("REVEAL YOUR SAVED ROUND"):t("LET THE MOMENT UNFOLD")}</small></span><Icon name="arrow"/></button></div>
        </section>
        <div className="roulette-footline"><span>{t("VIRTUAL COINS · NO CASH VALUE")}</span><button onClick={()=>setTurbo(!turbo)} aria-pressed={turbo} disabled={busy}><Icon name="bolt"/>{t("Quick spin") + " "}{turbo?t("on"):t("off")}</button><button onClick={()=>setModal({kind:'rouletteRules'})}>{t("Rules & payouts")}</button></div>
      </div>
    </section>
  </main>;
}
