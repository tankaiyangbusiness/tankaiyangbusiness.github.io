/**
 * Wave event helpers — boss waves every N waves with mini swarm support.
 */

/** Waves 10, 20, 30… trigger a landmark boss encounter. */
export const BOSS_WAVE_INTERVAL = 10;

/** Mini swarm size accompanying a boss-wave elite. */
export const BOSS_WAVE_SWARM_COUNT = { min: 5, max: 8 };

/** Extra HP multiplier for the wave-interval boss. */
export const BOSS_WAVE_HP_MULT = 2.4;

/** @param {number} wave 1-based wave number */
export function isBossWave(wave) {
    return wave > 0 && wave % BOSS_WAVE_INTERVAL === 0;
}

/** How many small swarm adds to spawn with the boss. */
export function rollBossWaveSwarmCount() {
    const { min, max } = BOSS_WAVE_SWARM_COUNT;
    return min + Math.floor(Math.random() * (max - min + 1));
}
