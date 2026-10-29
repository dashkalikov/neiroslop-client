import Symbol from './Symbol.jsx';

const pays=[['float','0.5','5','20','200'],['rod','—','3','15','100'],['dragonfly','—','2','10','50'],['tackle','—','2','10','50'],['fish','—','1','5','20'],['A','—','0.5','2.5','10'],['K','—','0.5','2.5','10'],['Q','—','0.5','2.5','10'],['J','—','0.5','2.5','10'],['10','—','0.5','2.5','10']];
export default function BigBassRules({game}) {
  return <><p>A virtual-coin recreation with original illustrations, based on the fishing feature described by <a href="https://www.pragmaticplay.com/en/games/big-bass-bonanza/" target="_blank" rel="noreferrer">Pragmatic Play</a>. Five reels, three rows and ten fixed paylines pay from the leftmost reel.</p>
    <h3>Fish & collect</h3><p>Land 3, 4 or 5 scatters to start 10, 15 or 20 free spins. In free spins, each fisherman wild collects all visible fish values. Four collected fishermen queue 10 more spins; the new batch collects at 2×, then 3×, then 10×. The current batch finishes before the next multiplier starts. Three retriggers are available.</p>
    <p>Money fish may carry 2×, 5×, 10×, 15×, 20×, 25×, 50× or 2,000× the wager. They also pay on lines. Fishermen substitute for other symbols except scatters and appear only during free spins.</p>
    <table className="paytable bass-paytable"><thead><tr><th>SYMBOL</th><th>2</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>{pays.map(([type,...values])=><tr key={type}><td><Symbol game={game} type={type}/>{game.symbolNames[game.symbolTypes.indexOf(type)]}</td>{values.map((value,i)=><td key={i}>{value}{value==='—'?'':'×'}</td>)}</tr>)}</tbody></table>
    <p>Multipliers above apply to the total wager. Fractional virtual coins round down once per round. This local recreation uses its own random weights and a 2,100× feature cap; it does not reproduce the licensed game’s RTP, random extra-fish events or operator promotions.</p></>;
}
