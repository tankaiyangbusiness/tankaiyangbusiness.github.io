/**
 * Gear stat scaling — single place to tune drop power.
 */

/** Multiplier applied to all rolled affix and base stat values. */
export const GEAR_STAT_MULTIPLIER = 2.4;

/** White-item ilvl curve: intercept + slope × ilvl */
export const GEAR_BASE_ILVL = {
    intercept: 0.72,
    slope: 0.028
};

/** @param {number} ilvl */
export function gearIlvlMultiplier(ilvl) {
    return GEAR_BASE_ILVL.intercept + ilvl * GEAR_BASE_ILVL.slope;
}

/** @param {number} value @param {string} [stat] */
export function boostGearStatValue(value, stat = '') {
    const boosted = value * GEAR_STAT_MULTIPLIER;
    if (stat === 'attackSpeed') return Math.round(boosted * 100) / 100;
    if (stat === 'critChance' || stat === 'critMultiplier' || stat === 'evade') {
        return Math.round(boosted * 10) / 10;
    }
    return Math.floor(boosted);
}
