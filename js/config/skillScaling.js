/**
 * Skill damage level curve — weak Lv.1, steep growth from Lv.2 onward.
 * Tunable constants live here so balance passes stay localized.
 */

/** Lv.1 deals this fraction of the legacy Lv.1 damage (−20%). */
export const SKILL_LEVEL_1_DAMAGE_FACTOR = 0.8;

/** Per-level growth from Lv.2+, multiplied against each skill's legacy step. */
export const SKILL_DAMAGE_RAMP_FACTOR = 2.5;

/**
 * Legacy linear skill formula: `constant + level × perLevelStep`.
 * Lv.1 is nerfed; Lv.2+ uses a steeper ramp so upgrades feel impactful.
 * @param {number} level Skill level (1–5)
 * @param {number} constant Legacy intercept (damage mult when level = 0 in old formula)
 * @param {number} perLevelStep Legacy per-level increment
 * @returns {number}
 */
export function skillLevelDamageMult(level, constant, perLevelStep) {
    if (level <= 0) return 0;
    const legacyLv1 = constant + perLevelStep;
    const lv1 = legacyLv1 * SKILL_LEVEL_1_DAMAGE_FACTOR;
    if (level === 1) return lv1;
    const rampStep = perLevelStep * SKILL_DAMAGE_RAMP_FACTOR;
    return lv1 + (level - 1) * rampStep;
}

/**
 * Skills defined as `baseAtLv1 + (level - 1) × step` (e.g. Illusion clone %).
 * @param {number} level
 * @param {number} baseAtLv1 Legacy value at level 1
 * @param {number} perLevelFrom2 Legacy increment for each level above 1
 * @returns {number}
 */
export function skillLevelDamageFromBase(level, baseAtLv1, perLevelFrom2) {
    if (level <= 0) return 0;
    const lv1 = baseAtLv1 * SKILL_LEVEL_1_DAMAGE_FACTOR;
    if (level === 1) return lv1;
    const rampStep = perLevelFrom2 * SKILL_DAMAGE_RAMP_FACTOR;
    return lv1 + (level - 1) * rampStep;
}

/**
 * Whole-number percent for clone / UI display skills.
 * @param {number} level
 * @param {number} baseAtLv1
 * @param {number} perLevelFrom2
 * @returns {number}
 */
export function skillLevelDamagePercent(level, baseAtLv1, perLevelFrom2) {
    return Math.round(skillLevelDamageFromBase(level, baseAtLv1, perLevelFrom2));
}

/** @param {number} level @param {number} constant @param {number} perLevelStep */
export function legacySkillLevelDamageMult(level, constant, perLevelStep) {
    if (level <= 0) return 0;
    return constant + level * perLevelStep;
}
