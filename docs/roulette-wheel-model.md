# Riviera roulette wheel: component model

Open Riviera Roulette, then **Explore the craftsmanship** beneath the wheel. The viewer supports assembled and exploded views, selection and isolation of individual parts, drag-to-orbit, scroll/pinch zoom, overhead viewing and reset. The same geometry is used in the playable game.

## Assemblies

| Part | Construction | Movement |
| --- | --- | --- |
| Walnut housing | Revolved cabinet profile, moulded rim, black plinth, brass stringing, countersunk screws | Fixed |
| Bearing assembly | Steel hub, collar and central axle | Fixed support |
| Ball track and apron | Continuous outer race and a sloping dark-composite stator | Fixed |
| Diamond ball stops | Twelve raised metal deflectors | Fixed |
| Pocket bank | Support plate with a central bearing bore, 37 recessed enamel wells, 37 scalloped raised separators, inner/outer lips | Rotates |
| Number ring | Separate colored enamel panels, printed European single-zero sequence, trim rails | Rotates with pockets |
| Rotor bowl | Curved walnut cone with fine brass inlays | Rotates with pockets |
| Turret and cross-tree | Profiled brass spindle, nickel collars, four radial arms, finials and crown | Rotates with pockets |
| Ball | Shaded ivory-colored sphere with reflective resin appearance | Counter-rotates, drops, then travels with the captured pocket |

The reference research used [Cammegh's wheel construction and material options](https://www.cammegh.com/our-products/roulette-wheels/mercury-360-rrs/), including its distinction between ball track, separators, turret and ball stops. This is an original conventional wheel model, not a reproduction of proprietary sensors, RRS technology or manufacturing drawings.

## Implementation

- `client/src/lib/roulette-model.js`: renderer-independent Three.js geometry builder. Stationary assemblies attach to the root; the number ring, pocket bank, bowl and turret share an independent rotor parent. Each assembly can be separated or isolated. Materials and geometry have explicit disposal.
- `client/src/lib/roulette-motion.js`: a continuous visual trajectory. The ball runs on the outer race, drops and bounces toward the pockets, and follows the still-moving rotor after capture. Its final position is constrained to the API's winning number.
- `client/src/lib/roulette-renderer.js`: camera, studio environment, physically based materials, contact shadows, textures and orbit controls. It renders during movement or interaction, then becomes idle. Offscreen viewports stop rendering; resize observers keep the canvas responsive.
- `client/src/components/RouletteModelViewport.jsx`: GPU lifecycle and the simplified fallback when a detailed renderer cannot start.
- `client/src/components/RouletteWheel.jsx`: the game presentation and accessible inspection controls.
- `client/src/styles/roulette-wheel-model.css`: responsive game and inspection layouts.

The model uses Three.js 0.187.0. [LatheGeometry](https://threejs.org/docs/pages/LatheGeometry.html) constructs the turned profiles; [physical materials](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) provide clear-coated walnut and reflective metal; a [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html) supplies reflected studio lighting. Number printing is a code-generated high-resolution texture, separate from the colored panel meshes.

The API, wagers and database settlement remain authoritative. Motion is a visually constrained animation rather than an engineering collision simulation, and does not generate or influence the result. Reduced-motion preferences shorten the visual sequence. Opening the inspection dialog cannot trigger a background round through Space.

## Walnut artwork

The built-in ImageGen tool generated the original walnut material. It is saved in the project as `client/public/assets/roulette-walnut-burl.png`, 1254×1254 PNG. It is an albedo texture; the engine adds varnish and lighting. No third-party product photograph is used as the playable wheel.

Final generation prompt:

Use case: product-mockup. Asset type: seamless albedo texture for physically based 3D modeling, square 1536x1536. A flat close-up orthographic material scan of exquisite dark European walnut burl veneer used on a real luxury roulette wheel. Rich deep chocolate brown and warm reddish umber, naturally swirling tight figured wood grain, fine dark pores, delicate subtle flame and burl figuring, realistic thin grain rather than thick painted streaks. Even diffuse neutral lighting with NO directional highlights, NO shadows and NO perspective. No gloss baked into the image: clear varnish reflections will be rendered separately by the 3D engine. Edge-to-edge uninterrupted wood material, seamless tileable pattern, finely detailed, believable high quality real walnut wood, quiet subtle contrast, no objects, no text, no frame, no watermark.

## Checks

`client/tests/roulette-model.test.js` verifies ball drop and capture, fixed versus rotating assemblies, world-space ball/pocket alignment and upward-facing pocket surfaces. The existing roulette tests continue to check betting and payout-related boundaries. Browser checks and current previews are listed in `previews/README.md`.

Verified on 2026-11-05: 32 client tests and 41 backend tests passed, and the production build passed. Browser checks covered a completed virtual-coin round, overhead viewing, assembled/exploded views, part isolation, drag-to-orbit, light/dark themes, a 390×844 phone viewport without horizontal page overflow, and reload. Opening the component viewer creates a second ready WebGL canvas; closing it returns to one. Pressing Space inside inspection left an unsubmitted wager unchanged and did not start a round. Final screenshots include desktop, phone, isolated turret and exploded assembly views.
