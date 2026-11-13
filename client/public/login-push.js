const labels = {
  en: { title: 'Confirm your sign-in', body: 'Open the request to approve it or decline it.', approve: 'Approve', deny: 'Decline' },
  ru: { title: 'Подтверждение входа', body: 'Откройте запрос, чтобы подтвердить или отклонить вход.', approve: 'Подтвердить', deny: 'Отклонить' },
};

self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  const { token, language } = payload ?? {};
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const text = labels[language] ?? labels.en;
  event.waitUntil(self.registration.showNotification(text.title, {
    body: text.body,
    icon: '/assets/push-icon.png',
    tag: 'lounge-sign-in',
    data: { token },
    actions: [{ action: 'approve', title: text.approve }, { action: 'deny', title: text.deny }],
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { token } = event.notification.data ?? {};
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const action = event.action === 'deny' ? 'deny' : 'approve';
  event.waitUntil(self.clients.openWindow('/#push-' + action + '/' + token));
});
