/** Gear rarity styling — rarity is derived from affix count, not rolled independently. */

/** @typedef {'normal'|'magic'|'rare'|'unique'} GearRarity */

export const RARITY_CONFIG = {
    normal: {
        key: 'normal',
        label: 'Normal',
        cssClass: 'gear-normal',
        color: '#e2e8f0'
    },
    magic: {
        key: 'magic',
        label: 'Magic',
        cssClass: 'gear-magic',
        color: '#60a5fa'
    },
    rare: {
        key: 'rare',
        label: 'Rare',
        cssClass: 'gear-rare',
        color: '#facc15'
    },
    unique: {
        key: 'unique',
        label: 'Unique',
        cssClass: 'gear-unique',
        color: '#ea580c'
    }
};

/** Base drop chance by enemy category (0–1), before global drop-rate tuning. */
const BASE_DROP_CHANCE = {
    normal: 0.06,
    rare: 0.12,
    elite: 0.22,
    boss: 0.45,
    treasure: 0.65
};

/** Global drop-rate multiplier — 0.36 = 50% fewer drops than prior 0.72 tuning. */
export const DROP_RATE_MULTIPLIER = 0.36;

/** Effective drop chance per category (base × multiplier). */
export const DROP_CHANCE = Object.fromEntries(
    Object.entries(BASE_DROP_CHANCE).map(([k, v]) => [k, v * DROP_RATE_MULTIPLIER])
);

/**
 * Affix-count weights per enemy category — index = affix count (0–8).
 * Tuned so normal drops are common, magic average, rare uncommon, unique very rare.
 */
export const AFFIX_COUNT_WEIGHTS = {
    normal: [62, 26, 9, 2, 1, 0, 0, 0, 0],
    rare: [38, 30, 18, 9, 4, 1, 0, 0, 0],
    elite: [20, 24, 22, 16, 10, 5, 2, 1, 0],
    boss: [10, 14, 18, 20, 16, 12, 6, 3, 1],
    treasure: [12, 18, 22, 20, 14, 8, 4, 1, 1]
};

/** @param {number} affixCount */
export function rarityFromAffixCount(affixCount) {
    if (affixCount >= 7) return 'unique';
    if (affixCount >= 3) return 'rare';
    if (affixCount >= 1) return 'magic';
    return 'normal';
}

/** @param {string} enemyRarity */
export function getAdjustedAffixWeights(enemyRarity) {
    return [...(AFFIX_COUNT_WEIGHTS[enemyRarity] || AFFIX_COUNT_WEIGHTS.normal)];
}

/** @param {string} enemyRarity @returns {number} affix count 0–8 */
export function rollAffixCount(enemyRarity) {
    const weights = getAdjustedAffixWeights(enemyRarity);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return 0;
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return i;
    }
    return 0;
}

/** @param {string} enemyRarity */
export function shouldDropGear(enemyRarity) {
    return Math.random() < (DROP_CHANCE[enemyRarity] || DROP_CHANCE.normal);
}

/** @deprecated Use rarityFromAffixCount */
export function rollGearRarity(enemyRarity) {
    return rarityFromAffixCount(rollAffixCount(enemyRarity));
}
