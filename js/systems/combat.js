import { rollChance } from '../utils/math.js';
import { scaleEnemyAttackDamageForElapsed } from '../config/balance.js';
import { getAbilityPercent } from '../config/abilityCombatScaling.js';
import {
    computeLevelUpDamageBonus,
    computeUpgradeDamageIncrement,
    computeLevelUpHpGain,
    computeLevelUpMaxHpGain,
    computeArmourUpgradeIncrement
} from '../config/playerProgression.js';

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
    if (isBounce && abilities.bounceLevel > 0) {
        damage = (60 + 10 * (abilities.bounceLevel - 1)) / 100 * damage;
    }

    // Reflect damage is computed via calculateReflectDamageToEnemy (player damage basis).

    const isCritical = !isReflect && rollChance(critChance);
    if (isCritical) {
        damage *= critMultiplier / 100;
    }

    return { damage: Math.floor(Math.max(1, damage)), isCritical };
}

/**
 * Reflect return damage — % of the player's current physical damage, then enemy flat armour.
 * Basis is always playerPhysicalDamage (not damage taken, not enemy attack power).
 *
 * History: an interim build used enemy pre-mitigation hit + true damage to fix "always 1"
 * when reflect was tied to post-mitigation damage taken; that was reverted to this design.
 *
 * @param {object} params
 * @param {number} params.playerPhysicalDamage Player stats.physicalDamage at hit time
 * @param {number} params.reflectLevel Reflect ability level (1–5 → 10%–50%)
 * @param {number} [params.enemyArmour] Attacker armour (flat subtraction, same as basic attacks)
 * @returns {number} Damage dealt to attacker HP (0 when reflect inactive)
 */
export function calculateReflectDamageToEnemy({ playerPhysicalDamage, reflectLevel, enemyArmour = 0 }) {
    if (reflectLevel <= 0 || playerPhysicalDamage <= 0) return 0;
    const pct = getAbilityPercent('reflect', reflectLevel) / 100;
    const raw = Math.floor(playerPhysicalDamage * pct);
    if (raw <= 0) return 0;
    return Math.max(1, raw - Math.max(0, enemyArmour));
}

/**
 * Apply return-damage to a single attacker (respects enemy armour).
 * @param {object} params
 * @param {number} params.playerPhysicalDamage
 * @param {number} params.reflectLevel
 * @param {number} [params.enemyArmour]
 * @param {number} params.attackerHp Current attacker HP before reflect
 * @returns {{ reflected: number, remainingHp: number }}
 */
export function applyReflectDamageToAttacker({
    playerPhysicalDamage,
    reflectLevel,
    enemyArmour = 0,
    attackerHp
}) {
    const hp = Math.max(0, Number(attackerHp) || 0);
    if (hp <= 0) return { reflected: 0, remainingHp: 0 };
    const reflected = calculateReflectDamageToEnemy({
        playerPhysicalDamage,
        reflectLevel,
        enemyArmour
    });
    if (reflected <= 0) return { reflected: 0, remainingHp: hp };
    return { reflected, remainingHp: hp - reflected };
}

/**
 * Incoming damage after armour and Damage Reduction ability.
 * Always deals at least 1 — high armour never grants full immunity.
 * @param {object} params
 * @param {number} [params.elapsedSeconds] When set, applies time-based enemy attack scaling.
 * @returns {number}
 */
export function calculatePlayerIncomingDamage(params) {
    const {
        enemyDamage,
        playerArmour,
        damageReductionLevel,
        ignoreArmour = false,
        elapsedSeconds
    } = params;

    let scaledDamage = enemyDamage;
    if (typeof elapsedSeconds === 'number') {
        scaledDamage = scaleEnemyAttackDamageForElapsed(enemyDamage, elapsedSeconds);
    }

    const mitigation = ignoreArmour ? 0 : calculateArmourMitigation(playerArmour, scaledDamage);
    let damage = scaledDamage * (1 - mitigation);

    if (damageReductionLevel > 0) {
        damage *= (1 - getAbilityPercent('damageReduction', damageReductionLevel) / 100);
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
    return Math.floor(damage * getAbilityPercent('lifesteal', lifestealLevel) / 100);
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
            stats.physicalDamage += computeUpgradeDamageIncrement(statLevel, originalStats.physicalDamage);
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
            stats.armour += computeArmourUpgradeIncrement(statLevel, originalStats.armour);
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
    stats.physicalDamage += computeLevelUpDamageBonus(stats.level - 1, originalStats.physicalDamage);
    stats.armour += Math.floor(1 + stats.level / 8 + originalStats.armour / 40);
    stats.hpRegen += Math.floor(1 + stats.level / 15 + originalStats.hpRegen / 25);
    stats.hp += computeLevelUpHpGain(stats.level, originalStats.hp);
    stats.maxHp += computeLevelUpMaxHpGain(stats.level, originalStats.maxHp);
}
