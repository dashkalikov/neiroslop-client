import { memo } from 'react';
import { asset } from '../data/games.js';

const types = ['gem', 'star', 'orb', 'crown', 'leaf', 'wild', 'scatter'];

function Symbol({ type, game }) {
  const index = Math.max(0, (game.symbolTypes||types).indexOf(type));
  const rows=game.spriteRows||2;
  return <span className={`reel-symbol symbol-${type}`} role="img" aria-label={game.symbolNames[index]}>
    <span className="symbol-sprite" style={{ backgroundImage: `url("${game.symbolAsset||asset(game.id, 'symbols')}")`, backgroundSize:`400% ${rows*100}%`,backgroundPosition: `${index % 4 * 100 / 3}% ${Math.floor(index/4)*100/(rows-1)}%` }} />
    {type === 'wild' || type === 'scatter' ? <span className="symbol-caption">{type === 'wild' ? 'WILD' : 'BONUS'}</span> : null}
  </span>;
}
export default memo(Symbol);
