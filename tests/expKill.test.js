import { describe, it, expect } from 'vitest';
import {
    EXP_CONFIG,
    calculateExpFromKill,
    finalizeEnemyExpStat
} from '../js/config/expProgression.js';
import { buildEnemyStats } from '../js/config/enemies.js';

describe('calculateExpFromKill', () => {
    it('grants at least 2 exp for standard enemies in early waves', () => {
        const gained = calculateExpFromKill(2, 1, 0, { waveIndex: 0, enemyType: 'grunt' });
        expect(gained).toBe(2);
    });

    it('grants only 1 exp for swarm in early waves', () => {
        const gained = calculateExpFromKill(3, 1, 0, { waveIndex: 0, enemyType: 'swarm' });
        expect(gained).toBe(1);
    });

    it('uses full enemy exp stat with grant ratio 1.0', () => {
        expect(calculateExpFromKill(5, 1, 0, { waveIndex: 20, enemyType: 'grunt' })).toBe(5);
    });
});

describe('finalizeEnemyExpStat', () => {
    it('ensures early grunt exp stat is at least 2', () => {
        expect(finalizeEnemyExpStat(1, 'grunt', 0)).toBe(2);
    });

    it('caps early swarm exp stat at 1', () => {
        expect(finalizeEnemyExpStat(4, 'swarm', 0)).toBe(1);
    });
});

describe('buildEnemyStats early exp', () => {
    it('gives grunt 2 exp and swarm 1 exp on wave 1', () => {
        const grunt = buildEnemyStats('grunt', 'normal', 0);
        const swarm = buildEnemyStats('swarm', 'normal', 0);
        expect(grunt.stats.exp).toBeGreaterThanOrEqual(2);
        expect(swarm.stats.exp).toBeLessThanOrEqual(1);
    });
});

describe('EXP_CONFIG', () => {
    it('uses direct grant ratio instead of hidden 10% tax', () => {
        expect(EXP_CONFIG.enemyExpGrantRatio).toBe(1);
    });
});
