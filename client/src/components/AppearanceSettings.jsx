import { useLanguage } from '../LanguageContext.jsx';
import {backgrounds,backgroundById} from '../data/backgrounds.js';
import {useLounge} from '../LoungeContext.jsx';
import Icon from './Icon.jsx';
import { themes, visualStyles } from '../lib/appearance.js';
import LanguageSettings from './LanguageSettings.jsx';
import {SoundSettings} from './AudioControls.jsx';

export default function AppearanceSettings() {
  const { t } = useLanguage();
  const {theme,setTheme,visualStyle,setVisualStyle,background,setBackground}=useLounge();
  return <div className="appearance-settings">
    <LanguageSettings />
    <p className="settings-intro">{t("Make yourself at home. Choose your colors, your view and your soundtrack.")}</p>
    <div className="settings-section-heading">
      <div><h3>{t("Color mode")}</h3><p>{t("Choose a dark or light palette.")}</p></div>
      <div className="appearance-mode" role="group" aria-label={t("Color mode")}>
        {themes.map(mode => <button key={mode.id} aria-pressed={theme === mode.id} onClick={() => setTheme(mode.id)}><Icon name={mode.icon}/>{t(mode.label)}</button>)}
      </div>
    </div>
    <div className="settings-section-heading">
      <div><h3>{t("Visual style")}</h3><p>{t("Available in both color modes.")}</p></div>
      <div className="appearance-mode" role="group" aria-label={t("Visual style")}>
        {visualStyles.map(style => <button key={style.id} aria-pressed={visualStyle === style.id} onClick={() => setVisualStyle(style.id)}><Icon name={style.icon}/>{t(style.label)}</button>)}
      </div>
    </div>
    <SoundSettings />
    <div className="settings-section-heading wallpaper-heading"><div><h3>{t("Your background")}</h3><p>{t("Across the lobby and every game.")}</p></div><span>{t(backgroundById[background].name)}</span></div>
    <div className="background-grid" role="radiogroup" aria-label={t("Application background")}>
      {backgrounds.map(item=><button key={item.id} role="radio" aria-checked={background===item.id} aria-label={t(item.name)} className={`background-choice ${background===item.id?'selected':''}`} onClick={()=>setBackground(item.id)}>
        <span className={`background-thumbnail ${!item.image?'no-image':''}`}>{item.image?<img src={item.image} alt="" loading="lazy"/>:<span><Icon name="grid"/><b>{t("No background image")}</b></span>}<i>{background===item.id?'✓':''}</i></span>
        <strong>{t(item.name)}</strong><small>{t(item.description)}</small>
      </button>)}
    </div>
    <div className="settings-saved"><Icon name="shield"/><span>{t("Saved automatically on this device. Choose Classic to return to the original background.")}</span></div>
  </div>;
}
