import { useLanguage } from '../LanguageContext.jsx';
import { useEffect, useState } from 'react';
import { useLounge } from '../LoungeContext.jsx';
import { formatCoins, gameById, games } from '../data/games.js';
import Symbol from './Symbol.jsx';
import AppearanceSettings from './AppearanceSettings.jsx';
import BigBassRules from './BigBassRules.jsx';
import RouletteRules from './RouletteRules.jsx';

export function History() {
  const { t, language } = useLanguage();
  const { history, loadHistory } = useLounge();
  const [error, setError] = useState('');
  useEffect(() => { loadHistory().catch(e => setError(e.message)); }, [loadHistory]);
  return <>
    <p>{t("Your latest 30 rounds, saved to your wallet.")}</p>
    {error && <p role="alert">{t(error)}</p>}
    {history.length ? <ul className="history-list">{history.map(round => {
      const lostStake = !round.payout && round.bet > 0;
      const date = new Date(round.created_at).toLocaleString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return <li key={round.id}>
        <div>{gameById[round.game]?.name}<small>{date} · {round.bet ? formatCoins(round.bet, language) + " " + t("coin bet") : t("Free spin")}{round.game === 'roulette' ? ' · ' + round.number + ' ' + t(round.color) : ''}</small></div>
        <b className={lostStake ? 'history-loss' : undefined}>
          {round.payout ? '+' + formatCoins(round.payout, language) : lostStake ? t("No win · −") + formatCoins(round.bet, language) : t("No win")}
        </b>
      </li>;
    })}</ul> : <p>{t("Your story starts with your first spin.")}</p>}
  </>;
}

export const modalTitles = {rouletteRules:'A little guide to roulette.',settings:'Your lounge, your way.',guide:'A little guide to getting lucky.',paytable:'The art of a winning combination.',history:'Your little lucky moments.',profile:'Welcome, lucky one.',notifications:'A little something for you.',architecture:'A look behind the magic.'};

