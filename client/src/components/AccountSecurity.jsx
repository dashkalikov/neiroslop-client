import { useLanguage } from '../LanguageContext.jsx';
import { useEffect, useId, useRef, useState } from 'react';
import { useLounge } from '../LoungeContext.jsx';
import { api } from '../lib/api.js';
import Icon from './Icon.jsx';
import PushDeviceSettings from './PushDeviceSettings.jsx';
import { registrationPayload } from '../lib/registration.js';

function PasswordField({ creating = false, name = 'password', label = 'Password', optional = false, showHint = creating }) {
  const { t } = useLanguage();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const action = visible ? 'Hide {0}' : 'Show {0}';
  return <div className="security-password-field">
    <label htmlFor={id}>{t(label)}</label>
    <div className="security-password-control">
      <input id={id} name={name} type={visible ? 'text' : 'password'}
        autoComplete={creating ? 'new-password' : 'current-password'} autoCapitalize="off" spellCheck={false}
        aria-describedby={showHint ? id + '-hint' : undefined}
        minLength={creating ? 15 : undefined} maxLength={128} required={!optional} />
      <button type="button" aria-controls={id} aria-label={t(action, t(label))}
        onClick={() => setVisible(value => !value)}>
        <Icon name={visible ? 'eye-off' : 'eye'} />{t(visible ? 'Hide' : 'Show')}
      </button>
    </div>
    {showHint && <small id={id + '-hint'}>{t('Use a passphrase with at least 15 characters.')}</small>}
  </div>;
}

function CodeField({ authenticatorOnly = false, autoFocus = false }) {
  const { t } = useLanguage();
  return <label>{authenticatorOnly ? t("Authenticator code") : t("Authenticator or recovery code")}
    <input name="code" autoFocus={autoFocus} autoComplete="one-time-code" autoCapitalize="off" spellCheck={false} required
      inputMode={authenticatorOnly ? 'numeric' : 'text'} pattern={authenticatorOnly ? '[0-9]{6}' : undefined}
      minLength={6} maxLength={authenticatorOnly ? 6 : 25} placeholder={authenticatorOnly ? '000000' : undefined} />
  </label>;
}

