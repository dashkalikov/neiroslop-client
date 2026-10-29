import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from './lib/api.js';
import {readBackground,writeBackground} from './lib/appearance.js';
import {attachMusic,configureAudio} from './lib/audio.js';
import {readVolume,writeVolume,normalizeVolume} from './lib/audio-preferences.js';

const LoungeContext = createContext(null);
export const useLounge = () => useContext(LoungeContext);

export function LoungeProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toasts, setToasts] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lounge-favorites') || '[]'); } catch { return []; }
  });
  const [sound,setSoundState]=useState(false);
  const [volume,setVolumeState]=useState(()=>readVolume());
  const setSound=useCallback(enabled=>{setSoundState(Boolean(enabled));configureAudio({enabled:Boolean(enabled)});},[]);
  const setVolume=useCallback(value=>{
    const next=normalizeVolume(value);setVolumeState(next);writeVolume(next);configureAudio({volume:next});
  },[]);
  useEffect(()=>{configureAudio({enabled:sound,volume});},[sound,volume]);
  const [turbo, setTurbo] = useState(false);
  const [background,setBackground]=useState(()=>readBackground());
  useEffect(()=>{writeBackground(background);},[background]);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lounge-theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#0b0b0e');
    try { localStorage.setItem('lounge-theme', theme); } catch { /* Theme switching also works without storage. */ }
  }, [theme]);
  const toastTimers = useRef([]);
  const notify = useCallback((message, error = false) => {
    const id = crypto.randomUUID();
    setToasts(items => [...items, { id, message, error }]);
    toastTimers.current.push(setTimeout(() => setToasts(items => items.filter(item => item.id !== id)), 4500));
  }, []);
  const reload = useCallback(async () => {
    const profile = await api('session');
    setPlayer(profile); setConnection('connected'); return profile;
  }, []);
  const loadHistory = useCallback(async () => {
    const records = await api('history'); setHistory(records); return records;
  }, []);
  const connect = useCallback(async () => {
    setConnection('connecting');
    try {
      const [profile, games] = await Promise.all([api('session'), api('games')]);
      setPlayer(profile); setCatalog(games); setConnection('connected');
      await loadHistory();
    } catch { setConnection('offline'); }
  }, [loadHistory]);
  useEffect(() => { void connect(); const tick = setInterval(() => setNow(Date.now()), 30000); return () => { clearInterval(tick); toastTimers.current.forEach(clearTimeout); }; }, [connect]);
  function toggleFavorite(id) {
    setFavorites(items => {
      const next = items.includes(id) ? items.filter(item => item !== id) : [...items, id];
      try { localStorage.setItem('lounge-favorites', JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
  }
  const bonusReady = Boolean(player && now >= player.bonusReadyAt);
  async function claimBonus() {
    if (busy) return notify('Let the reels settle before claiming your gift.');
    if (!bonusReady) return notify(player ? 'Your next daily gift is on its way. Come back tomorrow.' : 'Connect your wallet to claim free coins.');
    try { const profile = await api('bonus', {}); setPlayer(profile); setNow(Date.now()); notify('✦ 1,500 free coins, just for you. Your wallet has been updated.'); }
    catch (error) { notify(error.message, true); }
  }
  const value = { player, setPlayer, catalog, history, setHistory, loadHistory, connection, connect,
    modal, setModal, busy, setBusy, favorites, toggleFavorite, notify, now, bonusReady, claimBonus,
    sound, setSound, volume,setVolume,turbo, setTurbo, theme, setTheme, background,setBackground,reload };
  return <LoungeContext.Provider value={value}><audio ref={attachMusic} data-lounge-music src="/assets/audio/lounge-soundtrack.wav" loop preload="auto" aria-hidden="true" style={{display:'none'}} />{children}<div className="toasts" aria-live="polite">{toasts.map(item => <div key={item.id} className={`toast ${item.error ? 'error' : ''}`}>{item.message}</div>)}</div></LoungeContext.Provider>;
}
