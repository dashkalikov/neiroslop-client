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

export const themes = [
  { id: 'dark', label: 'Dark', icon: 'moon', color: '#0b0b0e' },
  { id: 'light', label: 'Light', icon: 'sun', color: '#ffffff' },
];

export const visualStyles = [
  { id: 'standard', label: 'Standard', icon: 'grid' },
  { id: 'glass', label: 'Liquid Glass', icon: 'sparkles' },
];

const normalizeTheme = value => value === 'light' ? 'light' : 'dark';
const normalizeStyle = value => value === 'glass' ? 'glass' : 'standard';

export function readAppearance(storage) {
  try {
    const saved = storage ?? localStorage;
    const theme = saved.getItem('lounge-theme');
    const style = saved.getItem('lounge-style') ?? (theme === 'glass' ? 'glass' : 'standard');
    return { theme: normalizeTheme(theme), style: normalizeStyle(style) };
  } catch {
    return { theme: 'dark', style: 'standard' };
  }
}

export function writeAppearance({ theme, style }, storage) {
  try {
    const saved = storage ?? localStorage;
    // Preserve the style before replacing the legacy combined theme value.
    saved.setItem('lounge-style', normalizeStyle(style));
    saved.setItem('lounge-theme', normalizeTheme(theme));
  } catch { /* Preferences work without storage too. */ }
}

const normalizeLanguage = value => value === 'ru' ? 'ru' : 'en';

export function readLanguage(storage) {
  try { return normalizeLanguage((storage ?? localStorage).getItem('lounge-language')); }
  catch { return 'en'; }
}

export function writeLanguage(value, storage) {
  const language = normalizeLanguage(value);
  try { (storage ?? localStorage).setItem('lounge-language', language); }
  catch { /* Preferences work without storage too. */ }
  return language;
}
