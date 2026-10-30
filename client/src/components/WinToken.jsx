export const tokenTypes = [
  'chip-green', 'coin-gold', 'chip-blue', 'coin-silver', 'chip-orange',
  'chip-purple', 'coin-gold', 'chip-red', 'chip-platinum', 'chip-pink',
];

export function WinToken({ type }) {
  return <span className="win-token"><img src={`/assets/win-tokens/${type}.svg`} alt="" draggable="false"/></span>;
}

export function CoinSpill({ compact = false }) {
  return <div className={`coin-spill${compact ? ' compact' : ''}`} aria-hidden="true">
    {Array.from({ length: compact ? 22 : 28 }, (_, i) => <span className="payout-token" key={i} style={{
      '--dx': `${((i * 43) % (compact ? 220 : 380)) - (compact ? 110 : 190)}px`,
      '--lift': `${(compact ? 40 : 80) + (i * 29) % (compact ? 90 : 130)}px`,
      '--delay': `${(i % 11) * .045}s`,
      '--turn': `${i * 87}deg`,
    }}><WinToken type={tokenTypes[i % tokenTypes.length]}/></span>)}
  </div>;
}
