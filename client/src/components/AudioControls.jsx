import {useId} from 'react';
import {useLounge} from '../LoungeContext.jsx';
import {getSoundtrack, SOUNDTRACKS} from '../lib/audio-preferences.js';
import Icon from './Icon.jsx';

function VolumeSlider({ label, value, onChange, header = false }) {
  const id = useId();
  const percent = Math.round(value * 100);
  return <label className={`volume-control ${header ? 'header-volume' : 'settings-volume'}`} htmlFor={id}>
    {header ? null : <span>{label}</span>}
    <input id={id} aria-label={label} type="range" min="0" max="100" step="1" value={percent}
      style={{'--volume-fill':`${percent}%`}} onChange={event => onChange(Number(event.target.value) / 100)} />
    <output htmlFor={id}>{percent}%</output>
  </label>;
}

const volumeControls = [
  ['volume', 'Master volume'],
  ['musicVolume', 'Background music'],
  ['effectsVolume', 'Game effects'],
  ['winVolume', 'Win sounds'],
];

export function SoundSettings() {
  const { sound, setSound, audioPreferences, setAudioPreference } = useLounge();
  const track = getSoundtrack(audioPreferences.soundtrack);
  const id = useId();

  return <section className="settings-sound-section" aria-labelledby={`${id}-heading`}>
    <div className="settings-section-heading">
      <div>
        <h3 id={`${id}-heading`}>Music &amp; sound</h3>
        <p>Set separate levels for music, game effects, and win sounds.</p>
      </div>
      <button type="button" className={`settings-sound-toggle ${sound ? 'active' : ''}`}
        onClick={() => setSound(!sound)} aria-pressed={sound}
        aria-label={sound ? 'Mute music and sound' : 'Enable music and sound'}>
        <Icon name={sound ? 'volume' : 'mute'} />{sound ? 'Audio on' : 'Audio off'}
      </button>
    </div>
    <div className="settings-audio-mix">
      {volumeControls.map(([key, label]) => <VolumeSlider key={key} label={label}
        value={audioPreferences[key]} onChange={value => setAudioPreference(key, value)} />)}
    </div>
    <div className="soundtrack-choice">
      <div>
        <label htmlFor={`${id}-track`}>Background track</label>
        <p id={`${id}-description`}>{track.description}</p>
      </div>
      <select id={`${id}-track`} aria-describedby={`${id}-description`} value={track.id}
        onChange={event => setAudioPreference('soundtrack', event.target.value)}>
        {SOUNDTRACKS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </div>
  </section>;
}

export default function AudioControls(){
  const { sound, setSound, audioPreferences: { volume }, setAudioPreference } = useLounge();
  return <div className="global-audio-controls">
    <button className="icon-button audio-toggle" onClick={()=>setSound(!sound)} aria-label={sound?'Mute audio':'Enable audio'} aria-pressed={sound} title={sound?'Mute music and effects':'Play music and effects'}><Icon name={sound&&volume>0?'volume':'mute'}/></button>
    <VolumeSlider header label="Audio volume" value={volume} onChange={value => setAudioPreference('volume', value)} />
  </div>;
}
