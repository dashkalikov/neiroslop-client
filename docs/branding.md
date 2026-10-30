# NEIROSLOP BURMALDA branding

The startup identity uses original ImageGen artwork: a neon-chrome wordmark with a striped sunset and palms, a landscape Miami waterfront, and a separate portrait composition. Generated with the built-in ImageGen tool; no external stock artwork is required. The compact palm mark and favicon are native SVG.

## Assets

- `client/public/assets/neiroslop-logo.png` — transparent wordmark, used in the sidebar and startup screen.
- `client/public/assets/miami-startup.png` — desktop background.
- `client/public/assets/miami-startup-mobile.png` — portrait background below 651 px.
- `client/public/favicon.svg` — palm-and-sunset favicon.

## Startup behavior

Static HTML and critical inline CSS display the intro before the React bundle loads. It waits for artwork decoding and a 2.6-second minimum, then fades over 650 ms. A 7-second maximum prevents an asset failure from blocking the app. Skip intro dismisses it immediately. It runs on a full page load, including direct game links, and does not replay on in-app navigation. Reduced-motion users get a short, static transition. The underlying app is inert until the overlay begins leaving.

## Featured-game banner

The lobby rotates all eight game images every 10 seconds, starting after the intro finishes. Far-edge arrows and left/right keyboard keys move between games; direct selectors jump to a game. Every manual change restarts the full interval. Pause/resume is explicit, and timers are disposed on navigation. Neighboring scenes preload to reduce image flashes.

The eight small slide bars sit at the bottom-center of the banner at every breakpoint. Their dark glass backing preserves contrast over game artwork; the selected bar is longer and brighter. On phones the redundant numeric counter is hidden to keep the pause control clear of the centered bars.

## Miami wallpaper and readability

Appearance settings includes **Miami Nights**, using the same landscape Miami image as the startup screen. The saved choice applies to the lobby and all games. Every image background uses nearly opaque, theme-matched surfaces for welcome text, perks, the game collection, game descriptions, footer, and navigation. Secondary text and selected-tab colors are strengthened in wallpaper mode. Classic retains the original surfaces.

## Image generation prompts

### miami-startup

Use case: stylized-concept. Premium website startup-screen environment, wide cinematic landscape 1536x1024. A beautiful Miami South Beach boulevard at blue-hour sunset: tall arching palm trees frame both sides, elegant pastel Art Deco buildings with turquoise and pink neon accents recede toward a modern oceanfront skyline, luminous peach-to-lavender sky, reflective polished pavement with subtle sunset reflections. Sophisticated high-end 3D illustration with photorealistic materials and atmospheric depth, warm coral, fuchsia, electric cyan and midnight purple. Broad quiet sky and darker central negative space for a large overlaid logo; appealing architectural detail strongest at sides and lower third. No people, no cars, no casino machine, no interface, no text, no signs, no watermarks. Visually rich, refined Miami nightlife, not cluttered.

### miami-startup-mobile

Use case: stylized-concept. Premium mobile website startup-screen background, portrait composition 1024x1536. A beautifully composed Miami South Beach boulevard at tropical twilight. Tall elegant palms arch into the frame from both edges, pastel Art Deco facades with tasteful cyan and pink neon accents form a canyon leading to a sunlit oceanfront skyline in the lower center. Rich peach, coral and lavender sky fills upper half, deep indigo and warm pink reflections below. Cinematic detailed 3D illustration, polished realistic materials, sophisticated vaporwave mood. Quiet central middle area for an overlaid large logo. No text, signs, logos, UI, people or cars. Strong palm-tree silhouettes and buildings must remain visible in this portrait framing.

### neiroslop-logo

Use case: logo-brand. A polished original logo for a Miami-inspired virtual casino titled EXACTLY "NEIROSLOP BURMALDA". Transparent background. Wide compact horizontal wordmark, two centered lines: top line "NEIROSLOP", bottom line "BURMALDA". Spell precisely N E I R O S L O P, then B U R M A L D A. Large bold custom geometric 1980s Miami Art Deco lettering, slightly forward leaning, refined bevelled chrome highlights with ivory-to-pink and cyan gradients, deep violet outlined edges that remain readable on light or dark backgrounds. A small elegant tropical palm and striped setting-sun emblem integrated above/beside the letters, not a separate poster. Premium confident graphic identity, crisp immaculate typography, subtle neon glow. Text is dominant and very large, neatly stacked, no extra slogans or words. All elements fit a tight wide transparent canvas, modest even padding, no background rectangle, no scene. This is a usable final brand asset, not a mockup.

## Verification

Timing controllers are covered by six deterministic regression checks, including interval boundaries, wrapping, manual reset, pause/resume, startup readiness, skip, timeout, and disposal. Desktop/phone browser previews are saved under `previews/`.
