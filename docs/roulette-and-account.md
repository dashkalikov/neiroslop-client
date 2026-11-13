# Riviera Roulette, categories, and My account

The application now includes nine games. Open `/#game/roulette`, `/#account`, or `/#category/tables` in the React app at http://127.0.0.1:3000/.

## Roulette presentation

`RouletteGame.jsx` presents a separate European single-zero table with emerald felt, a live 3D walnut/brass wheel, a rolling ivory ball, chips, recent numbers, a payout guide, and a quick-spin toggle. Stationary housing, track and deflectors surround a separate rotating pocket bank, number ring, bowl and turret. Explore the craftsmanship opens an assembled/exploded component viewer with isolation, orbit and zoom controls. [Detailed component model](roulette-wheel-model.md).

The betting layout supports individual numbers including zero, red/black, odd/even, low/high, three dozens and three columns. Chip values include presets and manual whole-coin entry. Undo, Clear and Rebet operate on placements before the next spin. Multiple bets can win independently. Winning returns include the original stake. Total wagers are limited to 10,000 virtual coins and the available wallet balance. On narrow screens, the table pans internally while its number grid, dozens and outside bets remain aligned.

The published rules and payout conventions were checked against [PokerStars' roulette rules](https://www.pokerstars.com/casino/how-to-play/roulette/rules/). This implementation uses the listed standard single-number, dozen, column and even-money payouts; it does not implement split/street/corner bets, la partage or en prison. It uses virtual coins and original presentation artwork.

## API and storage

- `POST /api/roulette/spin`: `{ "requestId": "UUID", "bets": [{ "kind": "straight", "value": 17, "amount": 10 }, { "kind": "red", "amount": 20 }] }`.
- `kind` can be `straight`, `red`, `black`, `odd`, `even`, `low`, `high`, `dozen` or `column`. Only straight bets take a 0–36 value; dozens/columns take 1–3. Other bets omit value.
- The Python rules use `secrets.randbelow(37)`. The client never supplies the winning number or payout. Zero loses outside bets.
- The API locks the player row, validates stakes, writes `game_rounds` and `balance_transactions`, and updates the wallet in one transaction. Retries return the existing saved round. Reusing an ID across different games returns 409.
- A pending roulette request is retained in this browser tab's session storage, scoped to the wallet. Reloading during a round offers Resume round and replays the same request ID to avoid charging twice. An optional-storage failure does not block play, but recovery across a reload requires session storage.
- Roulette history uses the existing history and round-result endpoints, adding `number` and `color` fields to roulette entries.

## Categories and account

The lobby offers All games (9), Slots (8), Mechanical (the two three-reel slots), and Table games (roulette). Categories combine with theme, search and sorting. Favorites and recent games retain their own views. Table games and My account also appear in the sidebar.

My account has Your profile, Preferences and Activity tabs. Display name, avatar color and default wager are validated by `POST /api/account` and saved to the new `player_preferences` table, linked by a primary/foreign key to `players`. `GET /api/session` includes those preferences. The default wager is used when opening a new slot game and as the initial roulette chip value. Profile updates cannot change the wallet balance.

Theme, background, sound and volume controls reuse the existing application preferences and remain saved on the device. Activity reuses the wallet's latest 30 rounds. This is a browser-linked guest account; email/password registration is outside this addition. Existing player rows and balances are preserved. Startup creates the additional table and adds roulette to the shared catalog; no destructive schema change is needed.

## Artwork

Built-in ImageGen output copied into the project as `client/public/assets/roulette-scene.png` (1536×1024). It supplies the lobby cover and subtle game-room atmosphere. The wheel, numbers, ball and betting controls are live components. Final prompt:

Use case: stylized-concept. Asset type: final cinematic landscape cover and atmosphere for an original virtual roulette game called Riviera Roulette. Premium photorealistic 3D product render, 1536x1024. A beautifully crafted European single-zero roulette wheel in polished dark walnut, bronze and satin brass, emerald green and ruby red pockets, ivory ball, finely turned brass spindle, foreground elegant stacks of mint, ivory and burgundy casino chips on deep emerald wool felt. Wheel and chips concentrated on RIGHT half, left half quiet dark teal negative space suitable for live white typography. Background a luxurious midnight Riviera lounge with curved art deco windows, distant Mediterranean sea and faint palm silhouettes, softly blurred warm amber lamps. Sophisticated tasteful atmosphere, tactile real materials, intricate mechanical craft, restrained soft teal and gold highlights, studio quality, subtle film grain, realistic reflections and shallow depth of field. No people, NO TEXT, no typography, no logos, no watermark, no UI controls. Wide full-bleed cover composition.

## Verification

Automated checks cover zero, simultaneous winning bets, payout totals, invalid bets, persistence, duplicate requests, cross-game request IDs, private account settings, wallet protection, final ball alignment, chip aggregation, table limits, and combined category filters. Browser checks cover live motion, locked bets, custom chip entry, Undo, Clear, panning at 390px, profile save/reload, default wager use in a slot game, and category counts. Screenshots are indexed in `previews/README.md`.

## Account sign-in and authenticator setup

The sign-in screen opens when the browser has no active account session or after sign-out. Registration attaches a case-insensitive username and password to the current guest wallet and preserves its balance, profile, bonus state, and history. An optional contact email can be provided at registration. The registration form verifies the password confirmation and offers authenticator setup before opening the lounge.

Use **My account → Profile** to edit the nickname, default wager, and avatar. Use **My account → Security** to change the contact email or password. These changes require the current password and, when enabled, a fresh authenticator or recovery code. Changing the password revokes the account’s other sessions. The sign-in identifier is the username.

Select **English** or **Русский** in **Appearance settings**, **My account → Preferences**, or on the sign-in screen. The selection is stored on the current browser.

In **My account → Security**, confirm your password, scan the QR code with a TOTP authenticator app, and enter its six-digit code. The manual setup key is available next to the QR code. Save the recovery codes when they appear. Each recovery code works once. After enrollment, new sign-ins require approval on a linked phone, a fresh authenticator code, or a recovery code. Disabling the authenticator requires your password and either kind of code.

- React calls FastAPI over JSON. The browser receives an HttpOnly, SameSite cookie. Account and challenge tokens are independent and stored as hashes in PostgreSQL.
- FastAPI uses salted scrypt for passwords and encrypts authenticator secrets with Fernet. Enrollment and password verification have attempt limits. Short-lived challenges are consumed after verification. TOTP time steps and recovery codes are accepted once. Changing the second factor revokes the account's other sessions.
- PostgreSQL adds `accounts`, `web_sessions`, and `auth_throttle` at startup. The existing player, preference, wallet, and round tables keep their data. The server rejects stale wallet IDs when a browser tab submits a bet under a different session.

The default Docker Compose launch persists a generated local encryption key in the `auth_data` volume. Direct local development writes the key under the ignored `data/` directory. For HTTPS or a standalone container, set a stable `AUTH_SECRET_KEY` in the runtime environment and back it up separately from the database. See the [deployment configuration](ci-cd.md#authenticator-encryption-key).

## Sign-in notifications on a phone

1. Open the same HTTPS site on your phone, sign in, and open **My account → Security → Sign-in notifications**. On iPhone or iPad, add the site to the Home Screen and open it from there.
2. Select **Link this phone**, confirm your password and a fresh authenticator or recovery code, then allow notifications. Linking another browser replaces the previous one. You can unlink it from the security settings.
3. On your next sign-in, open the notification and enter the four-digit number shown in the browser where you signed in. Select **Approve sign-in** or **Decline sign-in**. An authenticator or unused recovery code also works if the phone is unavailable.

For deployment, set a persistent VAPID P-256 private key (32 raw bytes encoded as unpadded base64url) in `PUSH_VAPID_PRIVATE_KEY` and an operator contact such as `mailto:admin@example.org` in `PUSH_VAPID_SUBJECT`. Keep these in the server environment alongside the existing authentication settings. The server derives the public key and needs HTTPS access to browser push providers. The phone must be able to reach the site's HTTPS URL. To generate the key, run this locally in the backend virtual environment and store the output as a secret.

```sh
python -c "from base64 import urlsafe_b64encode; from cryptography.hazmat.primitives.asymmetric import ec; print(urlsafe_b64encode(ec.generate_private_key(ec.SECP256R1()).private_numbers().private_value.to_bytes(32, 'big')).decode().rstrip('='))"
```

## Liquid Glass

Under **Appearance**, choose **Dark** or **Light** for the color mode, then choose **Standard** or **Liquid Glass** for the visual style. The top-bar switch changes the color mode while keeping your style. Liquid Glass adds translucent navigation in either palette, with solid content panels for game and account text. Wallpaper stays independently selectable. Reduced transparency and higher contrast use more solid controls. The app saves all three choices on this device. An existing Liquid Glass preference opens in Dark mode with Liquid Glass selected.
