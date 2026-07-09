import { describe, it, expect } from 'vitest';
import {
    FINAL_VICTORY_WAVE,
    FINAL_BOSS_MULT,
    applyFinalBossCombatScaling,
    findLivingFinalVictoryBoss,
    isCampaignVictoryAchieved
} from '../js/config/victory.js';
import { isBossWave } from '../js/config/bossWaves.js';
import { isMidpointVictoryWave, isMilestoneBossWave } from '../js/config/milestoneBosses.js';

describe('victory objective', () => {
    it('targets wave 100 as the campaign finale', () => {
        expect(FINAL_VICTORY_WAVE).toBe(100);
        expect(isBossWave(100)).toBe(true);
        expect(isMidpointVictoryWave(50)).toBe(true);
        expect(isMilestoneBossWave(25)).toBe(true);
        expect(isMilestoneBossWave(75)).toBe(true);
    });

    it('scales the final boss to 50× HP and boosted damage/armour', () => {
        const stats = { hp: 500, maxHp: 500, physicalDamage: 40, armour: 8 };
        applyFinalBossCombatScaling(stats, 100);
        expect(stats.hp).toBe(500 * FINAL_BOSS_MULT.hpVsBoss);
        expect(stats.maxHp).toBe(stats.hp);
        expect(stats.physicalDamage).toBe(Math.floor(40 * FINAL_BOSS_MULT.damage));
        expect(stats.armour).toBe(Math.floor(8 * FINAL_BOSS_MULT.armour));
    });

    it('finds a living final victory boss among enemies', () => {
        const enemies = [
            { id: 'a', milestoneBossWave: 100, isFinalVictoryBoss: true, stats: { hp: 0 } },
            { id: 'b', milestoneBossWave: 100, isFinalVictoryBoss: true, stats: { hp: 12 } }
        ];
        expect(findLivingFinalVictoryBoss(enemies)?.id).toBe('b');
    });

    it('does not count reaching wave 101 without killing the final boss as victory', () => {
        const state = {
            currentWave: 101,
            maxWaveReached: 101,
            finalVictoryAchieved: false
        };
        expect(isCampaignVictoryAchieved(state.finalVictoryAchieved)).toBe(false);
        expect(state.currentWave).toBeGreaterThan(FINAL_VICTORY_WAVE);
    });

    it('counts victory only after the Wave 100 boss is defeated', () => {
        expect(isCampaignVictoryAchieved(true)).toBe(true);
        expect(isCampaignVictoryAchieved(false)).toBe(false);
    });
});
