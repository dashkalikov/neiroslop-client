import Symbol from './Symbol.jsx';
import {formatCoins} from '../data/games.js';

export default function BassDetails({game,feature,freeSpins,result}) {
  const total=feature?.fishermen||0;
  const level=freeSpins?(feature?.batches?.[0]?.multiplier||1):1;
  const progress=total>=12?4:total%4;
  return <div className="bass-feature-panel">
    <div className="bass-collector"><Symbol game={game} type="wild"/><div><span>THE FISHERMAN’S CATCH</span><strong>{result?.collectionPayout?`+${formatCoins(result.collectionPayout)} coins` :freeSpins?'Collect every money fish':'Catch the free-spin feature'}</strong><small>{freeSpins?`${freeSpins} free spins · ${level}× catch value`:'3 / 4 / 5 scatters → 10 / 15 / 20 free spins'}</small></div></div>
    <div className="bass-progress"><span>FISHERMEN <b>{progress}/4</b></span><div>{Array.from({length:4},(_,i)=><i key={i} className={i<progress?'caught':''}><Symbol game={game} type="wild"/></i>)}</div><small>{total>=12?'Final tier reached': 'Four fishermen unlock 10 more spins'}</small></div>
    <div className="bass-multipliers" aria-label="Collection multipliers">{[1,2,3,10].map(value=><span key={value} className={value===level?'current':''}>{value}×<small>{value===1?'START':'RETRIGGER'}</small></span>)}</div>
  </div>;
}
