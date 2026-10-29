import {useId} from 'react';
import {useLounge} from '../LoungeContext.jsx';
import Icon from './Icon.jsx';

export function VolumeSlider({settings=false}){
  const {volume,setVolume}=useLounge();
  const id=useId(),percent=Math.round(volume*100);
  return <label className={`volume-control ${settings?'settings-volume':'header-volume'}`} htmlFor={id}>
    {settings?<span>Master volume</span>:null}
    <input id={id} aria-label={settings?'Master volume':'Audio volume'} type="range" min="0" max="100" step="1" value={percent}
      style={{'--volume-fill':`${percent}%`}} onChange={event=>setVolume(Number(event.target.value)/100)}/>
    <output htmlFor={id}>{percent}%</output>
  </label>;
}

export default function AudioControls(){
  const {sound,setSound,volume}=useLounge();
  return <div className="global-audio-controls">
    <button className="icon-button audio-toggle" onClick={()=>setSound(!sound)} aria-label={sound?'Mute audio':'Enable audio'} aria-pressed={sound} title={sound?'Mute music and effects':'Play music and effects'}><Icon name={sound&&volume>0?'volume':'mute'}/></button>
    <VolumeSlider/>
  </div>;
}
