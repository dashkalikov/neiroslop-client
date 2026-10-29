export const DEFAULT_VOLUME=.55;
export function normalizeVolume(value){
  const number=Number(value);
  return Number.isFinite(number)?Math.max(0,Math.min(1,number)):DEFAULT_VOLUME;
}
export function readVolume(storage){
  try{
    const raw=(storage??localStorage).getItem('lounge-volume');
    if(raw===null||raw===undefined||raw==='')return DEFAULT_VOLUME;
    const number=Number(raw);
    return Number.isFinite(number)&&number>=0&&number<=1?number:DEFAULT_VOLUME;
  }catch{return DEFAULT_VOLUME;}
}
export function writeVolume(value,storage){
  const volume=normalizeVolume(value);
  try{(storage??localStorage).setItem('lounge-volume',String(volume));}catch{/* Storage is optional. */}
  return volume;
}
