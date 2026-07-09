import { describe, it, expect } from 'vitest';
import {
    BALANCE,
    SURVIVAL_TARGET_MINUTES,
    getSpawnIntervalMs,
    applyBalanceScale,
    applyEnemyMovePressure,
    applyEarlyWaveHpReduction,
    applyEarlyWaveExpBonus,
    getWaveStatBoostStacks,
    applyWaveStatBoost,
    getEnemyAttackTimeMultiplier,
    scaleEnemyAttackDamageForElapsed,
    balanceCharacterHpRegen,
    CHARACTER_REGEN_BALANCE
} from '../js/config/balance.js';

describe('balance config', () => {
    it('targets ~20 minute run to wave 100', () => {
        expect(SURVIVAL_TARGET_MINUTES).toBe(20);
        expect(BALANCE.difficultyIntervalSec).toBe(12);
        expect(BALANCE.difficultyIntervalSec * 100).toBe(1200);
        expect(BALANCE.warmupSeconds).toBeGreaterThanOrEqual(150);
    });

    it('has warmup and enemy cap', () => {
        expect(BALANCE.warmupSeconds).toBeGreaterThan(60);
        expect(BALANCE.maxEnemiesOnScreen).toBeLessThanOrEqual(60);
    });

    it('increases spawn rate with difficulty', () => {
        const low = getSpawnIntervalMs('normal', 0);
        const high = getSpawnIntervalMs('normal', 50);
        expect(high).toBeLessThan(low);
    });

    it('scales enemy attack damage by run elapsed time', () => {
        expect(getEnemyAttackTimeMultiplier(0)).toBeCloseTo(0.9, 5);
        expect(getEnemyAttackTimeMultiplier(240)).toBeCloseTo(0.95, 5);
        expect(getEnemyAttackTimeMultiplier(480)).toBeCloseTo(1.0, 5);
        expect(getEnemyAttackTimeMultiplier(960)).toBeCloseTo(1.1, 5);
        expect(getEnemyAttackTimeMultiplier(1440)).toBeCloseTo(1.2, 5);
        expect(getEnemyAttackTimeMultiplier(1920)).toBeCloseTo(1.3, 5);

        expect(scaleEnemyAttackDamageForElapsed(100, 0)).toBe(90);
        expect(scaleEnemyAttackDamageForElapsed(100, 480)).toBe(100);
        expect(scaleEnemyAttackDamageForElapsed(100, 960)).toBe(110);
    });

    it('configures enemy attack time curve milestones', () => {
        const cfg = BALANCE.enemyAttackTime;
        expect(cfg.earlyPenalty).toBe(0.10);
        expect(cfg.normalizeAtSec).toBe(480);
        expect(cfg.rampIntervalSec).toBe(480);
        expect(cfg.rampStep).toBe(0.10);
    });

    it('reduces early wave enemy HP by 30%', () => {
        expect(applyEarlyWaveHpReduction(100, 0)).toBe(70);
        expect(applyEarlyWaveHpReduction(100, 11)).toBe(70);
        expect(applyEarlyWaveHpReduction(100, 12)).toBe(100);
    });

    it('boosts early wave enemy EXP by 50%', () => {
        expect(applyEarlyWaveExpBonus(100, 0)).toBe(150);
        expect(applyEarlyWaveExpBonus(100, 11)).toBe(150);
        expect(applyEarlyWaveExpBonus(100, 12)).toBe(100);
    });

    it('reduces enemy damage for survivability', () => {
        expect(applyBalanceScale(100, 'damage')).toBeLessThan(100);
    });

    it('applies move speed pressure over time', () => {
        expect(applyEnemyMovePressure(0.3, 20)).toBeGreaterThan(0.3);
    });

    it('tunes enemy stats per balance patch', () => {
        expect(BALANCE.enemyHpScale).toBeCloseTo(0.52, 3);
        expect(BALANCE.enemyDamageScale).toBeCloseTo(0.62261, 4);
        expect(BALANCE.enemyExpScale).toBeCloseTo(0.926, 2);
        expect(BALANCE.spawnsPerMinute.normal).toBeCloseTo(22.5, 1);
        expect(BALANCE.spawnScaling.normal).toBeCloseTo(2.9, 1);
        expect(BALANCE.midCampaignSpawnReduction.multiplier).toBeCloseTo(0.51, 2);
        expect(BALANCE.enemyBaseDamageBonus).toBeCloseTo(1.2, 2);
        expect(BALANCE.enemyBaseArmourBonus).toBeCloseTo(1.1, 2);
        expect(BALANCE.enemyDamageGlobalMultiplier).toBeUndefined();
        expect(BALANCE.enemyDamageGlobalPatch).toBeUndefined();
    });

    it('does not apply wave milestone combat boosts anymore', () => {
        expect(getWaveStatBoostStacks(24)).toBe(0);
        const stats = { physicalDamage: 100, armour: 10, attackSpeed: 1.4, hp: 500, maxHp: 500, moveSpeed: 0.3 };
        applyWaveStatBoost(stats, 24);
        expect(stats.physicalDamage).toBe(100);
        expect(stats.armour).toBe(10);
        expect(stats.attackSpeed).toBe(1.4);
    });

    it('reduces starting regen by 25% with Healer +10% on the reduced value', () => {
        expect(CHARACTER_REGEN_BALANCE.globalMultiplier).toBe(0.75);
        expect(balanceCharacterHpRegen(130, 'Healer')).toBe(107.25);
        expect(balanceCharacterHpRegen(12, 'Paladin')).toBe(9);
        expect(balanceCharacterHpRegen(3, 'Adventurer')).toBe(2.25);
    });
});
