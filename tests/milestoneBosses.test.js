import { describe, it, expect } from 'vitest';
import {
    MINI_BOSS_WAVES,
    MINI_BOSS_HP_MULT,
    MIDPOINT_VICTORY_WAVE,
    FINAL_VICTORY_WAVE,
    TRACKED_BOSS_WAVES,
    MIDPOINT_BOSS_HP_MULT,
    FINAL_BOSS_HP_MULT,
    MILESTONE_BOSS_SPAWN_OPTS,
    applyMilestoneBossCombatScaling,
    findLivingMilestoneBoss,
    findLivingFinalVictoryBoss,
    isMiniBossWave,
    isMidpointVictoryWave,
    isMilestoneBossWave,
    isMilestoneBossEnemy,
    isCampaignVictoryAchieved,
    milestoneBossGuaranteesUniqueLoot,
    BOSS_WAVE_PROFILES,
    BOSS_HP_BY_WAVE,
    getBossHpMultiplier,
    rollBossArmyCount
} from '../js/config/milestoneBosses.js';
import { isBossWave } from '../js/config/bossWaves.js';

describe('milestoneBosses', () => {
    it('defines tracked boss waves 25, 50, 75, and 100', () => {
        expect(TRACKED_BOSS_WAVES).toEqual([25, 50, 75, 100]);
        expect(MINI_BOSS_WAVES).toEqual([25, 75]);
        expect(isMiniBossWave(25)).toBe(true);
        expect(isMiniBossWave(75)).toBe(true);
        expect(isMiniBossWave(50)).toBe(false);
        expect(isMidpointVictoryWave(50)).toBe(true);
        expect(isMilestoneBossWave(25)).toBe(true);
        expect(isMilestoneBossWave(75)).toBe(true);
        expect(isMilestoneBossWave(50)).toBe(true);
        expect(isMilestoneBossWave(100)).toBe(true);
        expect(isBossWave(50)).toBe(true);
        expect(isBossWave(100)).toBe(true);
        expect(isBossWave(25)).toBe(false);
        expect(isBossWave(75)).toBe(false);
    });

    it('Wave 50 escort army totals at least 50 enemies', () => {
        const army = BOSS_WAVE_PROFILES[50].army;
        const minTotal = army.swarmMin + army.gruntMin + army.eliteMin;
        expect(minTotal).toBeGreaterThanOrEqual(50);
    });

    it('scales mini bosses to 10× HP, Wave 50 to 30×, and final boss to 50×', () => {
        const mini = { hp: 500, maxHp: 500, physicalDamage: 40, armour: 8 };
        applyMilestoneBossCombatScaling(mini, 25);
        expect(mini.hp).toBe(500 * MINI_BOSS_HP_MULT);

        const midpoint = { hp: 500, maxHp: 500, physicalDamage: 40, armour: 8 };
        applyMilestoneBossCombatScaling(midpoint, 50);
        expect(midpoint.hp).toBe(500 * MIDPOINT_BOSS_HP_MULT);

        const finalBoss = { hp: 500, maxHp: 500, physicalDamage: 40, armour: 8 };
        applyMilestoneBossCombatScaling(finalBoss, 100);
        expect(finalBoss.hp).toBe(500 * FINAL_BOSS_HP_MULT);
        expect(finalBoss.maxHp).toBe(finalBoss.hp);
        expect(finalBoss.physicalDamage).toBeGreaterThan(40);
        expect(finalBoss.armour).toBeGreaterThan(8);
    });

    it('lists HP multipliers for every tracked boss wave', () => {
        expect(BOSS_HP_BY_WAVE[25]).toBe(10);
        expect(BOSS_HP_BY_WAVE[50]).toBe(30);
        expect(BOSS_HP_BY_WAVE[75]).toBe(10);
        expect(BOSS_HP_BY_WAVE[100]).toBe(50);
        expect(getBossHpMultiplier(25)).toBe(10);
        expect(getBossHpMultiplier(50)).toBe(30);
        expect(getBossHpMultiplier(100)).toBe(50);
    });

    it('finds the highest-priority living milestone boss', () => {
        const enemies = [
            { id: 'mini25', milestoneBossWave: 25, stats: { hp: 20 } },
            { id: 'mid', milestoneBossWave: 50, stats: { hp: 10 } },
            { id: 'final', milestoneBossWave: 100, stats: { hp: 5 } }
        ];
        expect(findLivingMilestoneBoss(enemies)?.id).toBe('final');
        expect(findLivingFinalVictoryBoss(enemies)?.id).toBe('final');
    });

    it('prioritizes Wave 75 over Wave 50 when Final Boss is dead', () => {
        const enemies = [
            { id: 'mid', milestoneBossWave: 50, stats: { hp: 10 } },
            { id: 'mini75', milestoneBossWave: 75, stats: { hp: 8 } }
        ];
        expect(findLivingMilestoneBoss(enemies)?.id).toBe('mini75');
    });

    it('ignores dead milestone bosses', () => {
        const enemies = [
            { id: 'dead', milestoneBossWave: 100, stats: { hp: 0 } },
            { id: 'live', milestoneBossWave: 50, stats: { hp: 12 } }
        ];
        expect(findLivingMilestoneBoss(enemies)?.id).toBe('live');
    });

    it('requires bypassCap spawn policy so bosses spawn when arena is full', () => {
        expect(MILESTONE_BOSS_SPAWN_OPTS.bypassCap).toBe(true);
        expect(MILESTONE_BOSS_SPAWN_OPTS.skipGroup).toBe(true);
    });

    it('identifies milestone boss enemies', () => {
        expect(isMilestoneBossEnemy({ milestoneBossWave: 25 })).toBe(true);
        expect(isMilestoneBossEnemy({ milestoneBossWave: 50 })).toBe(true);
        expect(isMilestoneBossEnemy({})).toBe(false);
    });

    it('rolls army counts within profile bounds', () => {
        for (let i = 0; i < 10; i++) {
            const swarm = rollBossArmyCount(25, 'swarm');
            expect(swarm).toBeGreaterThanOrEqual(BOSS_WAVE_PROFILES[25].army.swarmMin);
            expect(swarm).toBeLessThanOrEqual(BOSS_WAVE_PROFILES[25].army.swarmMax);
        }
    });

    it('campaign victory requires defeating the Wave 100 boss', () => {
        expect(isCampaignVictoryAchieved(false)).toBe(false);
        expect(isCampaignVictoryAchieved(true)).toBe(true);
    });

    it('guarantees unique loot on all tracked boss waves', () => {
        for (const wave of TRACKED_BOSS_WAVES) {
            expect(BOSS_WAVE_PROFILES[wave].guaranteesUniqueLoot).toBe(true);
            expect(milestoneBossGuaranteesUniqueLoot(wave)).toBe(true);
        }
        expect(milestoneBossGuaranteesUniqueLoot(24)).toBe(false);
    });
});
