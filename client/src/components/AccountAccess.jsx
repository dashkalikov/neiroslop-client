import { useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext.jsx';
import { useLounge } from '../LoungeContext.jsx';
import AccountSecurity from './AccountSecurity.jsx';
import LanguageSettings from './LanguageSettings.jsx';

export default function AccountAccess({ loading, onboarding, onRegistered, onContinue }) {
  const { t } = useLanguage();
  const { connection, connect } = useLounge();
  const main = useRef(null);
  useEffect(() => {
    document.title = t('Account access') + ' — NEIROSLOP BURMALDA';
  }, [t]);
  useEffect(() => {
    if (!loading) main.current?.focus({ preventScroll: true });
  }, [loading, onboarding]);

  return <main ref={main} tabIndex={-1} className="account-access" aria-label={t('Account access')}>
    <div className="account-access-panel">
      <LanguageSettings />
      {loading ? <p role="status">{t('Checking your session…')}</p> : <>
        {connection === 'offline' && <div className="access-offline">
          <p role="alert">{t('The lounge is offline. Reconnect to continue.')}</p>
          <button type="button" className="secondary-button" onClick={connect}>{t('Reconnect')}</button>
        </div>}
        <AccountSecurity onboarding={onboarding} onRegistered={onRegistered} onContinue={onContinue} />
      </>}
    </div>
  </main>;
}
