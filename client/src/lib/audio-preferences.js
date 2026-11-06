export const SOUNDTRACKS = [
  { id: 'lounge', title: 'Lounge Original', description: 'Warm electric piano and soft chords.', file: 'lounge-soundtrack.wav' },
  { id: 'golden-hour', title: 'Golden Hour', description: 'A gentle melody with plucked keys.', file: 'golden-hour.wav' },
  { id: 'moonlit-keys', title: 'Moonlit Keys', description: 'Slow piano phrases and airy harmonies.', file: 'moonlit-keys.wav' },
];

export function getSoundtrack(id) {
  return SOUNDTRACKS.find(track => track.id === id) ?? SOUNDTRACKS[0];
}

export const DEFAULT_AUDIO_PREFERENCES = Object.freeze({
  volume: .55,
  musicVolume: .5,
  effectsVolume: 1,
  winVolume: 1,
  soundtrack: 'lounge',
});

const storageKey = 'lounge-audio-preferences';

export function normalizeVolume(value, fallback = DEFAULT_AUDIO_PREFERENCES.volume) {
  if (typeof value !== 'number' && !(typeof value === 'string' && value.trim())) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

export function normalizeAudioPreferences(options) {
  return {
    volume: normalizeVolume(options.volume),
    musicVolume: normalizeVolume(options.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume),
    effectsVolume: normalizeVolume(options.effectsVolume, DEFAULT_AUDIO_PREFERENCES.effectsVolume),
    winVolume: normalizeVolume(options.winVolume, DEFAULT_AUDIO_PREFERENCES.winVolume),
    soundtrack: getSoundtrack(options.soundtrack).id,
  };
}

export function readAudioPreferences(storage) {
  let volume = DEFAULT_AUDIO_PREFERENCES.volume;
  try {
    const store = storage ?? localStorage;
    const oldVolume = store.getItem('lounge-volume');
    const number = Number(oldVolume);
    if (oldVolume?.trim() && number >= 0 && number <= 1) volume = number;
    const saved = JSON.parse(store.getItem(storageKey) ?? 'null');
    return normalizeAudioPreferences({ ...saved, volume: saved?.volume ?? volume });
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES, volume };
  }
}

export function writeAudioPreferences(options, storage) {
  const preferences = normalizeAudioPreferences(options);
  try {
    (storage ?? localStorage).setItem(storageKey, JSON.stringify(preferences));
  } catch { /* Storage is optional. */ }
  return preferences;
}
