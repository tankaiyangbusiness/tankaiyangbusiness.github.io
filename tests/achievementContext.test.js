import { describe, it, expect } from 'vitest';
import {
    trackRunStatPeaks,
    buildAchievementContext,
    reconcileMetaAchievements
} from '../js/systems/achievementContext.js';
import { createDefaultMeta, markCharacterVictory, evaluateAchievements } from '../js/systems/metaProgress.js';
import { STAT_ACHIEVEMENT_THRESHOLDS } from '../js/config/achievements.js';

function makeState(overrides = {}) {
    return {
        killCount: 0,
        elapsedSeconds: 0,
        currentWave: 1,
        maxWaveReached: 1,
        itemsLooted: 0,
        elitesKilled: 0,
        bossesKilled: 0,
        finalVictoryAchieved: false,
        skillList: {},
        stats: {
            level: 1,
            maxHp: 100,
            critChance: 5,
            critMultiplier: 150,
            hpRegen: 3,
            physicalDamage: 30
        },
        ...overrides
    };
}

describe('achievementContext', () => {
    it('tracks peak stats across the run', () => {
        const state = makeState();
        state.stats.maxHp = 1200;
        trackRunStatPeaks(state);
        state.stats.critChance = 42;
        state.stats.physicalDamage = 2500;
        trackRunStatPeaks(state);

        expect(state.runStatPeaks.maxHp).toBe(1200);
        expect(state.runStatPeaks.critChance).toBe(42);
        expect(state.runStatPeaks.physicalDamage).toBe(2500);
        expect(state.maxHpReached).toBe(1200);
    });

    it('builds run context with stat peaks and meta roster count', () => {
        const meta = createDefaultMeta();
        markCharacterVictory(meta, 'Warrior');
        markCharacterVictory(meta, 'Ranger');
        const state = makeState({ killCount: 12 });
        state.stats.critChance = 105;
        state.stats.critMultiplier = 520;
        state.stats.hpRegen = 1100;
        state.stats.physicalDamage = 3100;

        const ctx = buildAchievementContext({
            state,
            killStreak: { bestStreak: 8 },
            treasureEvents: { treasuresOpened: 2 },
            gearInventory: { equipped: {}, getEquippedCount: () => 0 },
            meta
        });

        expect(ctx.killCount).toBe(12);
        expect(ctx.critChanceReached).toBe(105);
        expect(ctx.critMultiplierReached).toBe(520);
        expect(ctx.hpRegenReached).toBe(1100);
        expect(ctx.physicalDamageReached).toBe(3100);
        expect(ctx.charactersBeatGame).toBe(2);
    });

    it('unlocks trio victory from saved meta on reconcile', () => {
        const meta = createDefaultMeta();
        markCharacterVictory(meta, 'Warrior');
        markCharacterVictory(meta, 'Ranger');
        markCharacterVictory(meta, 'Assassin');

        const unlocked = reconcileMetaAchievements(meta);
        expect(unlocked).toContain('victory_trio');
    });

    it('unlocks stat milestone achievements from peak context', () => {
        const meta = createDefaultMeta();
        const statCtx = buildAchievementContext({
            state: makeState({
                stats: {
                    level: 50,
                    maxHp: STAT_ACHIEVEMENT_THRESHOLDS.maxHp,
                    critChance: STAT_ACHIEVEMENT_THRESHOLDS.critChance,
                    critMultiplier: STAT_ACHIEVEMENT_THRESHOLDS.critMultiplier,
                    hpRegen: STAT_ACHIEVEMENT_THRESHOLDS.hpRegen,
                    physicalDamage: STAT_ACHIEVEMENT_THRESHOLDS.physicalDamage
                }
            }),
            killStreak: { bestStreak: 0 },
            treasureEvents: { treasuresOpened: 0 },
            gearInventory: { equipped: {}, getEquippedCount: () => 0 },
            meta
        });

        const unlocked = evaluateAchievements(meta, statCtx);
        expect(unlocked).toContain('hp_10000');
        expect(unlocked).toContain('crit_100');
        expect(unlocked).toContain('crit_dmg_500');
        expect(unlocked).toContain('regen_1000');
        expect(unlocked).toContain('damage_3000');
    });
});
