/**
 * Passive ability combat scaling — single source of truth for formulas and UI progression.
 * Combat math and level-up copy both read from here so tuning stays in sync.
 */
export const ABILITY_COMBAT_SCALING = {
    reflect: { percentPerLevel: 10, maxPercent: 50, maxLevel: 5, damageBasis: 'playerPhysicalDamage' },
    lifesteal: { percentPerLevel: 5, maxPercent: 25, maxLevel: 5 },
    damageReduction: { percentPerLevel: 10, maxPercent: 50, maxLevel: 5 },
    attackSpeedBuff: { percentPerLevel: 20, maxPercent: 100, maxLevel: 5 }
};

/**
 * @param {'reflect'|'lifesteal'|'damageReduction'|'attackSpeedBuff'} kind
 * @param {number} level
 * @returns {number} Effective percent at this level (capped).
 */
export function getAbilityPercent(kind, level) {
    const cfg = ABILITY_COMBAT_SCALING[kind];
    if (!cfg || level <= 0) return 0;
    const cappedLevel = Math.min(level, cfg.maxLevel);
    return Math.min(cfg.maxPercent, cappedLevel * cfg.percentPerLevel);
}

/**
 * @param {'reflect'|'lifesteal'|'damageReduction'|'attackSpeedBuff'} kind
 * @returns {string[]} Per-level display values for progression placeholders.
 */
export function buildAbilityProgression(kind) {
    const cfg = ABILITY_COMBAT_SCALING[kind];
    if (!cfg) return [];
    const steps = [];
    for (let i = 1; i <= cfg.maxLevel; i++) {
        steps.push(String(getAbilityPercent(kind, i)));
    }
    return steps;
}
