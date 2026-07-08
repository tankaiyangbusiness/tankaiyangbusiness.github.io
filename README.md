# Survivor Arena — Idle RPG

Auto-battle survival RPG inspired by Vampire Survivors. Survive waves of enemies, level up, and master elemental skills.

**Live:** https://tankaiyangbusiness.github.io

## Features

- 5 playable character classes with unique stat profiles
- 7 enemy archetypes (Grunt, Swarm, Tank, Archer, Dasher, Splitter, Bomber) × 4 rarity tiers
- **Active Skills** (choose at Lv 5, 10, 15, 20 …) — separate from passive abilities:
  - **Fireball** — explosive projectile with AoE splash + burn DoT
  - **Ice Nova** — radial freeze wave around the player
  - **Lightning Arc** — instant chain lightning through enemies
- **Passive Abilities** (choose at Lv 9, 19, 29 …) — Reflect, Bounce, Lifesteal, etc.
- **Stat Upgrades** — all other level-ups
- Full combat animations (attack pulse, crit hits, death explosions, elemental effects)
- Memory-optimized with proper cleanup, timeout tracking, and animation cancellation

## Run Locally

**Option 1 — double-click (no server needed):**  
Open `index.html` directly in your browser. The game loads via `game.bundle.js`, which works on `file://`.

**Option 2 — dev server:**

```bash
npm install
npm run dev
```

## Build

Source lives in modular ES modules under `js/`. The browser loads a bundled file:

```bash
npm run build   # outputs game.bundle.js
```

Run `npm run build` after changing any file under `js/`. `npm test` builds automatically before running tests.

## Run Tests

```bash
npm install
npm test
```

## Project Structure

```
index.html          — Page shell (loads game.bundle.js)
game.bundle.js      — Browser bundle (generated — do not edit)
style.css           — UI, animations, effects
js/
  config/
    skills.js       — Active skill definitions (fireball, iceNova, lightningArc)
    progression.js  — Passive abilities & stat upgrades
  systems/
    skillExecutor.js — Runtime skill casting (separate from abilities)
    progression.js   — Level-up type routing (skill vs ability vs stat)
  ui/
    entityModels.js  — Character & enemy visual model builders
css/
  models.css         — Character & enemy sprite designs
```

## Controls

| Key | Action |
|-----|--------|
| `1`–`5` | Select character |
| `1`–`4` | Choose level-up upgrade |
| `Esc` | Pause / resume |
| Any key / click | Restart after game over |

## Future Roadmap

- **Audio** — SFX for attacks, crits, level-up, enemy deaths; background music
- **More skills** — Poison (stacking DoT), Holy (heal on kill), Shadow (teleport dodge)
- **Boss mechanics** — Unique attack patterns per boss type (charge, AoE slam, summon)
- **Equipment system** — Weapon/armour drops with passive bonuses
- **Achievements & meta-progression** — Unlock characters and permanent upgrades between runs
- **Mobile touch controls** — Virtual joystick or tap-to-dodge
- **Save system** — LocalStorage high scores and run history
- **Wave events** — Horde waves, treasure chests, elite gauntlets
- **Co-op / leaderboard** — Online high score integration via GitHub Pages backend or Firebase
- **Sprite art** — Replace CSS circles with animated sprite sheets
- **Performance** — Canvas/WebGL renderer for 500+ enemies on screen
