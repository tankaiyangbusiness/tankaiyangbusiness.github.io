# Background music

## Current track

**Calming RPG Town Theme** — royalty-free music from [OpenGameArt.org](https://opengameart.org/content/calming-rpg-town-theme).

- File: `audio/bgm.mp3`
- License: check the asset page on OpenGameArt for the author’s terms (free for game use).
- Style: calm, chill RPG town / exploration loop (~3.5 MB MP3).

## How to use

1. The game loads `audio/bgm.mp3` automatically when **Music** is above 0% (character select or pause menu sliders).
2. To swap tracks, replace `audio/bgm.mp3` or edit:

```
js/systems/audioManager.js  →  export const BGM_MP3_PATH = 'audio/bgm.mp3';
```

## Behavior

- Loops via `HTMLAudioElement.loop`.
- If the MP3 is missing or fails to load, a soft procedural pad fallback plays instead.
- Suggested: 30–90 second seamless loops, normalized volume, MP3 128–192 kbps.

## Safety

Only add music from trusted royalty-free sources (OpenGameArt, Pixabay, itch.io free packs, etc.). Scan new files with your antivirus if downloading from the web.
