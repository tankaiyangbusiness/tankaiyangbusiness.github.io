/**
 * Basic-attack style helpers — melee vs projectile by character model.
 * Skills and Bounce chain projectiles are unaffected.
 */

/** Characters whose default attack is a melee strike (no projectile). */
export const MELEE_MODEL_CLASSES = new Set([
    'adventurer',
    'warrior',
    'assassin',
    'berserker',
    'paladin',
    'slayer',
    'capybara'
]);

/**
 * @param {string} [modelClass]
 * @returns {boolean}
 */
export function usesMeleeBasicAttack(modelClass) {
    return MELEE_MODEL_CLASSES.has(modelClass);
}
