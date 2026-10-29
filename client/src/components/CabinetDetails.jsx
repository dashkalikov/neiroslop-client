import Symbol from './Symbol.jsx';

export function ClassicMarquee({ game, winning }) {
  return <>
    <div className={`classic-crown ${winning ? 'lit' : ''}`} aria-hidden="true"><i /><span>✦</span><i /></div>
    <div className="classic-marquee">
      <div className="marquee-bulbs" aria-hidden="true">{Array.from({length:18}, (_,i)=><i key={i} style={{'--bulb':i}} />)}</div>
      <span>LUCKY LOUNGE</span><strong>VELVET SEVENS</strong>
      <small>3-REEL CLASSIC &nbsp; · &nbsp; TOKEN PLAY &nbsp; · &nbsp; MODEL 07</small>
    </div>
    <div className="classic-pay-glass">
      <span><span className="pay-symbols">{[0,1,2].map(i=><Symbol key={i} game={game} type="gem"/>)}</span><b>3 MATCHING SYMBOLS<small>2× BET</small></b></span>
      <span><Symbol game={game} type="wild"/><b>3 WILDS<small>10× BET</small></b></span>
      <span><Symbol game={game} type="scatter"/><b>3 BONUS TOKENS<small>7 FREE SPINS</small></b></span>
    </div>
  </>;
}

export function ClassicApron() {
  return <div className="classic-apron" aria-hidden="true">
    <div className="cabinet-speaker">{Array.from({length:7}, (_,i)=><i key={i} />)}</div>
    <div className="serial-plate"><strong>LL · 007</strong><span>MECHANICAL COLLECTION</span><small>VIRTUAL TOKEN MACHINE</small></div>
    <div className="token-acceptor"><i /><span>TOKENS</span><b>✦</b></div>
    <i className="service-lock" />
  </div>;
}

export function MineDetails({ cascades, collected, freeSpins }) {
  return <>
    <div className="mine-cabinet-header"><span className="mine-lantern" aria-hidden="true"><i /></span><div><small>CANYON MINING COMPANY</small><strong>THE GOLD VEIN</strong><span>EST. 1849 &nbsp; ✦ &nbsp; EVERY DISCOVERY TELLS A STORY</span></div><span className="mine-lantern" aria-hidden="true"><i /></span></div>
    <div className="mine-track"><span><i />{freeSpins ? 'BONUS EXPEDITION' : 'EXPEDITION READY'}</span><strong>{cascades ? `CASCADE ${cascades}` : 'WINNING SYMBOLS TUMBLE AGAIN'}</strong><span>ORE COLLECTED <b>{collected.toLocaleString('en-US')}</b></span></div>
  </>;
}
