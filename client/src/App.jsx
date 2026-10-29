import { useEffect, useState } from 'react';
import { LoungeProvider, useLounge } from './LoungeContext.jsx';
import { gameById, formatCoins } from './data/games.js';
import Icon from './components/Icon.jsx';
import Lobby from './components/Lobby.jsx';
import GameScreen from './components/GameScreen.jsx';
import Modal from './components/Modal.jsx';
import InfoContent, { modalTitles } from './components/InfoContent.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import {backgroundById} from './data/backgrounds.js';
import AudioControls from './components/AudioControls.jsx';
import Brand from './components/Brand.jsx';

function Shell() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'all');
  const lounge = useLounge();
  const { player, favorites, connection, connect, bonusReady, claimBonus, now, modal, setModal, busy, notify,background } = lounge;
  const activeGame = route.startsWith('game/') ? gameById[route.split('/')[1]] : null;
  const view = ['favorites','recent'].includes(route) ? route : 'all';
  useEffect(() => {
    const handleRoute = () => { setRoute(location.hash.slice(1) || 'all'); window.scrollTo(0,0); };
    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, []);
  useEffect(() => { document.title = activeGame ? `${activeGame.name} — NEIROSLOP BURMALDA` : 'NEIROSLOP BURMALDA — Virtual Casino'; }, [activeGame]);
  function navigate(next) {
    if (busy) return notify('One little moment—the reels are still spinning.');
    location.hash = next;
  }
  const hours = player ? Math.max(1, Math.ceil((player.bonusReadyAt-now)/3600000)) : 0;
  return <div className={`app-shell ${background!=='none'?'has-wallpaper':''}`}>
    {background!=='none'?<div className="app-wallpaper" style={{backgroundImage:`url("${backgroundById[background].image}")`}} aria-hidden="true"/>:null}
    <aside className="sidebar"><a className="brand" href="#all" onClick={e => {e.preventDefault();navigate('all');}} aria-label="NEIROSLOP BURMALDA home"><Brand/></a><div className="space-label">YOUR LITTLE ESCAPE</div>
      <nav aria-label="Main navigation">{[['all','lobby','Casino lobby'],['favorites','heart','My favorites'],['recent','clock','Recently played']].map(([id,icon,title]) => <button key={id} className={`nav-item ${!activeGame && view === id ? 'active' : ''}`} onClick={() => navigate(id)} title={title}><span><Icon name={icon} /></span>{title}{id === 'favorites' ? <span className="nav-count">{favorites.length}</span> : null}{id === 'all' && !activeGame && view === 'all' ? <span className="nav-dot" /> : null}</button>)}<div className="nav-rule" /><button className="nav-item" onClick={() => setModal({kind:'guide'})} title="How to play"><span><Icon name="book" /></span>How to play<span className="tiny-arrow">↗</span></button><button className="nav-item appearance-nav" onClick={() => setModal({kind:'settings'})} title="Appearance settings"><span><Icon name="settings" /></span>Appearance settings</button></nav>
      <div className="sidebar-gift premium-gift"><span className="gift-art"><Icon name="gift" /></span><span className="gift-kicker">A DAILY DOSE OF LUCKY</span><h3>Something just for you.</h3><p>1,500 coins. Every single day.<br />A little extra room to explore.</p><button onClick={claimBonus} disabled={!bonusReady || busy}>{bonusReady ? 'Claim your daily gift' : player ? 'A little more luck tomorrow' : 'Connecting your wallet'}<span>↗</span></button><small>{bonusReady ? 'Yours for the taking. No strings attached.' : player ? `Next gift in ${hours}h` : 'A moment of anticipation…'}</small></div>
      <div className="sidebar-bottom"><span className="playful-icon">♧</span><div>All the fun. Zero real money.<small>Made for a little playful escape.</small></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs">Casino<span>/</span><strong>{activeGame?.name || (view === 'all' ? 'Lobby' : view === 'favorites' ? 'Favorites' : 'Recently played')}</strong></div><div className="header-actions"><ThemeToggle /><AudioControls/><button className="icon-button settings-button" onClick={() => setModal({kind:'settings'})} aria-label="Open settings"><Icon name="settings" /></button><div className="wallet"><span className="coin-icon">✦</span><span>{player ? formatCoins(player.balance) : '—'}</span><span className="wallet-label">coins</span><button onClick={claimBonus} aria-label="Claim free daily coins">+</button></div><span className="header-divider" /><button className="icon-button notification" onClick={() => setModal({kind:'notifications'})} aria-label="Notifications"><Icon name="bell" />{bonusReady ? <i /> : null}</button><button className="profile" onClick={() => setModal({kind:'profile'})} aria-label="Your player account">G<span /></button></div></header>
      {connection === 'offline' ? <div className="connection-banner" role="alert"><span>Your wallet is offline. Start the FastAPI server to reconnect.</span><button onClick={connect}>Reconnect ↗</button></div> : null}
      {activeGame ? <GameScreen key={activeGame.id} game={activeGame} navigate={navigate} /> : <Lobby view={view} navigate={navigate} />}
      <footer className="app-footer"><span>© 2026 NEIROSLOP BURMALDA <i>·</i> A little escape from the everyday.</span><div><button onClick={() => setModal({kind:'architecture'})}>Under the hood ↗</button><span className="footer-note">Virtual coins only. No cash value.</span></div></footer>
    </div>
    {modal ? <Modal title={modalTitles[modal.kind]} wide={modal.kind==='settings'} onClose={() => setModal(null)}><InfoContent modal={modal} /></Modal> : null}
  </div>;
}

export default function App() { return <LoungeProvider><Shell /></LoungeProvider>; }
