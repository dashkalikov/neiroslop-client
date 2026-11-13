import { useLayoutEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext.jsx';
import { api } from '../lib/api.js';

export default function PushDecision({ token, initialDecision }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useLayoutEffect(() => {
    history.replaceState(null, '', location.pathname + location.search);
    document.documentElement.classList.remove('is-starting', 'startup-leaving');
    document.documentElement.classList.add('startup-access');
    return () => document.documentElement.classList.remove('startup-access');
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const decision = event.nativeEvent.submitter?.value ?? 'approve';
    const number = String(data.get('number')).trim();
    if (decision === 'approve' && !/^\d{4}$/.test(number)) {
      setError('Enter the four-digit number shown on the sign-in screen.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await api('auth/push/decision', decision === 'approve' ? { token, decision, number } : { token, decision });
      setResult(response.status);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return <main className="account-access" aria-labelledby="push-title">
    <section className="account-access-panel account-security">
      <h1 id="push-title" className="account-access-title">{t('Confirm your sign-in')}</h1>
      {result ? <p role="status">{t(result === 'approved' ? 'Sign-in approved. Return to your browser.' : 'Sign-in declined.')}</p> :
        <form className="security-form" onSubmit={submit}>
          <p>{t('Enter the four-digit number shown on the sign-in screen.')}</p>
          <fieldset disabled={pending}>
            <label>{t('Sign-in number')}
              <input name="number" inputMode="numeric" maxLength={4} autoComplete="off" autoFocus={initialDecision === 'approve'} />
            </label>
            <div className="security-actions">
              <button type="submit" value="approve" className="primary-button">{t('Approve sign-in')}</button>
              <button type="submit" value="deny" className="secondary-button" autoFocus={initialDecision === 'deny'}>{t('Decline sign-in')}</button>
            </div>
          </fieldset>
          {error && <p className="security-error" role="alert">{t(error)}</p>}
        </form>}
      <p><a href="/">{t('Back to the lounge')}</a></p>
    </section>
  </main>;
}
