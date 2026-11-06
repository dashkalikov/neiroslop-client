import {useEffect,useState} from 'react';
import {useLounge} from '../LoungeContext.jsx';
import {api} from '../lib/api.js';
import {formatCoins} from '../data/games.js';
import AppearanceSettings from './AppearanceSettings.jsx';
import {History} from './InfoContent.jsx';
import Icon from './Icon.jsx';

const colors=['violet','mint','gold','rose'];
export default function AccountPage({navigate}){
  const {player,setPlayer,connection,notify,bonusReady,claimBonus,favorites,history}=useLounge();
  const preferences=player?.preferences;
  const [tab,setTab]=useState('profile'),[name,setName]=useState(preferences?.displayName||''),[avatar,setAvatar]=useState(preferences?.avatar||'violet'),[bet,setBet]=useState(String(preferences?.defaultBet||20)),[saving,setSaving]=useState(false);
  useEffect(()=>{setName(preferences?.displayName||'');setAvatar(preferences?.avatar||'violet');setBet(String(preferences?.defaultBet||20));},[player?.id,preferences?.displayName,preferences?.avatar,preferences?.defaultBet]);
  async function save(event){
    event.preventDefault();if(saving||!player)return;
    if(!/^\d+$/.test(bet)||Number(bet)<1||Number(bet)>10000)return notify('Enter a default wager from 1 to 10,000 whole coins.',true);
    setSaving(true);
    try{const saved=await api('account',{displayName:name.trim(),avatar,defaultBet:Number(bet)});setPlayer(saved);notify('Your player profile has been saved.');}catch(error){notify(error.message,true);}finally{setSaving(false);}
  }
  return <main className="account-page"><div className="account-heading"><div><p className="eyebrow">YOUR PERSONAL LOUNGE</p><h1>A place that feels like <em>you.</em></h1><p>Your profile, your preferences, your little lucky moments.</p></div><button className="secondary-button" onClick={()=>navigate('all')}>Back to games <Icon name="arrow"/></button></div>
    <div className="account-layout"><aside className="account-summary"><div className={'account-avatar avatar-'+(preferences?.avatar||'violet')}>{(preferences?.displayName||'G').slice(0,1).toUpperCase()}<i/></div><h2>{preferences?.displayName||'Your player account'}</h2><p><span className="green-dot"/>{connection==='connected'?'Connected to your wallet':'Waiting for your wallet'}</p><div className="account-coins"><small>YOUR VIRTUAL BALANCE</small><strong>✦ {player?formatCoins(player.balance):'—'}</strong><span>Room for a little more adventure.</span></div><button className="primary-button" onClick={claimBonus} disabled={!bonusReady}><Icon name="gift"/>{!player?'Connecting wallet…':bonusReady?'Claim 1,500 free coins':'Daily gift collected'}</button><div className="account-mini-stats"><span><b>{favorites.length}</b>Favorites</span><span><b>{history.length}</b>Recent rounds</span></div><div className="account-session-note"><Icon name="shield"/><p>This browser is linked to your guest account. Keep its cookies to return to your wallet and saved profile.</p></div></aside>
      <section className="account-content"><div className="account-tabs" role="tablist" aria-label="Account sections">{[['profile','Your profile','profile'],['preferences','Preferences','settings'],['activity','Activity','clock']].map(([id,title,icon])=><button key={id} role="tab" id={'account-tab-'+id} aria-selected={tab===id} aria-controls={'account-panel-'+id} onClick={()=>setTab(id)}><Icon name={icon}/>{title}</button>)}</div>
        <div className="account-tab-content" role="tabpanel" id={'account-panel-'+tab} aria-labelledby={'account-tab-'+tab}>
          {tab==='profile'?<><div className="account-section-title"><span>THE LITTLE DETAILS</span><h2>Make it personal.</h2><p>A familiar name and a little color to call your own.</p></div><form className="account-form" onSubmit={save}><label>Display name<input aria-label="Display name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={24} required placeholder="Your name in the lounge" disabled={!player||saving}/><small>2–24 characters. Shown in your account and header.</small></label><fieldset disabled={!player||saving}><legend>Avatar color</legend><div className="account-avatar-choices">{colors.map(color=><button key={color} type="button" className={'avatar-'+color} aria-label={`${color[0].toUpperCase()+color.slice(1)} avatar`} aria-pressed={avatar===color} onClick={()=>setAvatar(color)}>{name.trim().slice(0,1).toUpperCase()||'G'}{avatar===color?<i>✓</i>:null}</button>)}</div></fieldset><label>Default wager<div className="account-default-wager"><input aria-label="Default wager" type="text" inputMode="numeric" pattern="[0-9]+" value={bet} onChange={e=>setBet(e.target.value)} maxLength={5} required disabled={!player||saving}/><span>virtual coins</span></div><small>Used for new slot games and your initial roulette chip. 1–10,000 coins.</small></label><div className="account-save-row"><span><Icon name="shield"/>Profile saved with your wallet</span><button className="primary-button" type="submit" disabled={!player||saving}>{saving?'Saving…':'Save profile'}<Icon name="arrow"/></button></div></form><div className="account-preferences-teaser"><Icon name="sparkles"/><div><strong>A different mood for every moment.</strong><p>Choose a background, a theme, and your soundtrack.</p></div><button onClick={()=>setTab('preferences')}>Explore preferences <Icon name="arrow"/></button></div></>:tab==='preferences'?<><div className="account-section-title"><span>SET THE MOOD</span><h2>Your lounge, your way.</h2><p>Appearance and audio preferences are saved on this device.</p></div><AppearanceSettings/></>:<><div className="account-section-title"><span>YOUR RECENT ADVENTURES</span><h2>A little history.</h2></div><History/></>}
        </div>
      </section></div>
  </main>;
}
