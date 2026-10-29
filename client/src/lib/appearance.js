import {backgroundById} from '../data/backgrounds.js';

const normalize = value => Object.hasOwn(backgroundById,value) ? value : 'none';
export function readBackground(storage) {
  try {return normalize((storage??localStorage).getItem('lounge-background'));}
  catch {return 'none';}
}
export function writeBackground(value,storage) {
  const selected=normalize(value);
  try {(storage??localStorage).setItem('lounge-background',selected);} catch { /* Preferences work without storage too. */ }
  return selected;
}
