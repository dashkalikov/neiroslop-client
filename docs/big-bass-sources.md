# Big Bass Bonanza: sources and local implementation

This project includes a virtual-coin recreation with original artwork. The existing six games remain available. Big Bass Bonanza is a Pragmatic Play / Reel Kingdom title; this repository contains its own learning implementation, rather than the provider's game engine.

## Public sources reviewed

- [Pragmatic Play: Big Bass Bonanza](https://www.pragmaticplay.com/en/games/big-bass-bonanza/) — official description of scatter awards, fish collection, retrigger awards and multiplier progression. Reviewed 2026-10-28.
- [Optibet: Big Bass Bonanza rules](https://content.optibet.lv/optibet_lv/files/casino-rules/Big%20Bass%20Bonanza.pdf) — operator-published rules identifying five reels and ten lines, left-to-right line wins, bonus-only wilds, and the timing of queued retrigger batches.

The recreated feature awards 10, 15 or 20 free spins for 3, 4 or 5 scatters. In free spins each fisherman collects all visible money-fish values. Every four fishermen queue ten additional spins at the next collection tier: 2×, 3× and 10×. Queued batches begin after the current batch finishes. Fisherman counts and batches survive page refresh and request replay through the existing saved round JSON in PostgreSQL.

## Deliberate local differences

- Random symbol weights and the ten-line arrangement are defined in `backend/app/services/big_bass.py`. No licensed RNG, reel strips or RTP are reproduced.
- The visible local paytable uses total-wager multipliers. The virtual wallet uses whole coins, so fractional awards round down once per round.
- A local feature limit of 2,100× the triggering wager bounds awards. This is a prototype rule, not a claim about any specific deployed provider version.
- Random extra-fish animations, operator promotions and monetary wagering are not implemented. All play uses virtual coins.
- Artwork was generated specifically for this project, including the fishing scene, symbols and three new app wallpapers. Prompt records are in `docs/bass-and-wallpaper-art.md`.

## App appearance

Settings are accessible from the header gear and the sidebar. Background selection and light/dark colors are independent. Seven image choices and a Classic/no-image choice apply to every route. The selection is stored on this device under `lounge-background`. Returning to Classic removes the image and restores the existing surfaces.

## Mechanical cabinet

The handle has a fixed bearing and a projected 180-degree stroke: its grip starts 155 units above the bearing and finishes 155 units below it. Pointer dragging accounts for the visual scale on phones. A committed pull triggers one server round; the handle then springs back upright. Keyboard and tap activation remain available.
