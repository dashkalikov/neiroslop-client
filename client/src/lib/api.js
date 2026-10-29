const base = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export async function api(path, body) {
  const response = await fetch(`${base}/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'The lounge is reconnecting. Please try again.');
  return data;
}