export default function InfoContent({ modal }) {
  const { t, language } = useLanguage();
  const { player, bonusReady, catalog } = useLounge();
  if(modal.kind==='settings')return <AppearanceSettings/>;
  if(modal.kind==='rouletteRules')return <RouletteRules/>;
  if (modal.kind === 'history') return <History />;
  if (modal.kind === 'guide') return <><p>{games.length}{" " + t("games and 10,000 welcome coins. Riviera Roulette adds a single-zero wheel and a chip betting table; open its Rules & payouts for details. Type any whole-coin wager from 1 to 10,000, then press Spin. In Velvet Sevens and Saloon Luck, you can also drag the handle down, tap it, or activate it with your keyboard.")}</p><ol><li>{t("Match symbols consecutively from the left. The fishing float in Big Bass Bonanza also pays for two.")}</li><li>{t("Big Bass Bonanza, Cosmic Rush, Candy Riot and Dragon Grove have 10 paylines. The other slots have 5.")}</li><li>{t("Wilds substitute for any regular symbol.")}</li><li>{t("Find BONUS symbols anywhere for free spins. Big Bass Bonanza awards 10 / 15 / 20 spins for 3 / 4 / 5 scatters.")}</li></ol><h3>{t("Your bonus adventure")}</h3><p>{t("Moonlight Magic awards 8 free spins. Temple of Gold awards 10. Neon Nights awards 6 with double line wins. Saloon Luck awards 8 Crystal Rush free spins with double line wins. Velvet Sevens awards 7, and Ocean Myth awards 7 with triple line wins. Goldrush Canyon awards 10 free spins and features cascading symbols. Big Bass Bonanza’s fishermen collect fish values during free spins; four fishermen queue another 10 spins with increasing collection multipliers. Cosmic Rush awards 8 spins with double wins, Candy Riot awards 12 spins, and Dragon Grove awards 6 spins with triple wins. Your triggering wager stays locked during bonus spins. Visit Rewards in My account to claim achievements or check your daily gift.")}</p><h3>{t("Keep the reels moving")}</h3><p>{t("Enable Auto-spin to continue after each result. Press Stop auto-spin at any time; an active round finishes, then play stops. Auto-spin also stops when the next wager is unaffordable or a request fails. It pauses while a paytable or history dialog is open. Big-win and bonus celebrations advance automatically during auto-spin.")}</p><p>{t("Use the header switch to choose a black or white theme, or open Appearance settings to choose a background for the entire app. Enable the speaker for the shared relaxing soundtrack, cell-landing accents and falling coins. Adjust the header volume slider, or use Music & sound in Settings on a phone. Coins are virtual and have no cash value.")}</p></>;
  if (modal.kind === 'paytable') {
    const { game, bet } = modal;
    if(game.id==='bigbass')return <BigBassRules game={game}/>;
    const paytable = catalog.find(item => item.id === game.id)?.paytable;
    const matchCounts = game.reels === 3 ? [3] : [3, 4, 5];
    const symbolTypes = ['gem', 'star', 'orb', 'crown', 'leaf', 'wild'];
    const requiresCatalog = game.rows === 6;
    return <>
      <p>{t(game.description)}</p>
      {requiresCatalog && !paytable ? <p>{t("Connect your wallet to load the paytable.")}</p> : <>
        <p>{t("Multipliers apply to your bet of") + " "}<b>{formatCoins(bet, language)}{" " + t("coins")}</b>{t(". Each line pays its highest eligible win.")}</p>
        <table className="paytable">
          <thead><tr><th>{t("Symbol")}</th>{matchCounts.map(count => <th key={count}>{count}{" " + t("match")}</th>)}</tr></thead>
          <tbody>{symbolTypes.map((type, index) => {
            const awards = paytable?.[type] ?? (type === 'wild' ? [10, 25, 100] : [2, 5, 20]);
            return <tr key={type}>
              <td><Symbol type={type} game={game}/>{t(game.symbolNames[index])}</td>
              {matchCounts.map(count => <td key={count}>{awards[count - 3]}×</td>)}
            </tr>;
          })}</tbody>
        </table>
      </>}
      {game.cascading && <p>{t("Winning symbols clear and new symbols drop in. Up to 8 winning cascades pay on one wager. Three BONUS symbols in a single frame award free spins once per round.")}</p>}
      <p>{t("Three BONUS symbols anywhere award") + " "}{game.bonus}{" " + t("free spins")}{(game.multiplier ?? (game.id === 'neon' ? 2 : 1)) > 1 ? ' ' + t('with {0}× line wins', game.multiplier ?? 2) : ''}{t(". BONUS symbols do not substitute for other symbols.")}</p>
    </>;
  }
  if (modal.kind === 'profile') return <><p>You’re exploring as a guest. Your private session cookie connects this browser to your virtual wallet.</p><div className="profile-balance">{player ? formatCoins(player.balance, language) : '—'} <small>{t("virtual coins")}</small></div><p>Keep your browser cookies to return to your balance, remaining free spins, and history. Favorites are saved on this device.</p></>;
  if (modal.kind === 'notifications') return <><h3>{t("A daily dose of lucky")}</h3><p>{bonusReady?t("Your 1,500 free coins are ready. Claim the daily gift in the sidebar or tap + next to your balance."):t("Your next 1,500-coin gift is on its way.")}</p><h3>{t("New at the lounge")}</h3><p>{t("Try Big Bass Bonanza’s fishing feature, pull the full-stroke lever in Velvet Sevens, and personalize your background in Appearance settings. Slots support auto-spin and custom wagers. Riviera Roulette has its own chip betting table. Manage your profile and preferences in My account.")}</p></>;
  return <><p>{t("The application has three independent layers. React presents the games, FastAPI decides the results, and PostgreSQL remembers the wallet and rounds.")}</p><div className="architecture"><div>React<small>{t("Components · animation")}</small></div><span>⇄</span><div>FastAPI<small>{t("Validation · game rules")}</small></div><span>⇄</span><div>PostgreSQL<small>{t("Wallet · history")}</small></div></div><h3>{t("The path of a spin")}</h3><p>{t("The client sends a game, bet, and unique request ID to POST /api/spin. The Python server locks the player’s wallet, calculates a result, and saves the round and coin transactions atomically. The client then reveals the returned symbols.")}</p><p>{t("Repeated request IDs return the saved result without a second deduction. Remaining free spins and their triggering bets are stored in the database. The API contract is available at /docs on the FastAPI server.")}</p></>;
}
