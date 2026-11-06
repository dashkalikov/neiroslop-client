# Music and sound settings

**Settings → Music & sound** and **My account → Preferences** offer four volume controls.

- **Master volume** scales every channel and is also available in the desktop header.
- **Background music** controls the selected soundtrack. Zero pauses the track at its current position.
- **Game effects** covers lever sounds, cell landings, and special symbol cues.
- **Win sounds** covers the win chord and the falling-coin effect.

Turning a sound effects channel to zero silences its active sounds and cancels queued sounds in that channel. The speaker button mutes all channels and resumes the selected music from its current position. The mix and track are saved under `lounge-audio-preferences`. The previous `lounge-volume` preference supplies the initial master setting for existing users.

The lobby and every game share the selected soundtrack, so navigation leaves it playing. The app loads the selected file when the user enables audio and the music channel is audible.

There is no reel-spin or motor playback. As a column stops, its three cells settle with 0/65/130 ms offsets (0/18/36 ms in Quick spin), each with a short pitched landing cue. Wild and BONUS symbols use distinct accents. Reduced motion removes the visual stagger. New rounds and navigation cancel game effects while leaving the common music running.

Wins use a 4.2-second stereo coin shower with irregular metal impacts, small bouncing contacts and short tray reflections.

Current generated files in `client/public/assets/audio/`:

- `lounge-soundtrack.wav` — **Lounge Original**, an 80-second electric piano loop at 72 BPM.
- `golden-hour.wav` — **Golden Hour**, a 51-second plucked-key melody at 76 BPM.
- `moonlit-keys.wav` — **Moonlit Keys**, a 60-second piano loop at 64 BPM with more space between phrases.
- `coin-rain.wav` — the stereo falling-coin effect.
- `cell-landing.wav`, `cell-special.wav`, `cell-bonus.wav` — cell cues.
- `win-chord.wav` — a gentle win chord.

Regenerate these original assets with `python scripts/generate_lounge_audio.py`; no external packages or audio services are required. The earlier `lever-clunk.wav` remains the mechanical lever effect. Earlier reel/coin files are historical assets and are not loaded or played by the current mixer.

`client/src/lib/audio-mixer.js` controls playback and applies the product of master level, channel level and sound gain. `LoungeProvider` mounts a persistent music element, and game components request effects. The mixer checks cover live channel changes, selective mute, track switching, stored preferences, and scheduled cell cues.
