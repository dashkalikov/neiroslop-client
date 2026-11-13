import assert from 'node:assert/strict';
import test from 'node:test';
import * as language from '../src/lib/appearance.js';

test('English remains the default and Russian survives a reload', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(language.readLanguage?.(storage), 'en');
  language.writeLanguage('ru', storage);
  assert.equal(language.readLanguage(storage), 'ru');
  language.writeLanguage('fr', storage);
  assert.equal(language.readLanguage(storage), 'en');
});

test('protected content opens only for an authenticated session', async () => {
  const startup = await import('../src/lib/startup.js');
  assert.equal(startup.sessionView?.(null, 'connecting'), 'loading');
  assert.equal(startup.sessionView(null, 'offline'), 'access');
  assert.equal(startup.sessionView({ account: null }, 'connected'), 'access');
  assert.equal(startup.sessionView({ account: { username: 'player' } }, 'connected'), 'lounge');
});

test('translations preserve dynamic values and English fallback', async () => {
  const { translate } = await import('../src/lib/locale.js');
  assert.equal(translate('ru', 'Sign in'), 'Войти');
  assert.equal(translate('ru', 'Signed in as {0}.', 'player'), 'Вы вошли как player.');
  assert.equal(translate('en', 'Signed in as {0}.', 'player'), 'Signed in as player.');
  assert.equal(translate('ru', 'NEIROSLOP BURMALDA'), 'NEIROSLOP BURMALDA');
});


test('registration verifies the second password field without forwarding it to the API', async () => {
  const security = await import('../src/lib/registration.js');
  const form = { username: 'player', password: 'my exact long password ', passwordConfirmation: 'my exact long password' };
  assert.equal(security.registrationPayload(form), null);
  assert.deepEqual(security.registrationPayload({ ...form, passwordConfirmation: form.password }), {
    username: 'player', password: form.password,
  });
});
