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

/**
 * Global multiplier for whether any gear drops on kill.
 * Prior 0.3762 × 0.70 (−30% all enemy drop rates) ≈ 0.26334.
 */
export const DROP_RATE_MULTIPLIER = 0.26334;

/**
 * Effective kill→drop chances by enemy category (BASE × DROP_RATE_MULTIPLIER):
 * | Category  | Chance  |
 * |-----------|---------|
 * | normal    | ~1.580% |
 * | rare      | ~3.160% |
 * | elite     | ~5.793% |
 * | boss      | ~11.85% |
 * | treasure  | ~17.12% |
 *
 * Late waves (wave > 8) further scale down via getDropChance().
 */

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

/** Rarity bands from affix count (same as rarityFromAffixCount). */
const RARITY_AFFIX_BANDS = {
    normal: { min: 0, max: 0 },
    magic: { min: 1, max: 2 },
    rare: { min: 3, max: 6 },
    unique: { min: 7, max: 8 }
};

/**
 * Conditional gear-rarity rates when a drop already happened (from AFFIX_COUNT_WEIGHTS).
 * This is what designers / UI should cite — not enemy category drop %.
 *
 * Approximate shares across categories (weight sum per rarity / total):
 * | Source enemy | Normal | Magic | Rare | Unique |
 * |--------------|--------|-------|------|--------|
 * | normal       | 62%    | 35%   | 3%   | 0%     |
 * | rare         | 38%    | 48%   | 14%  | 0%     |
 * | elite        | 20%    | 46%   | 33%  | 1%     |
 * | boss         | 10%    | 32%   | 54%  | 4%     |
 * | treasure     | 12%    | 40%   | 46%  | 2%     |
 *
 * @param {string} enemyRarity
 * @returns {{ normal: number, magic: number, rare: number, unique: number }} fractions 0–1
 */
export function getGearRarityDropRates(enemyRarity = 'normal') {
    const weights = AFFIX_COUNT_WEIGHTS[enemyRarity] || AFFIX_COUNT_WEIGHTS.normal;
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    /** @type {{ normal: number, magic: number, rare: number, unique: number }} */
    const out = { normal: 0, magic: 0, rare: 0, unique: 0 };
    for (const [rarity, band] of Object.entries(RARITY_AFFIX_BANDS)) {
        let sum = 0;
        for (let i = band.min; i <= band.max; i++) sum += weights[i] || 0;
        out[/** @type {GearRarity} */ (rarity)] = sum / total;
    }
    return out;
}

/**
 * Overall P(gear rarity | kill) = P(drop) × P(rarity | drop) at wave ≤ 8.
 * @param {string} enemyRarity
 * @param {number} [wave=0]
 * @returns {{ normal: number, magic: number, rare: number, unique: number }}
 */
export function getAbsoluteRarityDropRates(enemyRarity = 'normal', wave = 0) {
    const drop = getDropChance(enemyRarity, wave);
    const conditional = getGearRarityDropRates(enemyRarity);
    return {
        normal: drop * conditional.normal,
        magic: drop * conditional.magic,
        rare: drop * conditional.rare,
        unique: drop * conditional.unique
    };
}

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

/** @param {string} enemyRarity @param {number} [wave=0] 1-based wave for late-game drop scaling */
export function getDropChance(enemyRarity, wave = 0) {
    const base = DROP_CHANCE[enemyRarity] || DROP_CHANCE.normal;
    if (wave <= 8) return base;
    // Late game: fewer drops as monster count rises (wave 20 ≈ 66%, wave 35 ≈ 24%)
    const lateScale = Math.max(0.12, 1 - (wave - 8) * 0.032);
    return base * lateScale;
}

/** @param {string} enemyRarity @param {number} [wave=0] */
export function shouldDropGear(enemyRarity, wave = 0) {
    return Math.random() < getDropChance(enemyRarity, wave);
}

/** @deprecated Use rarityFromAffixCount */
export function rollGearRarity(enemyRarity) {
    return rarityFromAffixCount(rollAffixCount(enemyRarity));
}
