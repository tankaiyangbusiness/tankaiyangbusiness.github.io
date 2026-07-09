import { describe, it, expect } from 'vitest';
import {
    calculatePlayerDamage,
    calculatePlayerIncomingDamage,
    calculateEnemyHitDamageForReflect,
    calculateArmourMitigation,
    calculateLifesteal,
    calculateReflectDamage,
    applyReflectDamageToAttacker,
    applyStatUpgrade,
    applyLevelUpBonuses,
    ARMOUR_MITIGATION_CAP,
    rollEnemyEvade
} from '../js/systems/combat.js';
import { getAbilityPercent } from '../js/config/abilityCombatScaling.js';

describe('calculatePlayerDamage', () => {
    const base = {
        physicalDamage: 30,
        targetArmour: 5,
        maxHp: 600,
        hpRegen: 3,
        critChance: 0,
        critMultiplier: 150,
        abilities: {
            reflectLevel: 0,
            bounceLevel: 0,
            hpToDamageLevel: 0,
            regenToDamageLevel: 0
        }
    };

    it('calculates base damage minus armour', () => {
        const result = calculatePlayerDamage(base);
        expect(result.damage).toBe(25);
        expect(result.isCritical).toBe(false);
    });

    it('applies HP To Damage bonus', () => {
        const result = calculatePlayerDamage({
            ...base,
            abilities: { ...base.abilities, hpToDamageLevel: 5 }
        });
        expect(result.damage).toBe(25 + Math.floor(600 * 5 * 6 / 100));
    });

    it('applies bounce damage reduction', () => {
        const result = calculatePlayerDamage({
            ...base,
            isBounce: true,
            abilities: { ...base.abilities, bounceLevel: 3 }
        });
        expect(result.damage).toBe(Math.floor(25 * 0.8));
    });

    it('enforces minimum damage of 1', () => {
        const result = calculatePlayerDamage({
            ...base,
            physicalDamage: 2,
            targetArmour: 100
        });
        expect(result.damage).toBe(1);
    });
});

describe('calculateReflectDamage', () => {
    it('returns percent of pre-mitigation hit damage (10% per level)', () => {
        expect(calculateReflectDamage(100, 0)).toBe(0);
        expect(calculateReflectDamage(100, 1)).toBe(10);
        expect(calculateReflectDamage(100, 5)).toBe(50);
        expect(calculateReflectDamage(0, 3)).toBe(0);
    });

    it('never returns zero for positive hit damage when leveled', () => {
        expect(calculateReflectDamage(1, 1)).toBe(1);
    });

    it('scales from enemy hit basis, not post-mitigation player damage', () => {
        const dealtToPlayer = calculatePlayerIncomingDamage({
            enemyDamage: 12,
            playerArmour: 200,
            damageReductionLevel: 5,
            elapsedSeconds: 480
        });
        expect(dealtToPlayer).toBe(1);

        const hitBasis = calculateEnemyHitDamageForReflect({
            enemyDamage: 12,
            elapsedSeconds: 480
        });
        expect(hitBasis).toBe(12);
        expect(calculateReflectDamage(hitBasis, 5)).toBe(6);
    });

    it('reflects independently for each attacker in a swarm', () => {
        const reflectLevel = 5;
        const hitDamage = 20;
        const attackers = Array.from({ length: 100 }, (_, i) => ({ id: i, hp: 50 }));

        attackers.forEach(attacker => {
            const result = applyReflectDamageToAttacker(hitDamage, reflectLevel, attacker.hp);
            expect(result.reflected).toBe(10);
            attacker.hp = result.remainingHp;
        });

        expect(attackers.every(a => a.hp === 40)).toBe(true);
    });

    it('reflect damage ignores enemy armour (true damage to HP)', () => {
        const { reflected, remainingHp } = applyReflectDamageToAttacker(100, 5, 200);
        expect(reflected).toBe(50);
        expect(remainingHp).toBe(150);
    });
});

describe('calculateArmourMitigation', () => {
    it('returns 0 with no armour', () => {
        expect(calculateArmourMitigation(0, 50)).toBe(0);
    });

    it('uses diminishing returns and caps reduction', () => {
        const low = calculateArmourMitigation(20, 50);
        const high = calculateArmourMitigation(200, 50);
        expect(high).toBeGreaterThan(low);
        expect(high).toBeLessThanOrEqual(ARMOUR_MITIGATION_CAP);
    });
});

