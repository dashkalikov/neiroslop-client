# Saloon Luck

A separate playable game at `/#game/saloon`, added alongside the original seven games. The supplied exploded-view reference guided the ornate bronze cabinet, art-nouveau trim, oil-lamp glass lights, crystal lever, console and coin tray.

## Implementation

- `client/src/components/SaloonMachine.jsx` presents the detailed cabinet and live glass paytable, three reels, crystal handle, illuminated cabinet console and integrated wager controls.
- `client/src/styles/saloon.css` aligns live elements to the cabinet apertures using percentages and container-relative units. The physical controls stay on the machine; `SaloonControlPanel.jsx` adds a synchronized modern panel on the right, stacked below the cabinet on phones. An optional enlarged view lets phone users pan across the cabinet.
- `GameScreen.jsx` owns the shared spin/bonus lifecycle; the new presentation reuses the same authoritative API, staggered reel stops, cell cues, soundtrack, coin rain and auto-spin controller. The lever follows the same centered vertical stroke, with a new faceted crystal grip.
- FastAPI registers `saloon` in the catalog and request schema. Startup adds its catalog record to PostgreSQL without replacing player data. Three reels, five fixed paylines, wild substitution and eight free spins with 2× line wins. A paid win is credited automatically; there is no second collect transaction.
- No external game provider or real-money payment is involved. This is a detailed game interpretation of the reference, not a physical engineering simulation.

## Artwork

Created with the built-in ImageGen tool and saved in the client:

- `client/public/assets/saloon-cabinet.png` — front cabinet render. Live graphics cover its blank apertures; CSS feathers the surrounding glow into the game environment.
- `client/public/assets/saloon-scene.png` — cinematic cover and game room.
- `client/public/assets/saloon-symbols.png` — 4-column × 2-row symbol atlas: seven, bell, cherries, BAR, horseshoe, sheriff wild, crystal bonus; final cell unused. Alpha preserved.

The reference was supplied by the user as a design guide and is preserved in `docs/saloon-reference.png`. Live text, controls, reflections, lighting and projected lever geometry are code-native; transparent crystal and engraved brass images supply material detail. The earlier fixed mount asset is retained as source artwork; the live mounting gears now use animated geometry.

## Image generation prompts

### cabinet

Use case: stylized-concept. Asset type: final detailed slot cabinet housing for a playable browser game, transparent background, portrait 1024x1536. Image 1 is a reference for design and materials, not an edit target. Build a straight-on FRONT ELEVATION of the assembled SALOON LUCK mechanical slot machine from the reference. Ornate aged blackened bronze and brass cabinet, art-nouveau floral filigree, engraved scrollwork, tiny bolts, ribbed metal edges, amber perimeter lights plus restrained mint green and lavender neon piping. Highly detailed physically plausible 3D product render. Two glass oil-lamp shaped neon bulbs flank the curved top marquee. The top marquee at 8–18% canvas height reads exactly SALOON LUCK, gold and pale turquoise. The main housing is centered, occupies x=12–88% and y=3–97%, symmetrical in frontal perspective, completely visible. Dark paytable glass window x=23–77%, y=23–37%, leave this window blank (live text will overlay). Rectangular THREE-REEL aperture x=22–78%, y=43–61%, dark empty interior without symbols or reels (live animated reels will overlay). Frame above it reads WILD WEST REELS. Sloped plain dark brass console area x=20–80%, y=64–77%, do not draw buttons or text here (interactive controls will overlay). Lower embossed access door and copper mesh grille at y=78–88%. Shallow brass coin tray at y=89–94% with a few worn coins. A small visible mechanical gear housing on the right edge. Keep all windows frontal and rectangular for clean overlay alignment. Do NOT include a lever, handgrip, user interface, floating diagram labels, exploded parts, background room, floor or exterior cast shadows. Real transparent alpha outside the machine. Rich tangible metal texture, jewel lights, museum-quality craftsmanship, crisp details, not a flat cartoon.

### scene

