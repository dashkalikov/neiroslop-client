import { useLanguage } from '../LanguageContext.jsx';
import { useLounge } from '../LoungeContext.jsx';
import { themes } from '../lib/appearance.js';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const { t } = useLanguage();
  const { theme, setTheme } = useLounge();
  const next = themes.find(option => option.id !== theme);
  return <button className="theme-toggle" onClick={() => setTheme(next.id)}
    aria-label={t('Switch to {0} theme', t(next.label))} title={t('Switch to {0} theme', t(next.label))}>
    <Icon name={next.icon} /><span>{t('{0} mode', t(next.label))}</span>
  </button>;
}
