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
    scaleEnemyAttackDamageForElapsed
} from '../js/config/balance.js';

describe('balance config', () => {
    it('targets ~20 minute average survival', () => {
        expect(SURVIVAL_TARGET_MINUTES).toBe(20);
        expect(BALANCE.difficultyIntervalSec).toBeGreaterThanOrEqual(18);
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
        expect(BALANCE.enemyHpScale).toBeCloseTo(0.63, 2);
        expect(BALANCE.enemyDamageScale).toBeCloseTo(0.7686525, 4);
        expect(BALANCE.enemyExpScale).toBeCloseTo(0.926, 2);
        expect(BALANCE.spawnsPerMinute.normal).toBeCloseTo(30, 1);
        expect(BALANCE.waveStatBoostBonus).toBeCloseTo(0.25, 2);
        expect(BALANCE.enemyBaseDamageBonus).toBeCloseTo(1.2, 2);
        expect(BALANCE.enemyBaseArmourBonus).toBeCloseTo(1.1, 2);
    });

    it('stacks +25% combat stats every 12 waves (not HP/speed)', () => {
        expect(getWaveStatBoostStacks(11)).toBe(0);
        expect(getWaveStatBoostStacks(12)).toBe(1);
        expect(getWaveStatBoostStacks(24)).toBe(2);
        const stats = { physicalDamage: 100, armour: 10, hp: 500, maxHp: 500, moveSpeed: 0.3 };
        applyWaveStatBoost(stats, 12);
        expect(stats.physicalDamage).toBe(125);
        expect(stats.armour).toBe(12);
        expect(stats.hp).toBe(500);
        expect(stats.moveSpeed).toBe(0.3);
    });
});
