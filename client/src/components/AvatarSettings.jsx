import { useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext.jsx';
import { useLounge } from '../LoungeContext.jsx';
import { api, avatarSource } from '../lib/api.js';
import { prepareAvatar } from '../lib/avatar.js';
import AvatarImage from './AvatarImage.jsx';

export default function AvatarSettings({ disabled }) {
  const { t } = useLanguage();
  const { player, setPlayer, notify, avatarRevision, refreshAvatar, setBusy } = useLounge();
  const input = useRef(null);
  const [working, setWorking] = useState(false);

  async function save(file) {
    if (!player?.account || working || disabled) return;
    setWorking(true);
    setBusy(true);
    try {
      const image = file ? await prepareAvatar(file) : null;
      const { player: saved } = await api('auth/avatar', { image }, player.id);
      setPlayer(current => current?.id === saved.id
        ? { ...current, account: { ...current.account, avatarImage: saved.account.avatarImage } }
        : current);
      refreshAvatar();
      notify(file ? 'Profile picture updated.' : 'Profile picture removed.');
    } catch (error) {
      notify(error.message, true);
    } finally {
      setWorking(false);
      setBusy(false);
    }
  }

  return <fieldset className="avatar-settings" disabled={disabled || working}>
    <legend>{t('Profile picture')}</legend>
    <div className="avatar-settings-row">
      <div className={'account-avatar avatar-' + player.preferences.avatar}>
        <AvatarImage preferences={player.preferences} source={avatarSource(player, avatarRevision)} />
      </div>
      <div className="security-actions">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden
          onChange={event => {
            const file = event.currentTarget.files[0];
            event.currentTarget.value = '';
            if (file) void save(file);
          }} />
        <button type="button" className="secondary-button" onClick={() => input.current?.click()}>{t('Upload image')}</button>
        {player.account.avatarImage && <button type="button" className="secondary-button" onClick={() => save(null)}>{t('Remove image')}</button>}
      </div>
    </div>
    <small>{working ? t('Saving…') : t('PNG, JPEG, or WebP · up to 8 MB')}</small>
  </fieldset>;
}
