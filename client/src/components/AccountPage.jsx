import { useLanguage } from '../LanguageContext.jsx';
import {useEffect,useState} from 'react';
import {useLounge} from '../LoungeContext.jsx';
import AvatarImage from './AvatarImage.jsx';
import AvatarSettings from './AvatarSettings.jsx';
import {api, avatarSource} from '../lib/api.js';
import {formatCoins} from '../data/games.js';
import AppearanceSettings from './AppearanceSettings.jsx';
import AccountSecurity from './AccountSecurity.jsx';
import {History} from './InfoContent.jsx';
import WalletRewards, { WalletTransactions } from './WalletRewards.jsx';
import Icon from './Icon.jsx';

const colors=['violet','mint','gold','rose'];
export default function AccountPage({navigate}){
  const { t, language } = useLanguage();
  const {player,avatarRevision,setPlayer,connection,notify,bonusReady,claimBonus,favorites,history,busy}=useLounge();
  const preferences=player?.preferences;
  const [tab,setTab]=useState('profile'),[name,setName]=useState(preferences?.displayName || ''),[avatar,setAvatar]=useState(preferences?.avatar||'violet'),[bet,setBet]=useState(String(preferences?.defaultBet||20)),[saving,setSaving]=useState(false);
  useEffect(()=>{setName(preferences?.displayName || '');setAvatar(preferences?.avatar||'violet');setBet(String(preferences?.defaultBet||20));},[player?.id,preferences?.displayName,preferences?.avatar,preferences?.defaultBet]);
  async function save(event){
    event.preventDefault();if(saving||busy||!player)return;
    if(!/^\d+$/.test(bet)||Number(bet)<1||Number(bet)>10000)return notify('Enter a default wager from 1 to 10,000 whole coins.',true);
    setSaving(true);
    try{const saved=await api('account',{displayName:name.trim(),avatar,defaultBet:Number(bet)},player.id);setPlayer(current => current?.id === saved.id ? { ...current, preferences: saved.preferences } : current);notify('Your player profile has been saved.');}catch(error){notify(error.message,true);}finally{setSaving(false);}
  }
  return <main className="account-page"><div className="account-heading"><div><p className="eyebrow">{t("YOUR PERSONAL LOUNGE")}</p><h1>{t("A place that feels like") + " "}<em>{t("you.")}</em></h1><p>{t("Your profile, your preferences, your little lucky moments.")}</p></div><button className="secondary-button" onClick={()=>navigate('all')}>{t("Back to games") + " "}<Icon name="arrow"/></button></div>
    <div className="account-layout"><aside className="account-summary"><div className={'account-avatar avatar-'+(preferences?.avatar||'violet')}><AvatarImage preferences={preferences} source={avatarSource(player, avatarRevision)} /><i/></div><h2>{preferences?.displayName === 'Lucky Guest' ? t('Lucky Guest') : preferences?.displayName || t('Your player account')}</h2><p><span className="green-dot"/>{connection==='connected'?t("Connected to your wallet"):t("Waiting for your wallet")}</p><div className="account-coins"><small>{t("YOUR VIRTUAL BALANCE")}</small><strong>✦ {player?formatCoins(player.balance, language):'—'}</strong><span>{t("Room for a little more adventure.")}</span></div><button className="primary-button" onClick={claimBonus} disabled={!bonusReady}><Icon name="gift"/>{!player?t("Connecting wallet…"):bonusReady?t("Claim 1,500 free coins"):t("Daily gift collected")}</button><div className="account-mini-stats"><span><b>{favorites.length}</b>{t("Favorites")}</span><span><b>{history.length}</b>{t("Recent rounds")}</span></div><div className="account-session-note"><Icon name="shield"/><p>{t('Signed in as {0}.', player.account.username)}</p></div></aside>
      <section className="account-content"><div className="account-tabs" role="tablist" aria-label={t("Account sections")}>{[['profile','Your profile','profile'],['preferences','Preferences','settings'],['activity','Activity','clock'],['rewards','Rewards','gift'],['security','Security','shield']].map(([id,title,icon])=><button key={id} role="tab" id={'account-tab-'+id} aria-selected={tab===id} aria-controls={'account-panel-'+id} disabled={busy || saving} onClick={()=>setTab(id)}><Icon name={icon}/>{t(title)}</button>)}</div>
        <div className="account-tab-content" role="tabpanel" id={'account-panel-'+tab} aria-labelledby={'account-tab-'+tab}>
          {tab==='profile'?<><div className="account-section-title"><span>{t("THE LITTLE DETAILS")}</span><h2>{t("Make it personal.")}</h2><p>{t("A familiar name and a little color to call your own.")}</p></div><form className="account-form" onSubmit={save}><label>{t("Nickname")}<input aria-label={t("Nickname")} value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={24} required placeholder={t("Your name in the lounge")} disabled={!player||saving||busy}/><small>{t("2–24 characters. Shown in your account and header.")}</small></label><fieldset disabled={!player||saving||busy}><legend>{t("Avatar color")}</legend><div className="account-avatar-choices">{colors.map(color=><button key={color} type="button" className={'avatar-'+color} aria-label={t('{0} avatar', t(color[0].toUpperCase() + color.slice(1)))} aria-pressed={avatar===color} onClick={()=>setAvatar(color)}>{name.trim().slice(0,1).toUpperCase()||'G'}{avatar===color?<i>✓</i>:null}</button>)}</div></fieldset><label>{t("Default wager")}<div className="account-default-wager"><input aria-label={t("Default wager")} type="text" inputMode="numeric" pattern="[0-9]+" value={bet} onChange={e=>setBet(e.target.value)} maxLength={5} required disabled={!player||saving||busy}/><span>{t("virtual coins")}</span></div><small>{t("Used for new slot games and your initial roulette chip. 1–10,000 coins.")}</small></label><div className="account-save-row"><span><Icon name="shield"/>{t("Profile saved with your wallet")}</span><button className="primary-button" type="submit" disabled={!player||saving||busy}>{saving?t("Saving…"):t("Save profile")}<Icon name="arrow"/></button></div><AvatarSettings disabled={busy || saving} /></form><div className="account-preferences-teaser"><Icon name="sparkles"/><div><strong>{t("A different mood for every moment.")}</strong><p>{t("Choose a background, a theme, and your soundtrack.")}</p></div><button onClick={()=>setTab('preferences')}>{t("Explore preferences") + " "}<Icon name="arrow"/></button></div></>:tab==='preferences'?<><div className="account-section-title"><span>{t("SET THE MOOD")}</span><h2>{t("Your lounge, your way.")}</h2><p>{t("Appearance and audio preferences are saved on this device.")}</p></div><AppearanceSettings/></>:tab==='rewards'?<WalletRewards/>:tab==='security'?<AccountSecurity/>:<><div className="account-section-title"><span>{t("YOUR RECENT ADVENTURES")}</span><h2>{t("A little history.")}</h2></div><History/><WalletTransactions/></>}
        </div>
      </section></div>
  </main>;
}
