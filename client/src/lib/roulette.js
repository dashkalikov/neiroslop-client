export const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const numberColor=n=>n===0?'green':RED.has(n)?'red':'black';
export const totalStake=bets=>bets.reduce((sum,b)=>sum+b.amount,0);
export function placeChip(bets,position,amount,balance){
  if(!Number.isInteger(amount)||amount<1||totalStake(bets)+amount>Math.min(10000,balance))throw new Error('Choose whole coins within your balance and the 10,000-coin table limit.');
  const found=bets.find(b=>b.kind===position.kind&&b.value===position.value);
  return found?bets.map(b=>b===found?{...b,amount:b.amount+amount}:b):[...bets,{...position,amount}];
}
const mod=n=>((n%360)+360)%360;
export function rouletteAngles(wheel,ball,number){
  const index=WHEEL.indexOf(number);
  if(index<0)throw new Error('Unknown roulette pocket.');
  const nextWheel=wheel+1800+53;
  const target=mod(nextWheel+index*360/37);
  return {wheel:nextWheel,ball:ball-3240-mod(ball-target)};
}
export const betLabel=b=>b.kind==='straight'?`Number ${b.value}`:b.kind==='dozen'?`${['1st','2nd','3rd'][b.value-1]} dozen`:b.kind==='column'?`Column ${b.value}`:b.kind==='low'?'1–18':b.kind==='high'?'19–36':b.kind[0].toUpperCase()+b.kind.slice(1);