Use case: stylized-concept. Asset type: cinematic landscape game cover and environment 1536x1024. Image 1 is design inspiration for the assembled machine. An exquisite neo-Western SALOON LUCK slot machine in a midnight saloon, on the RIGHT third of the composition, full ornate cabinet with aged brass filigree, warm amber marquee reading SALOON LUCK, three ivory reels with red sevens, curved glass, oil-lamp shaped neon bulbs, tall crystal-tipped lever, mint green and lavender neon traces along its side, visible copper gears and a coin tray. A rich dark wooden saloon with carved arches, stained glass, old brass lamps, and soft atmospheric teal haze. Left two thirds is mostly quiet shadow, suitable for UI text overlay. Luxurious detailed 3D cinematic rendering, believable materials, warm amber with cool mint and violet accents, deep black bronze, volumetric light, no people, no floating typography, no watermarks. Hero asset for a polished playable game.

### symbols

Use case: stylized-concept. Asset type: production slot-symbol sprite atlas, transparent background. Eight equal square cells in a strict FOUR COLUMN by TWO ROW grid, 1536x768 wide, no gutters, all cell centers exactly aligned, every icon fills about 66% of its own cell with generous padding and never crosses a cell boundary. Seven premium ornate neo-Western slot symbols, tactile 3D render with brass edges and crisp silhouettes, inspired by a black bronze and neon saloon slot. Top row left to right: 1 a lacquered RUBY RED SEVEN with engraved gold bevels, 2 a shiny bronze saloon BELL with turquoise enamel, 3 a pair of bright glossy RED CHERRIES with leaves, 4 a polished black BAR plaque with gold lettering BAR. Bottom row left to right: 5 a GOLD HORSESHOE with tiny nailheads and mint gemstones, 6 an ornate gold SHERIFF STAR with turquoise inset and readable WILD lettering, 7 a radiant tall faceted LAVENDER AND MINT CRYSTAL in a brass mount with BONUS lettering, 8 EMPTY transparent cell. Clean transparent alpha, no backdrop, no extra symbols, no grid lines, no drop shadows outside cells, consistent soft studio lighting. Clear readable game icons, not a poster.

## Checks

Backend regression checks cover the 3×3 layout, a custom 37-coin wager, wild substitution, double free-spin wins at zero balance, eight-spin crystal awards, persistence and idempotent replay. The existing shared controller checks cover auto-spin scheduling and wager validation. Screenshots are saved in `previews/games/`.

Browser verification also exercised a 37-coin lever round, a physical Start round, invalid-wager blocking, auto-spin start/stop, a live coin-rain win, saved history, eight lobby entries, original Velvet Sevens reels/handle, and a 390px phone viewport without horizontal overflow.
## Cabinet rework

The lower inspection/gear widget was removed. Every physical play control sits on the sloped cabinet panel: editable bet with ±, Start, Auto-spin, Max Bet, Lines, Rules, Quick and History. Buttons use beveled brass frames and inset jewel caps. The later refinement also adds the requested modern side panel, with the same wager, spin, auto-spin, paytable, history, quick-spin and payline state. Enlarge cabinet provides a pannable close view on phones.

The upper information window now has a glass reflection layer; the reels have cylindrical shading, perspective-compressed upper/lower symbols, a convex cover, edge highlights and animated glints. Eighteen staggered bulb overlays, mint/violet neon tubes, lamp auras and status lamps animate during idle play, spins and wins. Reduced-motion preferences retain static illumination.

`SaloonLever.jsx` now projects a longer, faceted metal shaft and crystal grip through a 135-degree pull toward the viewer. `lib/saloon-machine.js` supplies the perspective projection, depth-sorted faces and inverse drag geometry. Surface artwork turns and foreshortens with the geometry. A bolted bracket and two counter-rotating gears connect the arm to the right-side mechanism. Existing Velvet Sevens still uses its original handle.

New project assets, generated with the built-in ImageGen tool using the supplied reference and existing cabinet as design references:

- `client/public/assets/saloon-crystal-grip.png` — transparent faceted grip and brass collar.
- `client/public/assets/saloon-lever-mount.png` — transparent fixed sprung bronze mount.

### Crystal grip prompt

Use case: stylized-concept. Production cutout asset for a mechanical casino slot handle. Reference image 1 shows the desired Saloon Luck design; image 2 shows the actual game cabinet whose ornate brass craftsmanship must match. Render ONLY a large elongated faceted crystal handgrip seated in an exquisitely engraved aged brass socket, true transparent alpha, portrait 768x1024. Straight frontal view. Crystal is shaped like the reference's elegant tapered elongated hexagonal diamond, broad beveled crown, narrow lower tip, asymmetric internal facets, iridescent lavender, cyan and mint-green refracted light, delicate magenta edge. Pale gold metal collar, ribbed turned brass neck, tiny screws and embossed scrolls, realistic heavy brass jewelry craftsmanship. Top of grip at 8% canvas height, lower brass socket at 92%, whole grip centered x=50%, maximum width 58% canvas. Rich photographic 3D PBR rendering, detailed natural reflections, deeply dimensional transparent glass, not a simple flat polygon. NO shaft, NO lever arm, NO hinge, NO body, NO background, NO floor, NO letters, no glow rectangle or exterior cast shadow. Keep silhouette clean and all parts fully visible. Actual alpha transparency surrounding the grip.

