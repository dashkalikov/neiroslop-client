# Shared music, cell cues and volume

Every game and the lobby share one original 80-second instrumental loop. The arrangement uses warm electric-piano notes, soft sustained chords, a relaxed 72 BPM melody and stereo room reflections. Music continues through hash-route changes without restarting. Audio starts after the user enables the speaker.

The header contains a master volume slider. On small screens the same slider is in Settings → Music & sound. Volume is saved on this device under `lounge-volume`; zero is silent. Mute pauses the soundtrack at its current playhead and stops all active or queued effects. Enabling audio resumes from that position.

There is no reel-spin or motor playback. As a column stops, its three cells settle with 0/65/130 ms offsets (0/18/36 ms in Quick spin), each with a short pitched landing cue. Wild and BONUS symbols use distinct accents. Reduced motion removes the visual stagger. New rounds and navigation cancel game effects while leaving the common music running.

Wins use a 4.2-second stereo coin shower with irregular metal impacts, small bouncing contacts and short tray reflections. The mixer applies the master volume to both music and currently sounding effects.

Current generated files in `client/public/assets/audio/`:

- `lounge-soundtrack.wav` — the common music loop.
- `coin-rain.wav` — the stereo falling-coin effect.
- `cell-landing.wav`, `cell-special.wav`, `cell-bonus.wav` — cell cues.
- `win-chord.wav` — a gentle win chord.

Regenerate these original assets with `python scripts/generate_lounge_audio.py`; no external packages or audio services are required. The earlier `lever-clunk.wav` remains the mechanical lever effect. Earlier reel/coin files are historical assets and are not loaded or played by the current mixer.

`client/src/lib/audio-mixer.js` owns channel lifetimes and live gain changes. The persistent music element is mounted by `LoungeProvider`; game components only request effects. Mixer regression checks cover continuous playback, live volume, mute, scheduled-cell cancellation and distinct symbol cues.
