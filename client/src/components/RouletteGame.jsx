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
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pendingKey=id=>'lounge-roulette-pending-'+id;

export default function RouletteGame({navigate}){
  const {player,setPlayer,history,loadHistory,setBusy,notify,setModal,modal,sound,turbo,setTurbo}=useLounge();
  const [bets,setBets]=useState([]),[undo,setUndo]=useState([]),[lastBets,setLastBets]=useState([]);
  const [chip,setChip]=useState(String(player?.preferences?.defaultBet||20));
  const [phase,setPhase]=useState('ready'),[result,setResult]=useState(null),[pending,setPending]=useState(null);
  const [angles,setAngles]=useState({wheel:0,ball:0}),[duration,setDuration]=useState(6200);
  const [message,setMessage]=useState('The table is yours. Place your chips.');
  const mounted=useRef(true),inFlight=useRef(false),spinRef=useRef(null),chipTouched=useRef(false),rollFrom=useRef(angles);
  const busy=phase!=='ready',locked=busy||Boolean(pending),total=totalStake(bets),amount=parseWager(chip);
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
      setMessage(`${data.number} · ${data.color.toUpperCase()}${data.payout?` · ${formatCoins(data.payout)} coins returned`:' · A new round awaits'}`);
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
    return <button key={kind+String(value)} className={`roulette-spot ${className} ${placed?'has-chip':''} ${won?'winning':''}`} disabled={locked} onClick={()=>add(position)} aria-label={`Bet on ${betLabel(position).toLowerCase()}`}><span>{label}</span>{placed?<i className="table-chip">{formatCoins(placed.amount)}</i>:null}{won?<b className="roulette-win-dot"/>:null}</button>;
  }
  return <main className="roulette-page">
    <section className="roulette-room" aria-label="Riviera Roulette">
      <div className="roulette-room-art" aria-hidden="true"/>
      <div className="roulette-topline"><button onClick={()=>navigate('all')} disabled={busy}><Icon name="arrow"/> Back to lobby</button><span><i/> EUROPEAN · SINGLE ZERO</span><button onClick={()=>setModal({kind:'rouletteRules'})}><Icon name="book"/> How to play</button></div>
      <header className="roulette-title"><p>THE TABLE COLLECTION</p><h1>Riviera <em>Roulette</em></h1><span>A timeless game. A seat just for you.</span></header>
      <div className="roulette-upper">
        <div className="roulette-wheel-column"><RouletteWheel locked={busy} angles={angles} spinning={phase==='rolling'} duration={duration} number={result?.number??null}/><div className="roulette-status" role="status" aria-live="polite"><i className={busy?'rolling':''}/>{message}</div></div>
        <aside className="roulette-round-panel"><div className="roulette-panel-heading"><span>YOUR SEAT AT THE RIVIERA</span><Icon name="sparkles"/></div>
          <div className="roulette-result-display"><span className={`roulette-result-number ${result?.color||'waiting'}`}>{result?.number??'✧'}</span><div><small>{result?'THE WINNING NUMBER':'EVERY SPIN, A NEW STORY'}</small><h2>{result?result.color==='green'?'Le zéro.':`${result.color[0].toUpperCase()+result.color.slice(1)} ${result.number%2?'odd':'even'}.`:'Make your moment.'}</h2><p>{result?result.payout?`+${formatCoins(result.payout)} coins returned, including winning stakes.`:'The wheel has settled. Your next round is ready.':'Place chips on a number, a color, or your favorite corner of the table.'}</p></div></div>
          <div className="roulette-round-stats"><div><span>YOUR BALANCE</span><strong>✦ {player?formatCoins(player.balance):'—'}</strong></div><div><span>ON THE TABLE</span><strong>{formatCoins(total)} <small>coins</small></strong></div></div>
          <div className="roulette-recent-heading"><span>YOUR RECENT NUMBERS</span><button onClick={()=>setModal({kind:'history'})}>History <Icon name="arrow"/></button></div><div className="roulette-recent">{recent.length?recent.map(r=><span key={r.id} className={r.color}>{r.number}</span>):<p>Your first number is waiting to be written.</p>}</div>
          <div className="roulette-payout-note"><Icon name="shield"/><p>37 pockets. One green zero.<br/><span>Straight-up pays 35:1 · Outside bets 1:1</span></p></div>
        </aside>
      </div>
      <section className="roulette-table" aria-label="Roulette betting table"><div className="roulette-table-heading"><div><span>PLACE YOUR CHIPS</span><p>Choose a chip value, then tap any betting area.</p></div><span>TABLE LIMIT · 10,000 COINS</span></div>
        <div className="roulette-chip-tray" role="group" aria-label="Chip value">{[1,5,10,25,100,500].map((n,i)=><button key={n} className={`roulette-chip chip-${i} ${Number(chip)===n?'selected':''}`} aria-pressed={Number(chip)===n} onClick={()=>{chipTouched.current=true;setChip(String(n));}} disabled={locked} aria-label={`${n} coin chip`}>{n}</button>)}<label className="roulette-custom-chip">CUSTOM CHIP<input aria-label="Custom chip value" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={chip} disabled={locked} onChange={e=>{chipTouched.current=true;setChip(e.target.value);}} aria-invalid={amount===null}/><span>coins per click</span></label><div className="roulette-bet-tools"><button disabled={locked||!undo.length} onClick={()=>{setBets(undo.at(-1));setUndo(items=>items.slice(0,-1));}}><Icon name="undo"/>Undo</button><button disabled={locked||!bets.length} onClick={()=>remember([])}>Clear</button><button disabled={locked||!lastBets.length} onClick={()=>{if(totalStake(lastBets)>(player?.balance||0))return notify('Not enough coins to repeat those bets.',true);remember(lastBets);}}>Rebet</button></div></div>
        <div className="roulette-betting-scroll"><div className="roulette-betting-layout"><div className="roulette-number-grid">{spot('straight',0,'0','zero green')}{[2,1,0].flatMap(row=>Array.from({length:12},(_,c)=>{const n=c*3+row+1;return spot('straight',n,n,numberColor(n));}).concat(spot('column',row+1,'2:1','column')))}</div><div className="roulette-dozens">{[1,2,3].map(n=>spot('dozen',n,`${['1st','2nd','3rd'][n-1]} 12`))}</div><div className="roulette-outside">{OUTSIDE.map(([kind,label])=>spot(kind,undefined,label,kind==='red'||kind==='black'?kind:''))}</div></div></div>
        <div className="roulette-table-footer"><div><span>TOTAL WAGER</span><strong>{formatCoins(total)} <small>virtual coins</small></strong><p>{bets.length?`${bets.length} betting ${bets.length===1?'position':'positions'}`:'Your chips stay in your wallet until you spin.'}</p></div><button className="roulette-spin" disabled={busy||!player||(!pending&&!total)||(!pending&&total>player.balance)} onClick={spin}><Icon name={busy?'auto':'spin'}/><span>{phase==='requesting'?'Preparing…':phase==='rolling'?'Ball in motion':pending?'Resume round':'Spin the wheel'}<small>{pending&&!busy?'REVEAL YOUR SAVED ROUND':'LET THE MOMENT UNFOLD'}</small></span><Icon name="arrow"/></button></div>
      </section>
      <div className="roulette-footline"><span>VIRTUAL COINS · NO CASH VALUE</span><button onClick={()=>setTurbo(!turbo)} aria-pressed={turbo} disabled={busy}><Icon name="bolt"/>Quick spin {turbo?'on':'off'}</button><button onClick={()=>setModal({kind:'rouletteRules'})}>Rules & payouts</button></div>
    </section>
  </main>;
}