### Lever mount prompt

Use case: stylized-concept. Production cutout game asset, portrait 768x1024, true transparent alpha. Reference 1 shows the desired Saloon Luck lever mechanism; reference 2 shows the ornate aged brass cabinet to match. Render ONLY the FIXED LEVER MOUNT: a compact vertical antique black-bronze bracket with a round ratcheted brass pivot bearing at center, visible finely machined gear teeth, a real tightly coiled return spring at the upper left, two mounting flanges with slotted bolts, ornate floral brass filigree on dark cast iron, patina, polished wear on edges. Straight frontal elevation, slight dimensional thickness on right edge, central pivot spindle at exactly 50% width and 55% height. Width of whole mount occupies 72% of canvas, height 85%, centered. Extremely tangible PBR metal detail, same quality and color as cabinet, amber warm highlights with a subtle mint rim. NO long lever arm, NO shaft, NO crystal, NO handle, NO surrounding machine, no text, no room, no floor or background shadow. True transparent background outside the mount.

## Motion, lighting and controls refinement

The thin gold streaks were native scrollbars appearing as the shaking cabinet overflowed its frame. Normal viewing now clips that overflow; enlarged viewing intentionally keeps horizontal panning. Integer-pixel shake steps avoid fractional edge shimmer, and sweeping glass glints pause during shaking. Both glass covers remain in place.

Eighteen bulb overlays are aligned to measured light centers in the cabinet artwork. Their chase animation fades opacity to zero rather than dimming opaque pixels to gray. Soft neon bloom follows the existing frames. Each top lamp has layered flame shapes, a breathing warm aura and nine fading ember particles. Reduced-motion preferences suppress movement while keeping illumination.

The console uses a perspective tilt matching its sloped metal surface. Brass button rims, jewel caps, side walls and pressed offsets provide depth. Child button layers stay flat within that tilted plane, avoiding the browser hit-testing issue caused by nested 3D layers. Cabinet and modern-panel controls were checked against the same live state, including validation, Rules, Quick, paylines, spinning and auto-spin.

The transparent engraved metal surface asset is saved at `client/public/assets/saloon-arm-metal.png` (724×2172, alpha preserved). It was generated with the built-in ImageGen tool, using the existing cabinet as the material reference. The new asset is preloaded before play. Final prompt:

Use case: stylized-concept. Asset type: transparent material/detail cutout for a projected 3D arcade lever, 1024x3072 portrait. Input image 1 is a MATERIAL AND CRAFTSMANSHIP reference only, not an edit target. Render ONLY ONE long, slender, straight vertical antique brass slot-machine lever SHAFT, perfectly frontal elevation, centered at x=50%, top at 5%, bottom at 95%, maximum width just 18% of canvas, slender rod approximately 15 times longer than thick. This is the metal arm connecting an ornate crystal handgrip to a gear housing, but show NO handgrip, no crystal and NO gears, hinge or housing. A beautiful turned bronze and aged brass cylindrical rod with dark recesses, polished warm gold edge highlights, delicate chased floral engraving and spiral scrollwork running along its length, fine fine metal grain, narrow decorative collars near top and bottom, knurled rings and small inset silver accents. Match the luxurious antique neo-Western arcade cabinet reference. Rich physically based 3D rendering with tactile metal reflections and edge wear, not flat vector. Neutral warm studio light from upper left with restrained mint rim. Clean actual alpha transparency everywhere around the rod, no background, no floor, no cast shadow, no lettering, no user interface, no parts other than one long straight metal rod. Keep entire slender object fully visible with transparent padding.

Verification: 25 client tests and 29 backend tests, plus browser checks of the projected lever, moving gears, transparent light fades, angled button hit targets, shared wager validation and 390px phone layout. The phone layout has no horizontal page overflow; the enlarged cabinet retains internal panning. Current JPG previews are listed in `previews/README.md`.
