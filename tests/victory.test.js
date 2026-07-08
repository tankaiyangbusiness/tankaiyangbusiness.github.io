import { describe, it, expect } from 'vitest';
import {
    FINAL_VICTORY_WAVE,
    FINAL_BOSS_MULT,
    isFinalVictoryWave,
    applyFinalBossCombatScaling,
    rollFinalVictorySwarmCount,
    rollFinalVictoryGruntCount,
    rollFinalVictoryEliteCount
} from '../js/config/victory.js';
import { isBossWave } from '../js/config/bossWaves.js';

describe('victory objective', () => {
    it('targets wave 100 as the campaign finale', () => {
        expect(FINAL_VICTORY_WAVE).toBe(100);
        expect(isFinalVictoryWave(100)).toBe(true);
        expect(isFinalVictoryWave(99)).toBe(false);
        expect(isBossWave(100)).toBe(true);
    });

    it('scales the final boss to 20× HP and 2× damage/armour', () => {
        const stats = { hp: 500, maxHp: 500, physicalDamage: 40, armour: 8 };
        applyFinalBossCombatScaling(stats);
        expect(stats.hp).toBe(500 * FINAL_BOSS_MULT.hpVsBoss);
        expect(stats.maxHp).toBe(stats.hp);
        expect(stats.physicalDamage).toBe(40 * FINAL_BOSS_MULT.damage);
        expect(stats.armour).toBe(8 * FINAL_BOSS_MULT.armour);
    });

    it('rolls a large escort army for wave 100', () => {
        for (let i = 0; i < 15; i++) {
            expect(rollFinalVictorySwarmCount()).toBeGreaterThanOrEqual(22);
            expect(rollFinalVictoryGruntCount()).toBeGreaterThanOrEqual(10);
            expect(rollFinalVictoryEliteCount()).toBeGreaterThanOrEqual(5);
        }
    });
});
