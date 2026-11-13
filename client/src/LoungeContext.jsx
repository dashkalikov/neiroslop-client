import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext.jsx';
import { api } from './lib/api.js';
import {readBackground,writeBackground,readAppearance,writeAppearance,themes} from './lib/appearance.js';
import {attachMusic,configureAudio} from './lib/audio.js';
import {readAudioPreferences,writeAudioPreferences} from './lib/audio-preferences.js';

const LoungeContext = createContext(null);
export const useLounge = () => useContext(LoungeContext);

export function LoungeProvider({ children }) {
  const { t } = useLanguage();
  const [player, setPlayer] = useState(null);
  const [avatarRevision, setAvatarRevision] = useState(0);
  const refreshAvatar = () => setAvatarRevision(version => version + 1);
  const [catalog, setCatalog] = useState([]);
  const signedIn = Boolean(player?.account);
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
  const [audioPreferences, setAudioPreferences] = useState(() => readAudioPreferences());
  const setSound = useCallback(enabled => {
    const next = Boolean(enabled);
    setSoundState(next);
    configureAudio({ ...audioPreferences, enabled: next });
  }, [audioPreferences]);
  const setAudioPreference = useCallback((name, value) => {
    const next = writeAudioPreferences({ ...audioPreferences, [name]: value });
    setAudioPreferences(next);
    configureAudio(next);
  }, [audioPreferences]);
  useEffect(() => () => configureAudio({ enabled: false }), []);
  const [turbo, setTurbo] = useState(false);
  const [background,setBackground]=useState(()=>readBackground());
  useEffect(()=>{writeBackground(background);},[background]);
  const [appearance, setAppearance] = useState(readAppearance);
  const { theme, style: visualStyle } = appearance;
  const setTheme = theme => setAppearance(current => ({ ...current, theme }));
  const setVisualStyle = style => setAppearance(current => ({ ...current, style }));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.style = visualStyle;
    const themeColor = visualStyle === 'glass'
      ? (theme === 'light' ? '#edf3fe' : '#17213a')
      : themes.find(option => option.id === theme).color;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    writeAppearance(appearance);
  }, [appearance, theme, visualStyle]);
  const toastTimers = useRef([]);
  const notify = useCallback((message, error = false) => {
    const id = crypto.randomUUID();
    setToasts(items => [...items, { id, message, error }]);
    toastTimers.current.push(setTimeout(() => setToasts(items => items.filter(item => item.id !== id)), 4500));
  }, []);
  const currentIdentity = useRef(null);
  const loadHistory = useCallback(async () => {
    const expected = currentIdentity.current;
    if (!expected) return [];
    const records = await api('history', undefined, expected);
    if (currentIdentity.current === expected) setHistory(records);
    return records;
  }, []);
  const updateIdentity = useCallback(profile => {
    if (currentIdentity.current !== profile.id) {
      currentIdentity.current = profile.id;
      setHistory([]);
      setModal(null);
      setToasts([]);
    }
    setPlayer(profile);
    setConnection('connected');
  }, []);
  const applyIdentity = useCallback(profile => {
    updateIdentity(profile);
    if (profile.account) void loadHistory().catch(() => { /* Activity can refresh on the next connection. */ });
  }, [loadHistory, updateIdentity]);
  const reload = useCallback(async () => {
    const expected = currentIdentity.current;
    const profile = await api('session');
    if (currentIdentity.current === expected) applyIdentity(profile);
    return profile;
  }, [applyIdentity]);
  const connect = useCallback(async () => {
    setConnection('connecting');
    try {
      const profile = await api('session');
      applyIdentity(profile);
    } catch { setConnection('offline'); }
  }, [applyIdentity]);
  const checkingSession = connection === 'connecting';
  useEffect(() => {
    if (!signedIn || checkingSession) return;
    let active = true;
    api('games').then(
      games => { if (active) setCatalog(games); },
      () => { if (active) setConnection('offline'); },
    );
    return () => { active = false; };
  }, [signedIn, checkingSession]);
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
    if (busy) return notify('Let the current round finish before claiming your gift.');
    if (!bonusReady) return notify(player ? 'Your next daily gift is on its way. Come back tomorrow.' : 'Connect your wallet to claim free coins.');
    setBusy(true);
    try { const profile = await api('bonus', {}, player.id); setPlayer(current => current?.id === profile.id ? profile : current); setNow(Date.now()); notify('✦ 1,500 free coins, just for you. Your wallet has been updated.'); }
    catch (error) { notify(error.message, true); }
    finally { setBusy(false); }
  }
  const value = { player, setPlayer, avatarRevision, refreshAvatar, applyIdentity, catalog, history, setHistory, loadHistory, connection, connect,
    modal, setModal, busy, setBusy, favorites, toggleFavorite, notify, now, bonusReady, claimBonus,
    sound, setSound, audioPreferences, setAudioPreference, turbo, setTurbo, theme, setTheme, visualStyle, setVisualStyle, background,setBackground,reload };
  return <LoungeContext.Provider value={value}><audio ref={attachMusic} data-lounge-music loop preload="none" aria-hidden="true" hidden />{children}<div className="toasts" aria-live="polite">{toasts.map(item => <div key={item.id} className={`toast ${item.error ? 'error' : ''}`}>{Array.isArray(item.message) ? t(...item.message) : t(item.message)}</div>)}</div></LoungeContext.Provider>;
}
