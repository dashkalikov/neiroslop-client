import { createAudioMixer } from './audio-mixer.js';

// Один экземпляр держит музыку и эффекты для всех экранов.
// Переименовываем экспорты, чтобы компоненты сохранили прежние импорты.
export const {
  attachMusic,
  configure: configureAudio,
  prepareEffects: prepareSlotAudio,
  stopEffects: stopGameEffects,
  landColumn: playColumnLandings,
  playEffect: playTone,
  rouletteRoll: createRouletteRoll,
} = createAudioMixer();
