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
