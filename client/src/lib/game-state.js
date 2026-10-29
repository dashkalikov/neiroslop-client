export const MIN_BET = 1;
export const MAX_BET = 10000;
export const BETS = [1, 10, 20, 50, 100, 200, 500, 1000, 5000, 10000];

export function nextBet(current, direction, locked = false) {
  if (locked) return current;
  return direction > 0
    ? BETS.find(amount => amount > current) ?? MAX_BET
    : BETS.findLast(amount => amount < current) ?? MIN_BET;
}

export const INITIAL_GRID = [
  ['gem', 'orb', 'star'], ['leaf', 'crown', 'gem'], ['star', 'gem', 'scatter'],
  ['orb', 'wild', 'leaf'], ['crown', 'star', 'orb'],
];

export const PAYLINES = [[1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2]];

export function parseWager(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= MIN_BET && amount <= MAX_BET ? amount : null;
}

export function autoAction({ready, paused, spinning, balance, bet, freeSpins}) {
  if (spinning || paused || !ready) return 'wait';
  if (!Number.isInteger(bet) || bet < MIN_BET || bet > MAX_BET) return 'invalid';
  return freeSpins > 0 || balance >= bet ? 'spin' : 'funds';
}

export const CLASSIC_PAYLINES = [[1,1,1], [0,0,0], [2,2,2], [0,1,0], [2,1,2]];
export const BASS_PAYLINES = [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]];

export function leverPose(progress) {
  const angle = Math.max(0,Math.min(1,progress))*Math.PI;
  return {x:52,y:Math.round(195-Math.cos(angle)*155)};
}

export function leverProgress(startY,currentY,scale=1) {
  return Math.max(0,Math.min(1,(currentY-startY)/(310*Math.max(.1,scale))));
}
