import { memo } from 'react';
import { createPortal } from 'react-dom';
import { WinToken, tokenTypes } from './WinToken.jsx';

// Stable variation: only CSS transforms run during a win.
const coins = Array.from({ length: 64 }, (_, i) => {
  const burst = i % 3 !== 0;
  const x = (i * 37) % 108 - 4;
  return {
    type: i % 19 === 0 ? 'stack-blue' : i % 23 === 0 ? 'stack-purple' : tokenTypes[i % tokenTypes.length],
    style: {
      '--delay': `${(i % 12) * .065}s`,
      '--duration': `${2.8 + (i % 7) * .17}s`,
      '--size': `${34 + (i % 6) * 9}px`,
      '--start-x': `${burst ? 42 + (i % 7) * 3 : x}vw`,
      '--start-y': burst ? '102vh' : '-18vh',
      '--peak-x': `${x}vw`,
      '--peak-y': `${burst ? 3 + (i * 17) % 38 : 28 + (i * 11) % 27}vh`,
      '--end-x': `${x + (i % 2 ? -1 : 1) * (10 + i % 16)}vw`,
      '--turn-start': `${(i * 53) % 360}deg`,
      '--turn-end': `${(i % 2 ? -1 : 1) * (360 + i * 19)}deg`,
      '--tumble': `${(i % 2 ? -1 : 1) * (360 + i % 5 * 180)}deg`,
      '--tilt': `${16 + i % 5 * 9}deg`,
    },
  };
});

function CoinRain() {
  return createPortal(<div className="coin-rain" aria-hidden="true">
    {coins.map((coin, i) => <span key={i} className="falling-coin" style={coin.style}><WinToken type={coin.type}/></span>)}
    {coins.slice(0, 22).map((coin, i) => <span key={i} className="win-spark" style={coin.style}/>)}
  </div>, document.body);
}
export default memo(CoinRain);
