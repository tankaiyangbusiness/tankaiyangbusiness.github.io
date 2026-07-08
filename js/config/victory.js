/**
 * Endgame objective — defeat the Wave 100 final boss. The run continues afterward.
 */

/** Player-facing victory wave (1-based). */
export const FINAL_VICTORY_WAVE = 100;

/** Final boss stat multipliers vs a standard boss at the same difficulty. */
export const FINAL_BOSS_MULT = {
    hpVsBoss: 20,
    damage: 2,
    armour: 2
};

/** Large escort spawned with the Wave 100 final boss. */
export const FINAL_VICTORY_ARMY = {
    swarmMin: 22,
    swarmMax: 30,
    gruntMin: 10,
    gruntMax: 14,
    eliteMin: 5,
    eliteMax: 8
};

/** @param {number} wave 1-based */
export function isFinalVictoryWave(wave) {
    return wave === FINAL_VICTORY_WAVE;
}

/** @param {number} min @param {number} max */
export function rollInt(min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** @returns {number} */
export function rollFinalVictorySwarmCount() {
    return rollInt(FINAL_VICTORY_ARMY.swarmMin, FINAL_VICTORY_ARMY.swarmMax);
}

/** @returns {number} */
export function rollFinalVictoryGruntCount() {
    return rollInt(FINAL_VICTORY_ARMY.gruntMin, FINAL_VICTORY_ARMY.gruntMax);
}

/** @returns {number} */
export function rollFinalVictoryEliteCount() {
    return rollInt(FINAL_VICTORY_ARMY.eliteMin, FINAL_VICTORY_ARMY.eliteMax);
}

/**
 * Apply Wave 100 final boss combat scaling.
 * @param {object} stats Enemy stats object (mutated in place)
 */
export function applyFinalBossCombatScaling(stats) {
    if (!stats) return stats;
    stats.hp = Math.max(1, Math.floor(stats.hp * FINAL_BOSS_MULT.hpVsBoss));
    stats.maxHp = stats.hp;
    stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * FINAL_BOSS_MULT.damage));
    if (typeof stats.armour === 'number') {
        stats.armour = Math.max(0, Math.floor(stats.armour * FINAL_BOSS_MULT.armour));
    }
    return stats;
}
