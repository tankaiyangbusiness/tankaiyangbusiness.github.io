/**
 * Player HP lifecycle — single source of truth for damage, regen, clamping, and defeat.
 * Defeat is resolved only after all healing in a tick (regen + passives), so late damage
 * (e.g. bomber explosions from kills) cannot use stale HUD HP from an earlier regen pulse.
 */

/** @param {import('../types.js').PlayerStats} stats */
export function clampPlayerHp(stats) {
    if (!stats) return;
    if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    if (stats.hp < 0) stats.hp = 0;
}

/** @param {import('../types.js').PlayerStats} stats */
export function isPlayerDefeated(stats) {
    return stats.hp <= 0;
}

/**
 * @param {import('../types.js').PlayerStats} stats
 * @param {number} amount
 */
export function applyPlayerDamage(stats, amount) {
    stats.hp -= amount;
}

/**
 * @param {import('../types.js').PlayerStats} stats
 * @param {number} amount
 */
export function applyPlayerHeal(stats, amount) {
    stats.hp = Math.min(stats.maxHp, stats.hp + amount);
}

/**
 * Natural HP regen tick (called once per game tick after combat systems).
 * @param {import('../game/gameState.js').GameState} state
 * @param {number} now Simulated clock ms.
 */
export function tickPlayerRegen(state, now) {
    const s = state;
    const regenBoost = s.abilityList['Regen To Damage'].level > 0
        ? s.abilityList['Regen To Damage'].level * 20 / 100
        : 0;
    const interval = s.healthRegenInterval / (1 + regenBoost);
    if (now - s.healthRegenTime >= interval) {
        s.healthRegenTime = now;
        s.stats.hp += s.stats.hpRegen;
    }
}

/**
 * End-of-tick vitality: clamp HP and decide defeat. Only 0 HP (after clamp) counts as dead.
 * @param {import('../types.js').PlayerStats} stats
 * @returns {boolean} True when the player should be defeated.
 */
export function resolvePlayerDefeat(stats) {
    clampPlayerHp(stats);
    return isPlayerDefeated(stats);
}
