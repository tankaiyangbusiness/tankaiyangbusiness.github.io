import { describe, it, expect } from 'vitest';
import {
    getWave100LateGameHpMultiplier,
    getEnemyHpRuntimeMultiplier,
    applyRuntimeEnemyScaling,
    getPostFinalWaveStatMultiplier,
    applyPostFinalWaveStatScaling,
    getFinalVictoryReinforcementIntervalMs,
    getWaveDamageRampMultiplier,
    WAVE_100_HP_RAMP_SECONDS,
    POST_FINAL_WAVE_STAT_STEP,
    WAVE_DAMAGE_RAMP
} from '../js/config/enemyScaling.js';
import { BALANCE } from '../js/config/balance.js';
import { BASE_ENEMY_STATS } from '../js/config/enemies.js';
import { FINAL_VICTORY_WAVE } from '../js/config/milestoneBosses.js';

describe('enemyScaling', () => {
    it('uses tuned base HP and scale constants instead of runtime global HP patches', () => {
        expect(BASE_ENEMY_STATS.hp).toBe(14);
        expect(BALANCE.enemyHpScale).toBeCloseTo(0.52, 3);
        expect(BALANCE.enemyHpGlobalMultiplier).toBeUndefined();
        expect(BALANCE.enemyHpGlobalPatch).toBeUndefined();
        expect(getEnemyHpRuntimeMultiplier(600, 50)).toBe(1);
    });

    it('ramps Wave 100 HP bonus up to +45%', () => {
        const waveStart = (FINAL_VICTORY_WAVE - 1) * BALANCE.difficultyIntervalSec;
        expect(getWave100LateGameHpMultiplier(waveStart, FINAL_VICTORY_WAVE)).toBe(1);
        expect(getWave100LateGameHpMultiplier(
            waveStart + WAVE_100_HP_RAMP_SECONDS,
            FINAL_VICTORY_WAVE
        )).toBeCloseTo(1.45, 2);
    });

    it('scales spawned enemy HP in place during Wave 100 ramp only', () => {
        const waveStart = (FINAL_VICTORY_WAVE - 1) * BALANCE.difficultyIntervalSec;
        const stats = { hp: 100, maxHp: 100, physicalDamage: 20, armour: 4, attackSpeed: 1.2 };
        applyRuntimeEnemyScaling(
            stats,
            waveStart + WAVE_100_HP_RAMP_SECONDS,
            FINAL_VICTORY_WAVE
        );
        expect(stats.hp).toBe(Math.floor(100 * 1.45));
        expect(stats.maxHp).toBe(stats.hp);
        expect(stats.physicalDamage).toBe(Math.floor(20 * 1.25));
    });

    it('ramps damage +25% from wave 50 to 100', () => {
        expect(getWaveDamageRampMultiplier(50)).toBe(1);
        expect(getWaveDamageRampMultiplier(75)).toBeCloseTo(1.125, 3);
        expect(getWaveDamageRampMultiplier(100)).toBeCloseTo(1.25, 3);
        expect(WAVE_DAMAGE_RAMP.totalBonus).toBe(0.25);
    });

    it('applies wave damage ramp on spawn scaling', () => {
        const stats = { hp: 100, maxHp: 100, physicalDamage: 40, armour: 4, attackSpeed: 1.2 };
        applyRuntimeEnemyScaling(stats, 600, 75);
        expect(stats.physicalDamage).toBe(Math.floor(40 * 1.125));
        expect(stats.hp).toBe(100);
    });

    it('adds +30% stats per wave after Wave 100', () => {
        expect(POST_FINAL_WAVE_STAT_STEP).toBe(0.30);
        expect(getPostFinalWaveStatMultiplier(100)).toBe(1);
        expect(getPostFinalWaveStatMultiplier(101)).toBeCloseTo(1.30, 2);
        expect(getPostFinalWaveStatMultiplier(120)).toBeCloseTo(7, 2);
    });

    it('applies post–Wave 100 scaling to combat stats', () => {
        const stats = { hp: 100, maxHp: 100, physicalDamage: 40, armour: 10, attackSpeed: 2 };
        applyPostFinalWaveStatScaling(stats, 120);
        expect(stats.hp).toBe(700);
        expect(stats.physicalDamage).toBe(280);
        expect(stats.armour).toBe(70);
        expect(stats.attackSpeed).toBeCloseTo(14, 2);
    });

    it('speeds up Wave 100 reinforcements as escalation rises', () => {
        const waveStart = (FINAL_VICTORY_WAVE - 1) * BALANCE.difficultyIntervalSec;
        const early = getFinalVictoryReinforcementIntervalMs(waveStart, FINAL_VICTORY_WAVE);
        const late = getFinalVictoryReinforcementIntervalMs(
            waveStart + WAVE_100_HP_RAMP_SECONDS,
            FINAL_VICTORY_WAVE
        );
        expect(late).toBeLessThan(early);
    });
});
