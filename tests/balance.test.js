import { describe, it, expect } from 'vitest';
import {
    BALANCE,
    SURVIVAL_TARGET_MINUTES,
    getSpawnIntervalMs,
    applyBalanceScale,
    applyEnemyMovePressure,
    applyEarlyWaveDamageReduction,
    applyEarlyWaveHpReduction,
    applyEarlyWaveExpBonus
} from '../js/config/balance.js';

describe('balance config', () => {
    it('targets ~20 minute average survival', () => {
        expect(SURVIVAL_TARGET_MINUTES).toBe(20);
        expect(BALANCE.difficultyIntervalSec).toBeGreaterThanOrEqual(18);
        expect(BALANCE.warmupSeconds).toBeGreaterThanOrEqual(150);
    });

    it('has warmup and enemy cap', () => {
        expect(BALANCE.warmupSeconds).toBeGreaterThan(60);
        expect(BALANCE.maxEnemiesOnScreen).toBeLessThanOrEqual(100);
    });

    it('increases spawn rate with difficulty', () => {
        const low = getSpawnIntervalMs('normal', 0);
        const high = getSpawnIntervalMs('normal', 50);
        expect(high).toBeLessThan(low);
    });

    it('reduces early wave enemy damage through wave 11', () => {
        expect(applyEarlyWaveDamageReduction(100, 0)).toBe(50);
        expect(applyEarlyWaveDamageReduction(100, 11)).toBeLessThan(100);
        expect(applyEarlyWaveDamageReduction(100, 12)).toBe(100);
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
        expect(BALANCE.enemyHpScale).toBeCloseTo(0.60, 2);
        expect(BALANCE.enemyDamageScale).toBeCloseTo(0.55, 2);
        expect(BALANCE.enemyExpScale).toBeCloseTo(0.926, 2);
        expect(BALANCE.spawnsPerMinute.normal).toBeCloseTo(27.5, 1);
    });
});
