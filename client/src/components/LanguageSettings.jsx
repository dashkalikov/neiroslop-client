import { useLanguage } from '../LanguageContext.jsx';

export default function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();
  return <div className="settings-section-heading language-settings">
    <div><h3>{t('Interface language')}</h3></div>
    <div className="appearance-mode" role="group" aria-label={t('Interface language')}>
      <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
      <button type="button" lang="ru" aria-pressed={language === 'ru'} onClick={() => setLanguage('ru')}>Русский</button>
    </div>
  </div>;
}
