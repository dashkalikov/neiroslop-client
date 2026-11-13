export function supportsPush() {
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function preparePushWorker() {
  return navigator.serviceWorker.register('/login-push.js');
}

export async function subscribeToPush(worker, key) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Allow notifications on this device to link it.');

  const base64 = key.replace(/-/g, '+').replace(/_/g, '/');
  const publicKey = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const registration = await worker;
  const active = registration.active ? registration : await navigator.serviceWorker.ready;
  let subscription = await active.pushManager.getSubscription();
  const existingKey = subscription?.options.applicationServerKey;
  if (subscription && (existingKey?.byteLength !== publicKey.length ||
      !new Uint8Array(existingKey).every((byte, index) => byte === publicKey[index]))) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await active.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
  const { endpoint, keys } = subscription.toJSON();
  return { endpoint, keys };
}