describe('calculatePlayerIncomingDamage', () => {
    it('reduces damage with armour using diminishing returns', () => {
        const unarmoured = calculatePlayerIncomingDamage({
            enemyDamage: 50,
            playerArmour: 0,
            damageReductionLevel: 0
        });
        const armoured = calculatePlayerIncomingDamage({
            enemyDamage: 50,
            playerArmour: 30,
            damageReductionLevel: 0
        });
        expect(armoured).toBeLessThan(unarmoured);
        expect(armoured).toBeGreaterThanOrEqual(1);
    });

    it('applies damage reduction ability multiplicatively', () => {
        const base = calculatePlayerIncomingDamage({
            enemyDamage: 50,
            playerArmour: 0,
            damageReductionLevel: 0
        });
        const reduced = calculatePlayerIncomingDamage({
            enemyDamage: 50,
            playerArmour: 0,
            damageReductionLevel: 5
        });
        expect(reduced).toBe(Math.max(1, Math.floor(base * (1 - getAbilityPercent('damageReduction', 5) / 100))));
    });

    it('never grants full immunity at extreme armour', () => {
        expect(calculatePlayerIncomingDamage({
            enemyDamage: 10,
            playerArmour: 500,
            damageReductionLevel: 5
        })).toBeGreaterThanOrEqual(1);
    });

    it('ignores armour when enemy bypasses defense', () => {
        const mitigated = calculatePlayerIncomingDamage({
            enemyDamage: 40,
            playerArmour: 80,
            damageReductionLevel: 0,
            ignoreArmour: false
        });
        const pierced = calculatePlayerIncomingDamage({
            enemyDamage: 40,
            playerArmour: 80,
            damageReductionLevel: 0,
            ignoreArmour: true
        });
        expect(pierced).toBeGreaterThan(mitigated);
        expect(pierced).toBe(40);
    });

    it('applies time-based enemy attack scaling when elapsedSeconds is provided', () => {
        const early = calculatePlayerIncomingDamage({
            enemyDamage: 100,
            playerArmour: 0,
            damageReductionLevel: 0,
            elapsedSeconds: 0
        });
        const normal = calculatePlayerIncomingDamage({
            enemyDamage: 100,
            playerArmour: 0,
            damageReductionLevel: 0,
            elapsedSeconds: 480
        });
        const late = calculatePlayerIncomingDamage({
            enemyDamage: 100,
            playerArmour: 0,
            damageReductionLevel: 0,
            elapsedSeconds: 960
        });
        expect(early).toBe(90);
        expect(normal).toBe(100);
        expect(late).toBe(110);
    });
});

describe('rollEnemyEvade', () => {
    it('returns false at zero evade', () => {
        expect(rollEnemyEvade(0)).toBe(false);
    });
});

describe('calculateLifesteal', () => {
    it('returns 0 when no lifesteal', () => {
        expect(calculateLifesteal({ damage: 100, lifestealLevel: 0 })).toBe(0);
    });

    it('calculates lifesteal heal amount', () => {
        expect(calculateLifesteal({ damage: 100, lifestealLevel: 5 })).toBe(25);
    });
});

describe('applyStatUpgrade', () => {
    it('increases damage on Upgrade Damage', () => {
        const stats = { physicalDamage: 30 };
        const originalStats = { physicalDamage: 30 };
        const statsList = { 'Upgrade Damage': { level: 0, maxLevel: 100 } };

        applyStatUpgrade('Upgrade Damage', stats, originalStats, statsList);
        expect(stats.physicalDamage).toBeGreaterThan(30);
        expect(statsList['Upgrade Damage'].level).toBe(1);
    });

    it('increases attack range on Upgrade AoE', () => {
        const stats = { attackRange: 150 };
        const statsList = { 'Upgrade AoE': { level: 0, maxLevel: 25 } };

        applyStatUpgrade('Upgrade AoE', stats, {}, statsList);
        expect(stats.attackRange).toBe(165);
    });

    it('increases armour more on Upgrade Armour picks', () => {
        const stats = { armour: 48 };
        const originalStats = { armour: 48 };
        const statsList = { 'Upgrade Armour': { level: 0, maxLevel: 1000 } };

        applyStatUpgrade('Upgrade Armour', stats, originalStats, statsList);
        expect(stats.armour).toBeGreaterThan(50);
        expect(statsList['Upgrade Armour'].level).toBe(1);
    });
});

describe('applyLevelUpBonuses', () => {
    it('increments level and boosts stats', () => {
        const stats = {
            level: 1, physicalDamage: 30, armour: 10, hpRegen: 3,
            hp: 100, maxHp: 100
        };
        const original = {
            physicalDamage: 30, armour: 10, hpRegen: 3, hp: 100, maxHp: 100
        };

        applyLevelUpBonuses(stats, original);
        expect(stats.level).toBe(2);
        expect(stats.physicalDamage).toBeGreaterThan(30);
        expect(stats.maxHp).toBe(118);
        expect(stats.hp).toBe(114);
    });
});
