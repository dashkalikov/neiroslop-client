import { createPortal } from 'react-dom';
import { useLanguage } from './LanguageContext.jsx';
import { lazy, startTransition, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { LoungeProvider, useLounge } from './LoungeContext.jsx';
import { gameById, formatCoins } from './data/games.js';
import AccountAccess from './components/AccountAccess.jsx';
import AvatarImage from './components/AvatarImage.jsx';
import { avatarSource } from './lib/api.js';
import { sessionView } from './lib/startup.js';
import Icon from './components/Icon.jsx';
import Lobby from './components/Lobby.jsx';
import GameScreen from './components/GameScreen.jsx';
import Modal from './components/Modal.jsx';
import InfoContent, { modalTitles } from './components/InfoContent.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import {backgroundById} from './data/backgrounds.js';
import AudioControls from './components/AudioControls.jsx';
import Brand from './components/Brand.jsx';
import {GAME_GROUPS} from './lib/catalog.js';
const RouletteGame=lazy(()=>import('./components/RouletteGame.jsx'));
const AccountPage=lazy(()=>import('./components/AccountPage.jsx'));

function Shell() {
  const { t, language } = useLanguage();
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'all');
  const lounge = useLounge();
  const { player, avatarRevision, favorites, connection, connect, bonusReady, claimBonus, now, modal, setModal, busy, notify,background } = lounge;
  const activeGame = route.startsWith('game/') ? gameById[route.split('/')[1]] : null;
  const view = ['favorites','recent'].includes(route) ? route : 'all';
  const account=route==='account';
  const group=GAME_GROUPS.some(g=>route==='category/'+g.id)?route.split('/')[1]:'all';
  useEffect(() => {
    const handleRoute = () => startTransition(() => setRoute(location.hash.slice(1) || 'all'));
    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, []);
  useEffect(() => { document.title = `${account?t('My account'):activeGame?.name||t('Virtual Casino')} — NEIROSLOP BURMALDA`; }, [activeGame,account,t]);
  function navigate(next) {
    if (busy) return notify('One little moment—the current round is still playing.');
    location.hash = next;
  }
  const hours = player ? Math.max(1, Math.ceil((player.bonusReadyAt-now)/3600000)) : 0;
  return <div className={`app-shell ${background!=='none'?'has-wallpaper':''}`}>
    {background!=='none'?<div className="app-wallpaper" style={{backgroundImage:`url("${backgroundById[background].image}")`}} aria-hidden="true"/>:null}
    <aside className="sidebar"><a className="brand" href="#all" onClick={e => {e.preventDefault();navigate('all');}} aria-label={t("NEIROSLOP BURMALDA home")}><Brand/></a><div className="space-label">{t("YOUR LITTLE ESCAPE")}</div>
      <nav aria-label={t("Main navigation")}>{[['all','lobby','Casino lobby'],['favorites','heart','My favorites'],['recent','clock','Recently played'],['category/tables','roulette','Table games'],['account','profile','My account']].map(([id,icon,title]) => <button key={id} className={`nav-item ${!activeGame && (id==='account'?account:id.startsWith('category/')?route===id:!account&&group==='all'&&view===id) ? 'active' : ''}`} onClick={() => navigate(id)} title={t(title)}><span><Icon name={icon} /></span>{t(title)}{id === 'favorites' ? <span className="nav-count">{favorites.length}</span> : null}{id === 'all' && !activeGame && !account && group==='all' && view === 'all' ? <span className="nav-dot" /> : null}</button>)}<div className="nav-rule" /><button className="nav-item" onClick={() => setModal({kind:'guide'})} title={t("How to play")}><span><Icon name="book" /></span>{t("How to play")}<span className="tiny-arrow">↗</span></button><button className="nav-item appearance-nav" onClick={() => setModal({kind:'settings'})} title={t("Appearance settings")}><span><Icon name="settings" /></span>{t("Appearance settings")}</button></nav>
      <div className="sidebar-gift premium-gift"><span className="gift-art"><Icon name="gift" /></span><span className="gift-kicker">{t("A DAILY DOSE OF LUCKY")}</span><h3>{t("Something just for you.")}</h3><p>{t("1,500 coins. Every single day.")}<br />{t("A little extra room to explore.")}</p><button onClick={claimBonus} disabled={!bonusReady || busy}>{bonusReady ? t("Claim your daily gift") : player ? t("A little more luck tomorrow") : t("Connecting your wallet")}<span>↗</span></button><small>{bonusReady ? t("Yours for the taking. No strings attached.") : player ? t('Next gift in {0}h', hours) : t("A moment of anticipation…")}</small></div>
      <div className="sidebar-bottom"><span className="playful-icon">♧</span><div>{t("All the fun. Zero real money.")}<small>{t("Made for a little playful escape.")}</small></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs">{t("Casino")}<span>/</span><strong>{account?t("My account"):activeGame?.name || (group!=='all'?t(GAME_GROUPS.find(g=>g.id===group)?.name):view === 'all' ? t("Lobby") : view === 'favorites' ? t("Favorites") : t("Recently played"))}</strong></div><div className="header-actions"><ThemeToggle /><AudioControls/><button className="icon-button settings-button" onClick={() => setModal({kind:'settings'})} aria-label={t("Open settings")}><Icon name="settings" /></button><div className="wallet"><span className="coin-icon">✦</span><span>{player ? formatCoins(player.balance, language) : '—'}</span><span className="wallet-label">{t("coins")}</span><button onClick={claimBonus} aria-label={t("Claim free daily coins")}>+</button></div><span className="header-divider" /><button className="icon-button notification" onClick={() => setModal({kind:'notifications'})} aria-label={t("Notifications")}><Icon name="bell" />{bonusReady ? <i /> : null}</button><button className={'profile avatar-'+(player?.preferences?.avatar||'violet')} onClick={() => navigate('account')} aria-label={t("Your player account")}><AvatarImage preferences={player?.preferences} source={avatarSource(player, avatarRevision)} /><span /></button></div></header>
      {connection === 'offline' ? <div className="connection-banner" role="alert"><span>{t("Your wallet is offline. Start the FastAPI server to reconnect.")}</span><button onClick={connect}>{t("Reconnect ↗")}</button></div> : null}
      <Suspense fallback={<main className="page-loading" role="status">{t("Setting the scene…")}</main>}>{account?<AccountPage navigate={navigate}/>:activeGame?.type==='table'?<RouletteGame navigate={navigate}/>:activeGame ? <GameScreen key={activeGame.id} game={activeGame} navigate={navigate} /> : <Lobby view={view} group={group} navigate={navigate} />}</Suspense>
      <footer className="app-footer"><span>© 2026 NEIROSLOP BURMALDA <i>·</i>{" " + t("A little escape from the everyday.")}</span><div><button onClick={() => setModal({kind:'architecture'})}>{t("Under the hood ↗")}</button><span className="footer-note">{t("Virtual coins only. No cash value.")}</span></div></footer>
    </div>
    {modal ? <Modal title={t(modalTitles[modal.kind])} wide={modal.kind==='settings'} onClose={() => setModal(null)}><InfoContent modal={modal} /></Modal> : null}
  </div>;
}

function SessionGate() {
  const { t } = useLanguage();
  const { player, connection } = useLounge();
  const view = sessionView(player, connection);
  const [onboarding, setOnboarding] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [startupFinished, setStartupFinished] = useState(false);
  const showLounge = startupFinished && view === 'lounge' && !onboarding;
  const showAccess = startupFinished && !showLounge;

  useLayoutEffect(() => {
    const screen = document.getElementById('startup-screen');
    for (const element of screen.querySelectorAll('[data-message]')) {
      element.textContent = t(element.dataset.message);
    }
    screen.setAttribute('aria-label', t('Welcome to NEIROSLOP BURMALDA'));
  }, [t]);

  useEffect(() => {
    const screen = document.getElementById('startup-screen');
    const skip = document.getElementById('startup-skip');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = true;
    let minimumElapsed = false;
    let artworkReady = false;
    const finishIntro = () => {
      if (!active) return;
      active = false;
      window.clearTimeout(minimum);
      window.clearTimeout(maximum);
      setIntroReady(true);
    };
    const minimum = window.setTimeout(() => {
      minimumElapsed = true;
      if (artworkReady) finishIntro();
    }, reducedMotion ? 250 : 2600);
    const maximum = window.setTimeout(finishIntro, 7000);

    skip.addEventListener('click', finishIntro);
    Promise.allSettled([...screen.querySelectorAll('img')].map(image => image.decode())).then(() => {
      artworkReady = true;
      if (minimumElapsed) finishIntro();
    });
    return () => {
      active = false;
      window.clearTimeout(minimum);
      window.clearTimeout(maximum);
      skip.removeEventListener('click', finishIntro);
    };
  }, []);

  useLayoutEffect(() => {
    if (introReady && view !== 'loading') setStartupFinished(true);
  }, [introReady, view]);

  useLayoutEffect(() => {
    const classes = document.documentElement.classList;
    classes.toggle('is-starting', !startupFinished);
    classes.toggle('startup-access', showAccess);
    classes.toggle('startup-leaving', showLounge);
    if (showLounge && document.getElementById('startup-screen').contains(document.activeElement)) {
      const main = document.querySelector('#root main');
      main?.setAttribute('tabindex', '-1');
      main?.focus({ preventScroll: true });
    }
  }, [startupFinished, showAccess, showLounge]);

  if (showLounge) return <Shell />;
  if (!showAccess) return null;
  return createPortal(
    <AccountAccess loading={view === 'loading'} onboarding={onboarding}
      onRegistered={() => setOnboarding(true)} onContinue={() => setOnboarding(false)} />,
    document.getElementById('startup-account'),
  );
}

export default function App() { return <LoungeProvider><SessionGate /></LoungeProvider>; }
