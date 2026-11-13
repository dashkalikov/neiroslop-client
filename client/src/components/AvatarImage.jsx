export default function AvatarImage({ preferences, source }) {
  const initial = (preferences?.displayName || 'G').trim().slice(0, 1).toUpperCase();
  return source ? <img className="player-avatar-image" src={source} alt="" /> : initial;
}