export default function AccountSecurity({ onboarding = false, onRegistered, onContinue }) {
  const { t } = useLanguage();
  const { player, applyIdentity, busy, setBusy, notify, connect } = useLounge();
  const [mode, setMode] = useState('login');
  const [pushChallenge, setPushChallenge] = useState(null);
  const [pushMessage, setPushMessage] = useState('');
  const pollInFlight = useRef(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState(null);
  const [recovery, setRecovery] = useState([]);
  const [disabling, setDisabling] = useState(false);
  const [editing, setEditing] = useState(false);
  const account = player?.account;
  const disabled = pending || busy || !player;

  useEffect(() => {
    if (!pushChallenge || mode !== 'challenge' || busy) return;
    let active = true;
    let timer;
    async function poll() {
      try {
        const request = api('auth/push/status', { requestId: pushChallenge.requestId });
        pollInFlight.current = request;
        const result = await request;
        if (result.player) {
          applyIdentity(result.player);
          return;
        }
        if (!active) return;
        if (result.status === 'denied') {
          setMode('login');
          setPushChallenge(null);
          setError('The sign-in request was declined.');
        } else if (result.status === 'unavailable') {
          setPushChallenge(null);
          setPushMessage('Use your authenticator or recovery code to continue.');
        } else {
          timer = window.setTimeout(poll, 1800);
        }
      } catch (failure) {
        if (!active) return;
        setPushChallenge(null);
        if (failure.status === 401) setMode('login');
        setError(failure.message);
      } finally {
        pollInFlight.current = null;
      }
    }
    timer = window.setTimeout(poll, 1000);
    return () => { active = false; window.clearTimeout(timer); };
  }, [pushChallenge, mode, busy, applyIdentity]);

  function changeMode(next) {
    setMode(next);
    setPushChallenge(null);
    setPushMessage('');
    setError('');
  }

  async function cancelChallenge() {
    if (disabled) return;
    setPending(true);
    setBusy(true);
    try {
      const result = await pollInFlight.current?.catch(() => null);
      if (result?.player) return;
      await api('auth/2fa/cancel', {});
      changeMode('login');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
      setBusy(false);
    }
  }

  async function submit(event, path) {
    event.preventDefault();
    if (disabled) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const payload = path === 'register' ? registrationPayload(values) : values;
    if (!payload) {
      setError('Passwords do not match.');
      form.elements.namedItem('passwordConfirmation')?.focus();
      return;
    }
    for (const name of ['email', 'newPassword', 'code']) {
      if (!payload[name]) delete payload[name];
    }
    // Discard password and code inputs on every attempt.
    for (const name of ['password', 'passwordConfirmation', 'newPassword', 'code']) {
      const input = form.elements.namedItem(name);
      if (input) input.value = '';
    }
    setError('');
    setPending(true);
    setBusy(true);
    try {
      if (path === '2fa/verify' && (await pollInFlight.current?.catch(() => null))?.player) return;
      const result = await api('auth/' + path, payload, player?.id);
      if (path === 'register') onRegistered?.();
      if (result.player) applyIdentity(result.player);
      if (result.requiresTwoFactor) {
        changeMode('challenge');
        setPushChallenge(result.push ?? null);
      }
      if (path === 'credentials') {
        setEditing(false);
        notify('Account settings saved.');
      }
      if (path === '2fa/setup') setSetup(result);
      if (path === '2fa/enable') {
        setSetup(null);
        setRecovery(result.recoveryCodes);
      }
      if (path === '2fa/disable' || path === 'logout') {
        setSetup(null);
        setDisabling(false);
        setRecovery([]);
        changeMode('login');
      }
    } catch (failure) {
      if (failure.status === 409 && failure.message === 'The wallet changed in another tab. Reload before continuing.') {
        void connect();
      }
      if (path === '2fa/verify' && failure.status === 401 && failure.message !== 'That code is incorrect or already used.') {
        changeMode('login');
      }
      setError(failure.message);
    } finally {
      setPending(false);
      setBusy(false);
    }
  }

  async function copy(value, message) {
    try {
      await navigator.clipboard.writeText(value);
      notify(message);
    } catch {
      notify('Clipboard unavailable. Select the text to copy it manually.', true);
    }
  }

  const actions = (label, back) => <div className="security-actions">
    <button className="primary-button" type="submit" disabled={disabled}>{pending ? t("Please wait…") : t(label)}</button>
    {back && <button className="secondary-button" type="button" disabled={disabled} onClick={back}>{t("Cancel")}</button>}
  </div>;

  let content;
  if (!account) {
    const creating = mode === 'register';
    content = mode === 'challenge' ? <>
      <h1 className="account-access-title">{t('Verify it’s you.')}</h1>
      {pushChallenge && <div className="push-login-number" role="status">
        <p>{t('Open the notification on your linked phone and enter this number.')}</p>
        <strong>{pushChallenge.number}</strong>
      </div>}
      {pushMessage && <p role="status">{t(pushMessage)}</p>}
      <p>{t(pushChallenge ? 'You can also sign in with an authenticator or recovery code.' :
        'Enter a six-digit code from your authenticator app or one of your unused recovery codes.')}</p>
      <form key="challenge" className="security-form" onSubmit={event => submit(event, '2fa/verify')}>
        <fieldset disabled={disabled}><CodeField autoFocus /></fieldset>
        {actions('Verify and sign in', cancelChallenge)}
      </form>
    </> : <>
      <h1 className="account-access-title">{creating ? t('Make this wallet yours.') : t('Welcome back.')}</h1>
      <p>{creating
        ? t("Turn this guest wallet into an account and keep your coins, profile, and round history.")
        : t("Sign in to open your saved wallet and continue where you left off.")}</p>
      <div className="security-switch" role="group" aria-label={t("Account access")}>
        <button type="button" aria-pressed={!creating} disabled={disabled} onClick={() => changeMode('login')}>{t("Sign in")}</button>
        <button type="button" aria-pressed={creating} disabled={disabled} onClick={() => changeMode('register')}>{t("Create an account")}</button>
      </div>
      <form key={mode} className="security-form" onSubmit={event => submit(event, mode)}>
        <fieldset disabled={disabled}>
          <label>{t("Username")}<input name="username" autoComplete="username" autoCapitalize="off" spellCheck={false}
              pattern={'[A-Za-z0-9][A-Za-z0-9_\\-]{2,23}'} minLength={3} maxLength={24} required />
            {creating && <small>{t("3–24 characters. Letters, numbers, hyphens, and underscores.")}</small>}
          </label>
          {creating && <label>{t("Email address (optional)")}<input name="email" type="email" autoComplete="email" maxLength={254} /></label>}
          <PasswordField creating={creating} />
          {creating && <PasswordField creating name="passwordConfirmation" label="Confirm password" showHint={false} />}
        </fieldset>
        {actions(creating ? 'Create account' : 'Sign in')}
      </form>
      {!creating && <p className="security-factor-note"><Icon name="shield" />{t('With two-factor authentication, confirm sign-in on your phone or enter a code.')}</p>}
    </>;
  } else {
    content = <>
      {!onboarding && <><div className="security-account">
        <span><Icon name="profile" /><strong>{account.username}</strong></span>
        <form onSubmit={event => submit(event, 'logout')}>
          <button type="submit" className="secondary-button" disabled={disabled}>{t("Sign out")}</button>
        </form>
      </div>
      <section className="account-credentials">
        <h2>{t("Account details")}</h2>
        <p>{account.email || t("No email address added.")}</p>
        {editing ? <form className="security-form" onSubmit={event => submit(event, 'credentials')}>
          <fieldset disabled={disabled}>
            <label>{t("New email address")}<input name="email" type="email" autoComplete="email" maxLength={254} placeholder={account.email || undefined} /></label>
            <PasswordField name="newPassword" label="New password (optional)" creating optional />
            <PasswordField label="Current password" />
            {account.twoFactorEnabled && <CodeField />}
          </fieldset>
          {actions('Save account details', () => { setEditing(false); setError(''); })}
        </form> : <button className="secondary-button" type="button" disabled={disabled}
          onClick={() => { setEditing(true); setError(''); }}>{t("Change email or password")}</button>}
      </section></>}
      {onboarding ? <h1 className="account-access-title">{t('Protect your new account')}</h1> : <h2>{t('Two-factor authentication')}</h2>}
      <div className="security-status" data-enabled={account.twoFactorEnabled}>
        <Icon name="shield" />{account.twoFactorEnabled ? t("Authenticator enabled") : t("Authenticator off")}
      </div>
      {recovery.length > 0 ? <section className="security-recovery">
        <h3>{t("Save your recovery codes")}</h3>
        <p>{t("Each code works once. Store them somewhere safe before closing this screen.")}</p>
        <ul aria-label={t("One-time recovery codes")}>{recovery.map(code => <li key={code}><code>{code}</code></li>)}</ul>
        <div className="security-actions">
          <button className="primary-button" type="button" onClick={() => copy(recovery.join('\n'), 'Recovery codes copied.')}>{t("Copy codes")}</button>
          <button className="secondary-button" type="button" onClick={onboarding ? onContinue : () => setRecovery([])}>{t(onboarding ? 'Continue to the lounge' : 'Done')}</button>
        </div>
      </section> : account.twoFactorEnabled ? <>
        <p>{t("New sign-ins require your password and a code from your authenticator app.")}</p>
        {disabling ? <form className="security-form" onSubmit={event => submit(event, '2fa/disable')}>
          <fieldset disabled={disabled}><PasswordField /><CodeField /></fieldset>
          {actions('Disable two-factor authentication', () => { setDisabling(false); setError(''); })}
        </form> : <button className="secondary-button" type="button" disabled={disabled} onClick={() => setDisabling(true)}>{t("Disable authenticator")}</button>}
      </> : setup ? <>
        <p>{t("Scan the QR code in your authenticator app. Then enter the six-digit code it generates.")}</p>
        <div className="security-enrollment">
          <img width="144" height="144" src={setup.qrImage} alt={t("QR code for enrolling this account in an authenticator app")} />
          <div><small>{t("Manual setup key")}</small><code>{setup.secret}</code>
            <button className="secondary-button" type="button" onClick={() => copy(setup.secret, 'Setup key copied.')}>{t("Copy setup key")}</button>
          </div>
        </div>
        <form className="security-form" onSubmit={event => submit(event, '2fa/enable')}>
          <fieldset disabled={disabled}><CodeField authenticatorOnly /></fieldset>
          {actions('Enable two-factor authentication', () => { setSetup(null); setError(''); })}
        </form>
      </> : <>
        <p>{t(onboarding ? 'Set up an authenticator now to require a second code every time you sign in.' : 'Protect your wallet with a rotating code from an authenticator app. Confirm your password to begin.')}</p>
        <form className="security-form" onSubmit={event => submit(event, '2fa/setup')}>
          <fieldset disabled={disabled}><PasswordField /></fieldset>
          {actions('Set up authenticator')}
        </form>
      </>}
      {account.twoFactorEnabled && <PushDeviceSettings playerId={player.id} PasswordField={PasswordField} CodeField={CodeField} />}
      {onboarding && !account.twoFactorEnabled && <button className="security-onboarding-skip" type="button"
        disabled={disabled} onClick={onContinue}>{t('Set up later in Security')}</button>}
    </>;
  }

  return <section className="account-security">
    <div className="security-kicker"><Icon name="shield" />{" " + t("ACCOUNT ACCESS")}</div>
    {content}
    {!player && <p role="status">{t("Connect your wallet to continue.")}</p>}
    {error && <p className="security-error" role="alert">{t(error)}</p>}
  </section>;
}
