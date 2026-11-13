const base = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export async function api(path, body, playerId) {
  const response = await fetch(`${base}/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(playerId ? { 'X-Lounge-Player': playerId } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) { const error=new Error(data?.error || 'The lounge is reconnecting. Please try again.');error.status=response.status;throw error; }
  return data;
}

export function avatarSource(player, revision) {
  if (!player?.account?.avatarImage) return undefined;
  return base + '/account/avatar?v=' + revision;
}
