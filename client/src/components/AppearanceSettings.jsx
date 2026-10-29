import {backgrounds,backgroundById} from '../data/backgrounds.js';
import {useLounge} from '../LoungeContext.jsx';
import Icon from './Icon.jsx';
import {VolumeSlider} from './AudioControls.jsx';

export default function AppearanceSettings() {
  const {theme,setTheme,background,setBackground,sound,setSound}=useLounge();
  return <div className="appearance-settings">
    <p className="settings-intro">Make yourself at home. Choose your colors, your view and your soundtrack.</p>
    <div className="settings-section-heading"><div><h3>Appearance</h3><p>A familiar feel, day or night.</p></div><div className="appearance-mode" role="group" aria-label="Color theme">{['dark','light'].map(mode=><button key={mode} aria-pressed={theme===mode} onClick={()=>setTheme(mode)}><Icon name={mode==='dark'?'moon':'sun'}/>{mode==='dark'?'Dark':'Light'}</button>)}</div></div>
    <div className="settings-sound-section"><div className="settings-section-heading"><div><h3>Music & sound</h3><p>A mellow lounge soundtrack, shared by every game.</p></div><button className={`settings-sound-toggle ${sound?'active':''}`} onClick={()=>setSound(!sound)} aria-pressed={sound} aria-label={sound?'Mute music and sound':'Enable music and sound'}><Icon name={sound?'volume':'mute'}/>{sound?'Audio on':'Audio off'}</button></div><VolumeSlider settings/></div>
    <div className="settings-section-heading wallpaper-heading"><div><h3>Your background</h3><p>Across the lobby and every game.</p></div><span>{backgroundById[background].name}</span></div>
    <div className="background-grid" role="radiogroup" aria-label="Application background">
      {backgrounds.map(item=><button key={item.id} role="radio" aria-checked={background===item.id} aria-label={`${item.name}${item.id==='none'?' — no background image':''}`} className={`background-choice ${background===item.id?'selected':''}`} onClick={()=>setBackground(item.id)}>
        <span className={`background-thumbnail ${!item.image?'no-image':''}`}>{item.image?<img src={item.image} alt="" loading="lazy"/>:<span><Icon name="grid"/><b>No background image</b></span>}<i>{background===item.id?'✓':''}</i></span>
        <strong>{item.name}</strong><small>{item.description}</small>
      </button>)}
    </div>
    <div className="settings-saved"><Icon name="shield"/><span>Saved automatically on this device. Choose Classic to return to the original background.</span></div>
  </div>;
}
