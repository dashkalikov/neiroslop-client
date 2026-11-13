import { useState } from 'react';
import { useLanguage } from '../LanguageContext.jsx';
import { formatCoins } from '../data/games.js';
import Icon from './Icon.jsx';

const stickerDirectory = '/assets/achievements/';

function AchievementSticker({ item, status, busy, onReveal }) {
  const { t, language } = useLanguage();
  const [revealing, setRevealing] = useState(false);
  const [pending, setPending] = useState(false);
  const title = t(item.title);
  const image = stickerDirectory + item.id + '.webp';
  const collected = status === 'claimed';
  const ready = status === 'ready';

  async function reveal() {
    if (!ready || busy || pending) return;
    setPending(true);
    try {
      if (await onReveal(item)) setRevealing(true);
    } finally {
      setPending(false);
    }
  }

  return <li className="achievement-sticker" data-achievement={item.id} data-status={status} data-revealing={revealing}>
    <button type="button" className="sticker-reveal" onClick={reveal}
      aria-label={ready ? t('Reveal sticker: {0}', title) : undefined}
      aria-disabled={!ready || busy || pending} tabIndex={ready ? 0 : -1}>
      <span className="sticker-stage" style={{ '--sticker-image': 'url("' + image + '")' }} aria-hidden="true">
        {collected && <img className="sticker-illustration" src={image} alt="" width="256" height="256" decoding="async" />}
        {!collected && <span className="sticker-paper" />}
        {revealing && <span className="sticker-peeling-film" onAnimationEnd={() => setRevealing(false)}>
          <span className="sticker-paper" />
        </span>}
      </span>
      <span className="sticker-state">
        {collected ? <span aria-hidden="true">✓</span> : <Icon name={ready ? 'sparkles' : 'clock'} />}
        {collected ? t('Collected') : pending ? t('Revealing…') : ready ? t('Reveal sticker') : t('In progress')}
      </span>
    </button>
    <div className="sticker-details">
      <h4>{title}</h4>
      <p>{t(item.description)}</p>
      <div className="sticker-footer">
        <div className="achievement-progress">
          <progress aria-label={t('{0} progress', title)} max={item.target} value={item.progress} />
          <span>{formatCoins(item.progress, language)} / {formatCoins(item.target, language)}</span>
        </div>
        <strong title={t('+{0} coins', formatCoins(item.coins, language))}>✦ {formatCoins(item.coins, language)}</strong>
      </div>
    </div>
  </li>;
}

export default function AchievementCollection({ items, busy, onClaim }) {
  const { t, language } = useLanguage();
  const [opened, setOpened] = useState(() => new Set());
  const statusFor = item => opened.has(item.id) ? 'claimed' : item.status;
  const collected = items.filter(item => statusFor(item) === 'claimed').length;

  async function open(item) {
    if (!await onClaim(item)) return false;
    setOpened(current => new Set(current).add(item.id));
    return true;
  }

  return <section className="achievement-collection" aria-labelledby="sticker-collection-title">
    <header className="sticker-collection-header">
      <div>
        <h3 id="sticker-collection-title">{t('Sticker collection')}</h3>
        <p>{t('Complete achievements and peel back the paper to collect stickers.')}</p>
      </div>
      <span aria-live="polite">{t('{0} / {1} collected', formatCoins(collected, language), formatCoins(items.length, language))}</span>
    </header>
    <ul className="achievement-list">
      {items.map(item => <AchievementSticker key={item.id} item={item} status={statusFor(item)} busy={busy} onReveal={open} />)}
    </ul>
  </section>;
}
