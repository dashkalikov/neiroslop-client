import { memo } from 'react';
import { createPortal } from 'react-dom';

const coins = Array.from({length:64}, (_, i) => ({
  left:`${(i*37)%103-2}%`, delay:`${(i%13)*.057}s`, duration:`${2.1+(i%7)*.16}s`,
  size:`${22+(i%5)*6}px`, drift:`${(i%2?-1:1)*(30+i%6*13)}px`, rotation:`${i%2?'-':''}${450+i*17}deg`,
}));

function CoinRain() {
  return createPortal(<div className="coin-rain" aria-hidden="true">{coins.map((coin,i)=><span key={i} className="falling-coin" style={{left:coin.left,'--delay':coin.delay,'--duration':coin.duration,'--size':coin.size,'--drift':coin.drift,'--rotation':coin.rotation}}><i>✦</i></span>)}</div>,document.body);
}
export default memo(CoinRain);
