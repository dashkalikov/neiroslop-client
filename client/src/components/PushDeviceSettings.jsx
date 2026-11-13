import { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext.jsx';
import { useLounge } from '../LoungeContext.jsx';
import { api } from '../lib/api.js';
import { preparePushWorker, subscribeToPush, supportsPush } from '../lib/push.js';

export default function PushDeviceSettings({ playerId, PasswordField, CodeField }) {
  const { t, language } = useLanguage();
  const { busy, setBusy } = useLounge();
  const [config, setConfig] = useState(null);
  const [worker, setWorker] = useState(null);
  const [mode, setMode] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const supported = supportsPush();

  useEffect(() => {
    let active = true;
    api('auth/push/config', {}, playerId).then(result => {
      if (active) setConfig(result);
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [playerId]);

  async function choose(next) {
    setMode(next);
    setError('');
    if (next !== 'link' || worker) return;
    try {
      setWorker(await preparePushWorker());
    } catch {
      setError('This browser could not start push notifications.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (pending || busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setPending(true);
    setBusy(true);
    setError('');
    try {
      const subscription = mode === 'link' ? await subscribeToPush(worker, config.publicKey) : undefined;
      const result = await api(mode === 'link' ? 'auth/push/device' : 'auth/push/revoke',
        subscription ? { ...values, subscription, language } : values, playerId);
      setConfig(current => ({ ...current, linked: result.linked }));
      setMode(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      form.reset();
      setPending(false);
      setBusy(false);
    }
  }

  return <section className="push-device-settings">
    <h3>{t('Sign-in notifications')}</h3>
    {config && <>
      <p>{t(config.linked ? 'A phone is linked for sign-in requests.' : 'Open this page on your phone and link it to receive sign-in requests.')}</p>
      {!config.publicKey && <p>{t('Push notifications are not configured on this server.')}</p>}
      {config.publicKey && !supported && <p>{t('Open the HTTPS site in a browser with push support. On iPhone, add the site to your Home Screen first.')}</p>}
      {mode ? <form className="security-form" onSubmit={submit}>
        <p>{t('Confirm with your password and a fresh authenticator or recovery code.')}</p>
        <fieldset disabled={pending || busy}>
          <PasswordField label="Current password" />
          <CodeField />
        </fieldset>
        <div className="security-actions">
          <button type="submit" className="primary-button" disabled={pending || busy || (mode === 'link' && !worker)}>
            {t(mode === 'link' ? 'Allow notifications and link' : 'Unlink phone')}
          </button>
          <button type="button" className="secondary-button" disabled={pending || busy} onClick={() => { setMode(null); setError(''); }}>{t('Cancel')}</button>
        </div>
      </form> : <div className="security-actions">
        {config.publicKey && supported && <button type="button" className="secondary-button" disabled={busy} onClick={() => choose('link')}>
          {t(config.linked ? 'Replace linked phone' : 'Link this phone')}
        </button>}
        {config.linked && <button type="button" className="secondary-button" disabled={busy} onClick={() => choose('revoke')}>{t('Unlink phone')}</button>}
      </div>}
    </>}
    {error && <p className="security-error" role="alert">{t(error)}</p>}
  </section>;
}
