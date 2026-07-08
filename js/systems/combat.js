import { rollChance } from '../utils/math.js';

/** Armour constant for diminishing-returns formula — higher = less reduction per point. */
export const ARMOUR_MITIGATION_K = 40;

/** Max fraction of incoming damage that armour can negate. */
export const ARMOUR_MITIGATION_CAP = 0.75;

/**
 * Diminishing-returns armour reduction (0–ARMOUR_MITIGATION_CAP).
 * @param {number} playerArmour
 * @param {number} rawDamage
 */
export function calculateArmourMitigation(playerArmour, rawDamage) {
    if (playerArmour <= 0) return 0;
    const k = ARMOUR_MITIGATION_K + rawDamage * 0.35;
    const reduction = playerArmour / (playerArmour + k);
    return Math.min(reduction, ARMOUR_MITIGATION_CAP);
}

/**
 * Pure combat damage calculation — testable without DOM.
 * @param {object} params
 * @returns {{ damage: number, isCritical: boolean }}
 */
export function calculatePlayerDamage(params) {
    const {
        physicalDamage,
        targetArmour,
        maxHp,
        hpRegen,
        isReflect = false,
        isBounce = false,
        critChance,
        critMultiplier,
        abilities
    } = params;

    let damage = physicalDamage - targetArmour;

    if (abilities.hpToDamageLevel > 0) {
        damage += maxHp * abilities.hpToDamageLevel * 6 / 100;
    }
    if (abilities.regenToDamageLevel > 0) {
        damage += hpRegen * abilities.regenToDamageLevel * 50 / 100;
    }
    if (isReflect && abilities.reflectLevel > 0) {
        damage = abilities.reflectLevel * 5 / 100 * damage;
    }
    if (isBounce && abilities.bounceLevel > 0) {
        damage = (60 + 10 * (abilities.bounceLevel - 1)) / 100 * damage;
    }

    const isCritical = rollChance(critChance);
    if (isCritical) {
        damage *= critMultiplier / 100;
    }

    return { damage: Math.floor(Math.max(1, damage)), isCritical };
}

/**
 * Incoming damage after armour and Damage Reduction ability.
 * Always deals at least 1 — high armour never grants full immunity.
 * @param {object} params
 * @returns {number}
 */
export function calculatePlayerIncomingDamage(params) {
    const { enemyDamage, playerArmour, damageReductionLevel, ignoreArmour = false } = params;
    const mitigation = ignoreArmour ? 0 : calculateArmourMitigation(playerArmour, enemyDamage);
    let damage = enemyDamage * (1 - mitigation);

    if (damageReductionLevel > 0) {
        damage *= (1 - damageReductionLevel * 0.04);
    }

    return Math.max(1, Math.floor(damage));
}

/** @param {number} [evadeChance] 0–100 */
export function rollEnemyEvade(evadeChance) {
    if (!evadeChance || evadeChance <= 0) return false;
    return rollChance(evadeChance);
}

/**
 * @param {object} params
 * @returns {number}
 */
export function calculateLifesteal(params) {
    const { damage, lifestealLevel } = params;
    if (lifestealLevel <= 0) return 0;
    return Math.floor(damage * lifestealLevel * 5 / 100);
}

/**
 * Apply a stat upgrade selection.
 * @param {string} statName
 * @param {object} stats
 * @param {object} originalStats
 * @param {object} statsList
 */
export function applyStatUpgrade(statName, stats, originalStats, statsList) {
    const statLevel = statsList[statName].level + 1;

    switch (statName) {
        case 'Upgrade Damage':
            stats.physicalDamage += Math.floor(1 + originalStats.physicalDamage / 4 + statLevel);
            break;
        case 'Upgrade AoE':
            stats.attackRange += 15;
            break;
        case 'Upgrade Attack Speed':
            stats.attackSpeed += 0.05 + originalStats.attackSpeed / 60;
            break;
        case 'Upgrade HP (Recover 20% Life)': {
            const hpGain = Math.floor(5 + originalStats.hp / 100 * statLevel + statLevel * Math.log(statLevel * 1.5 + 1));
            stats.hp += hpGain;
            stats.maxHp += hpGain;
            stats.hp += Math.floor(stats.maxHp * 20 / 100);
            break;
        }
        case 'Upgrade HP Regen':
            stats.hpRegen += Math.floor(2 + statLevel * 2 + originalStats.hpRegen / 20);
            break;
        case 'Upgrade Armour':
            stats.armour += Math.floor(1 + statLevel / 2 + originalStats.armour / 40);
            break;
        case 'Upgrade Crit Chance':
            stats.critChance += 2.5;
            break;
        case 'Upgrade Crit Multiplier':
            stats.critMultiplier += 12.5;
            break;
        default:
            break;
    }

    statsList[statName].level += 1;
}

/**
 * Level-up passive bonuses applied after any choice.
 */
export function applyLevelUpBonuses(stats, originalStats) {
    stats.level += 1;
    stats.physicalDamage += Math.floor(1 + stats.level / 3 + originalStats.physicalDamage / 5);
    stats.armour += Math.floor(1 + stats.level / 8 + originalStats.armour / 40);
    stats.hpRegen += Math.floor(1 + stats.level / 15 + originalStats.hpRegen / 25);
    stats.hp += Math.floor(5 + stats.level + originalStats.hp / 150);
    stats.maxHp += Math.floor(5 + 1.5 * stats.level + originalStats.maxHp / 150);
}
