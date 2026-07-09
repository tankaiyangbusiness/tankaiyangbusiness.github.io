/**
 * Player level-up / upgrade damage tuning — centralized for balance passes.
 */

/** @param {number} level Current level before increment */
/** @param {number} originalPhysicalDamage */
export function computeLevelUpDamageBonus(level, originalPhysicalDamage) {
    const nextLevel = level + 1;
    return Math.floor(
        0.75 + nextLevel / 5 + originalPhysicalDamage / 8
    );
}

/** @param {number} statLevel Current upgrade tier (before increment) */
/** @param {number} originalPhysicalDamage */
export function computeUpgradeDamageIncrement(statLevel, originalPhysicalDamage) {
    const tier = statLevel + 1;
    return Math.floor(
        0.75 + originalPhysicalDamage / 6 + tier * 0.75
    );
}

/** Passive HP gain on character level-up (current HP). */
export function computeLevelUpHpGain(levelAfterIncrement, originalHp) {
    return Math.floor(
        8 + 2.5 * levelAfterIncrement + originalHp / 100
    );
}

/** Passive max HP gain on character level-up. */
export function computeLevelUpMaxHpGain(levelAfterIncrement, originalMaxHp) {
    return Math.floor(
        10 + 3.5 * levelAfterIncrement + originalMaxHp / 100
    );
}

/** Armour gain from upgrade-panel "Upgrade Armour" picks (not character level). */
export function computeArmourUpgradeIncrement(statLevel, originalArmour) {
    return Math.floor(2 + statLevel * 1.25 + originalArmour / 20);
}
