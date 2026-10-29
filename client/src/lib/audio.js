import {createAudioMixer} from './audio-mixer.js';

const mixer=createAudioMixer();
export const attachMusic=media=>mixer.attachMusic(media);
export const configureAudio=options=>mixer.configure(options);
export const prepareSlotAudio=()=>mixer.prepareEffects();
export const stopGameEffects=()=>mixer.stopEffects();
export const playColumnLandings=(symbols,column,options)=>mixer.landColumn(symbols,column,options);
export const playTone=kind=>mixer.playEffect(kind);

