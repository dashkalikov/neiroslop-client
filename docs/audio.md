# Music and sound settings

**Settings → Music & sound** and **My account → Preferences** offer four volume controls.

- **Master volume** scales every channel and is also available in the desktop header.
- **Background music** controls the selected soundtrack. Zero pauses the track at its current position.
- **Game effects** covers lever sounds, cell landings, special symbol cues, and the rolling roulette ball.
- **Win sounds** covers the win chord and the falling-coin effect.

Turning a sound effects channel to zero silences its active sounds and cancels queued sounds in that channel. The speaker button mutes all channels and resumes the selected music from its current position. The mix and track are saved under `lounge-audio-preferences`. The previous `lounge-volume` preference supplies the initial master setting for existing users.

The lobby and every game share the selected soundtrack, so navigation leaves it playing. The app loads the selected file when the user enables audio and the music channel is audible.

There is no reel-spin or motor playback. As a column stops, its three cells settle with 0/65/130 ms offsets (0/18/36 ms in Quick spin), each with a short pitched landing cue. Wild and BONUS symbols use distinct accents. Reduced motion removes the visual stagger. New rounds and navigation cancel game effects while leaving the common music running.

Riviera Roulette uses the same ball trajectory to drive its rolling sound. The loop slows and fades as the ball moves into a pocket. Quick spin plays it faster, and reduced motion skips the rolling loop. The Game effects level controls this sound independently of the music and win sounds.

Wins use a 4.2-second stereo coin shower with irregular metal impacts, small bouncing contacts and short tray reflections.

Current generated files in `client/public/assets/audio/`:

- `lounge-soundtrack.wav` — **Lounge Original**, an 80-second electric piano loop at 72 BPM.
- `golden-hour.wav` — **Golden Hour**, a 51-second plucked-key melody at 76 BPM.
- `moonlit-keys.wav` — **Moonlit Keys**, a 60-second piano loop at 64 BPM with more space between phrases.
- `coin-rain.wav` — the stereo falling-coin effect.
- `cell-landing.wav`, `cell-special.wav`, `cell-bonus.wav` — cell cues.
- `win-chord.wav` — a gentle win chord.

Regenerate these original assets with `python scripts/generate_lounge_audio.py`; no external packages or audio services are required. `python scripts/generate_slot_audio.py` generates `lever-clunk.wav` and the seamless `roulette-roll.wav` loop. Earlier reel and coin files are historical assets.

`client/src/lib/audio-mixer.js` controls playback and applies the product of master level, channel level and sound gain. `LoungeProvider` mounts a persistent music element, and game components request effects. The mixer checks cover live channel changes, selective mute, track switching, stored preferences, and scheduled cell cues.
