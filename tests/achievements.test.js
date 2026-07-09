import { describe, it, expect } from 'vitest';
import {
    ACHIEVEMENTS,
    ACHIEVEMENT_TARGET_COUNT,
    COMBO_ACHIEVEMENT_LIMITS,
    getAchievementCount,
    getAchievementDefinition,
    getAchievementTooltipText
} from '../js/config/achievements.js';
import { createDefaultMeta, evaluateAchievements, getAchievementById } from '../js/systems/metaProgress.js';

describe('achievements catalog', () => {
    it(`defines at least ${ACHIEVEMENT_TARGET_COUNT} achievements`, () => {
        expect(getAchievementCount()).toBeGreaterThanOrEqual(ACHIEVEMENT_TARGET_COUNT);
        expect(ACHIEVEMENTS.length).toBe(getAchievementCount());
    });

    it('gives every achievement a unique id, title, icon, and description', () => {
        const ids = new Set();
        for (const def of ACHIEVEMENTS) {
            expect(def.id).toBeTruthy();
            expect(def.title).toBeTruthy();
            expect(def.description).toBeTruthy();
            expect(def.icon).toBeTruthy();
            expect(typeof def.check).toBe('function');
            expect(ids.has(def.id)).toBe(false);
            ids.add(def.id);
        }
    });

    it('resolves definitions by id from config and meta helpers', () => {
        const sample = ACHIEVEMENTS[0];
        expect(getAchievementDefinition(sample.id)?.title).toBe(sample.title);
        expect(getAchievementById(sample.id)?.id).toBe(sample.id);
    });

    it('shows description only in hover tooltip text', () => {
        const sample = ACHIEVEMENTS[0];
        expect(getAchievementTooltipText(sample)).toBe(sample.description);
        expect(getAchievementTooltipText(sample)).not.toMatch(/^Completed/i);
        expect(getAchievementTooltipText(sample)).not.toMatch(/^How to unlock/i);
    });

    it('unlocks multiple achievements when context qualifies', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 100,
            level: 10,
            elapsedSeconds: 300,
            bestStreak: 25,
            treasuresOpened: 5,
            itemsLooted: 20,
            equippedRareCount: 1,
            equippedUniqueCount: 0,
            equippedGearCount: 7,
            currentWave: 12,
            maxWaveReached: 12,
            skillLevelSum: 5,
            skillsAtMax: 1,
            elitesKilled: 1,
            bossesKilled: 1
        });
        expect(unlocked).toContain('first_blood');
        expect(unlocked).toContain('slayer_100');
        expect(unlocked).toContain('level_10');
        expect(unlocked).toContain('survive_5m');
        expect(unlocked).toContain('streak_25');
        expect(unlocked).toContain('treasure_5');
        expect(unlocked).toContain('loot_20');
        expect(unlocked).toContain('gear_full');
        expect(unlocked).toContain('wave_12');
        expect(meta.unlockedAchievements.length).toBe(unlocked.length);
    });

    it('keeps time-gated combo achievements challenging after swarm unlock', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 200,
            level: 10,
            elapsedSeconds: 301, // past 5-min blitz window
            bestStreak: 15,
            treasuresOpened: 3,
            itemsLooted: 10,
            equippedRareCount: 0,
            equippedUniqueCount: 0,
            equippedGearCount: 0,
            currentWave: 12,
            maxWaveReached: 12,
            skillLevelSum: 0,
            skillsAtMax: 0,
            elitesKilled: 0,
            bossesKilled: 0
        });
        expect(unlocked).not.toContain('combo_slayer_time');
        expect(unlocked).not.toContain('combo_speed');
        expect(unlocked).not.toContain('combo_blitz');
        expect(unlocked).not.toContain('combo_kills_wave');
    });

    it('includes new stat milestones and roster victories', () => {
        const ids = ACHIEVEMENTS.map(a => a.id);
        expect(ids).toContain('slayer_10000');
        expect(ids).toContain('hp_5000');
        expect(ids).toContain('hp_10000');
        expect(ids).toContain('crit_100');
        expect(ids).toContain('crit_dmg_500');
        expect(ids).toContain('regen_1000');
        expect(ids).toContain('damage_3000');
        expect(ids).toContain('victory_trio');
        expect(ids).toContain('victory_full_roster');
        expect(ids).toContain('wave_100_champion');
        expect(ids).not.toContain('skill_15');
        expect(ids).not.toContain('skill_30');
        expect(ids).not.toContain('skill_max_1');
        expect(ids).not.toContain('skill_max_3');
        expect(ids).not.toContain('treasure_10');
    });

    it('unlocks arena champion when final boss is defeated', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 1, level: 1, elapsedSeconds: 1980,
            bestStreak: 0, treasuresOpened: 0, itemsLooted: 0,
            equippedRareCount: 0, equippedGearCount: 0,
            finalVictoryAchieved: true
        });
        expect(unlocked).toContain('wave_100_champion');
    });

    it('unlocks hp milestone when max HP reaches threshold', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 0, level: 1, elapsedSeconds: 0,
            bestStreak: 0, treasuresOpened: 0, itemsLooted: 0,
            equippedRareCount: 0, equippedGearCount: 0,
            maxHpReached: 5000
        });
        expect(unlocked).toContain('hp_5000');
    });

    it('unlocks trio victory when three characters beat the game', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 0, level: 1, elapsedSeconds: 0,
            bestStreak: 0, treasuresOpened: 0, itemsLooted: 0,
            equippedRareCount: 0, equippedGearCount: 0,
            charactersBeatGame: 3
        });
        expect(unlocked).toContain('victory_trio');
    });

    it('unlocks rebalanced killer and blitz combos at intended bars', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: COMBO_ACHIEVEMENT_LIMITS.slayerTimeKills,
            level: 20,
            elapsedSeconds: COMBO_ACHIEVEMENT_LIMITS.blitzMaxSeconds - 1,
            bestStreak: 40,
            treasuresOpened: 5,
            itemsLooted: 20,
            equippedRareCount: 1,
            equippedUniqueCount: 0,
            equippedGearCount: 7,
            currentWave: COMBO_ACHIEVEMENT_LIMITS.speedMinWave,
            maxWaveReached: COMBO_ACHIEVEMENT_LIMITS.speedMinWave,
            skillLevelSum: 10,
            skillsAtMax: 1,
            elitesKilled: 2,
            bossesKilled: 1
        });
        expect(unlocked).toContain('combo_blitz');
        expect(unlocked).toContain('combo_slayer_time');
        expect(unlocked).toContain('combo_speed');
    });
});
