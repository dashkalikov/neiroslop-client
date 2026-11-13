import { useLanguage } from '../LanguageContext.jsx';
import { useEffect, useState } from 'react';
import { useLounge } from '../LoungeContext.jsx';
import { formatCoins } from '../data/games.js';
import { api } from '../lib/api.js';
import Icon from './Icon.jsx';
import AchievementCollection from './AchievementCollection.jsx';

function useWalletResource(path, playerId, revision) {
  const [response, setResponse] = useState(null);
  useEffect(() => {
    if (!playerId) return;
    let active = true;
    api(path, undefined, playerId).then(
      data => { if (active) setResponse({ playerId, revision, data }); },
      error => { if (active) setResponse({ playerId, revision, error: error.message }); },
    );
    return () => { active = false; };
  }, [path, playerId, revision]);
  return response && response.playerId === playerId && response.revision === revision ? response : null;
}

export default function WalletRewards() {
  const { t, language } = useLanguage();
  const { player, setPlayer, busy, setBusy, bonusReady, claimBonus, now, notify } = useLounge();
  const [revision, setRevision] = useState(0);
  const response = useWalletResource('rewards', player?.id, player?.bonusReadyAt + ':' + revision);
  const { data, error } = response ?? {};
  const refresh = () => setRevision(value => value + 1);

  async function claim(item) {
    if (!player || busy || item.status !== 'ready') return false;
    setBusy(true);
    try {
      const updated = await api(`rewards/${item.id}/claim`, {}, player.id);
      setPlayer(current => current?.id === updated.id ? updated : current);
      notify(['{0} coins added to your wallet.', formatCoins(item.coins, language)]);
      return true;
    } catch (error) {
      notify(error.message, true);
      if (error.status === 409) refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }

  const hours = player ? Math.max(1, Math.ceil((player.bonusReadyAt - now) / 3_600_000)) : 0;
  return <>
    <div className="account-section-title"><h2>{t("Rewards")}</h2></div>
    <div className="wallet-gift">
      <Icon name="gift"/>
      <div>
        <strong>{t("Daily gift")}</strong>
        <p>{!player ? t("Connect your wallet to claim your gift.") : bonusReady ? t("Your gift is available.") : t('Next gift in about {0} h.', hours)}</p>
      </div>
      <button className="secondary-button" onClick={claimBonus} disabled={!bonusReady || busy}>{t("Claim") + " "}{formatCoins(data?.daily.coins ?? 1500, language)}{" " + t("coins")}</button>
    </div>
    {!response && <p role="status">{player ? t("Loading achievements…") : t("Waiting for your wallet.")}</p>}
    {error && <p role="alert">{t(error)} <button className="secondary-button" onClick={refresh}>{t("Retry")}</button></p>}
    {data && <AchievementCollection key={player.id} items={data.achievements} busy={busy} onClaim={claim} />}
  </>;
}

const transactionNames = {
  welcome: 'Welcome coins',
  bet: 'Wager',
  win: 'Round payout',
  daily_bonus: 'Daily gift',
  achievement: 'Achievement reward',
};

export function WalletTransactions() {
  const { t, language } = useLanguage();
  const { player } = useLounge();
  const [revision, setRevision] = useState(0);
  const response = useWalletResource('wallet/transactions', player?.id, revision);
  const { data, error } = response ?? {};
  return <section className="wallet-transactions" aria-label={t("Wallet transactions")}>
    <h3>{t("Wallet transactions")}</h3>
    {!response && <p role="status">{player ? t("Loading transactions…") : t("Waiting for your wallet.")}</p>}
    {error && <p role="alert">{t(error)} <button className="secondary-button" onClick={() => setRevision(value => value + 1)}>{t("Retry")}</button></p>}
    {data && (data.length ? <ul className="history-list">
      {data.map(entry => <li key={entry.id}>
        <div>{t(transactionNames[entry.kind] ?? 'Wallet adjustment')}
          <small>{new Date(entry.createdAt).toLocaleString(language)}</small>
        </div>
        <div className="wallet-transaction-amount">
          <b className={entry.amount < 0 ? 'history-loss' : undefined}>{entry.amount > 0 ? '+' : ''}{formatCoins(entry.amount, language)}</b>
          <small>{t("Balance") + " "}{formatCoins(entry.balanceAfter, language)}</small>
        </div>
      </li>)}
    </ul> : <p>{t("No transactions yet.")}</p>)}
  </section>;
}
