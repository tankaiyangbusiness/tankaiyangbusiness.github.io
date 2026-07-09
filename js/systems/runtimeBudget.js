/**
 * Runtime budget accessors — read limits from config; identical at every game speed.
 */
import { RUNTIME_BUDGET } from '../config/runtimeBudget.js';

/**
 * @typedef {object} RuntimeBudgets
 * @property {number} maxEffects
 * @property {number} maxClassTimers
 * @property {number} maxSkillImpacts
 * @property {number} maxEnemies
 * @property {number} maxProjectiles
 * @property {number} projectileSpeedVwPerSec
 * @property {number} projectileMaxStepVw
 * @property {number} projectileHitRadius
 * @property {number} cosmeticThrottleRatio
 */

/** @deprecated Use RUNTIME_BUDGET from config — kept for legacy imports. */
export const RUNTIME_BUDGET_DEFAULTS = {
    effects: RUNTIME_BUDGET.maxEffects,
    classTimers: RUNTIME_BUDGET.maxClassTimers,
    skillImpacts: RUNTIME_BUDGET.maxSkillImpacts,
    enemies: RUNTIME_BUDGET.maxEnemies,
    projectiles: RUNTIME_BUDGET.maxProjectiles
};

/**
 * Legacy helper — still used by tests; not applied to live budgets anymore.
 * @param {number} baseMax
 * @param {number} timeScale
 * @param {number} [min]
 * @returns {number}
 */
export function scaleCapForTimeScale(baseMax, timeScale, min = 8) {
    const scale = Math.max(1, timeScale);
    return Math.max(min, Math.floor(baseMax / scale));
}

/** @deprecated Legacy helper — kept for tests. */
export function inverseSqrtCap(baseMax, timeScale, min = 8) {
    const scale = Math.max(1, timeScale);
    return Math.max(min, Math.floor(baseMax / Math.sqrt(scale)));
}

/** @returns {RuntimeBudgets} */
export function getRuntimeBudgets() {
    return {
        maxEffects: RUNTIME_BUDGET.maxEffects,
        maxClassTimers: RUNTIME_BUDGET.maxClassTimers,
        maxSkillImpacts: RUNTIME_BUDGET.maxSkillImpacts,
        maxEnemies: RUNTIME_BUDGET.maxEnemies,
        maxProjectiles: RUNTIME_BUDGET.maxProjectiles,
        projectileSpeedVwPerSec: RUNTIME_BUDGET.enemyProjectileSpeedVwPerSec,
        projectileMaxStepVw: RUNTIME_BUDGET.enemyProjectileMaxStepVw,
        projectileHitRadius: RUNTIME_BUDGET.enemyProjectileHitRadius,
        cosmeticThrottleRatio: RUNTIME_BUDGET.cosmeticThrottleRatio
    };
}

/** Skip non-critical VFX when owned effect nodes exceed the configured fraction of cap. */
export function shouldThrottleCosmeticEffects(activeCount, maxEffects, ratio = RUNTIME_BUDGET.cosmeticThrottleRatio) {
    if (maxEffects <= 0) return true;
    return activeCount >= Math.floor(maxEffects * ratio);
}
