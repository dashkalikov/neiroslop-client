export function sessionView(player, connection) {
  if (player?.account) return 'lounge';
  return connection === 'connecting' ? 'loading' : 'access';
}
