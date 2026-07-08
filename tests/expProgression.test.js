import { describe, it, expect } from 'vitest';
import {
    EXP_CONFIG,
    calculateExpThreshold,
    totalExpToReachLevel,
    calculateExpFromKill,
    calculateGoldFromKill
} from '../js/config/expProgression.js';

describe('calculateExpThreshold', () => {
    it('uses steep curve for slower late-game leveling', () => {
        expect(calculateExpThreshold(1, 14)).toBeGreaterThan(20);
        expect(calculateExpThreshold(50, 14)).toBeGreaterThan(500);
    });

    it('requires substantially more total exp than fast-pace formula', () => {
        const total = totalExpToReachLevel(100, 14);
        expect(total).toBeGreaterThan(80000);
    });
});

describe('calculateExpFromKill', () => {
    it('applies player exp gain and streak bonus', () => {
        const base = calculateExpFromKill(10, 1, 0, { waveIndex: 20, enemyType: 'grunt' });
        const boosted = calculateExpFromKill(10, 1, 0.2, { waveIndex: 20, enemyType: 'grunt' });
        expect(base).toBe(10);
        expect(boosted).toBe(12);
    });
});

describe('calculateGoldFromKill', () => {
    it('derives gold from exp gained', () => {
        expect(calculateGoldFromKill(10)).toBe(Math.floor(10 * EXP_CONFIG.goldPerExp));
    });
});

describe('EXP pacing target', () => {
    it('level 100 threshold is high enough for long sessions', () => {
        expect(calculateExpThreshold(99, EXP_CONFIG.baseThreshold)).toBeGreaterThan(1500);
    });

    it('uses direct exp grant ratio', () => {
        expect(EXP_CONFIG.enemyExpGrantRatio).toBe(1);
        expect(EXP_CONFIG.thresholdMultiplier).toBe(1.2);
    });

    it('applies threshold multiplier to level requirements', () => {
        const base = 14 + Math.floor(14 * 1 * EXP_CONFIG.linearFactor + Math.pow(1, EXP_CONFIG.powerExponent) * EXP_CONFIG.powerMultiplier);
        expect(calculateExpThreshold(1, 14)).toBe(Math.floor(base * EXP_CONFIG.thresholdMultiplier));
    });
});
