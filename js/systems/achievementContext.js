/**
 * Builds the achievement evaluation context from live run state and saved meta.
 * Keeps peak-stat tracking in one place for future achievement additions.
 */
import { evaluateAchievements, countCharactersBeatGame } from './metaProgress.js';

/** @typedef {import('../config/achievements.js').AchievementContext} AchievementContext */

/**
 * @param {import('../game/gameState.js').GameState} state
 */
export function trackRunStatPeaks(state) {
    if (!state?.stats) return;
    if (!state.runStatPeaks) {
        state.runStatPeaks = createEmptyRunStatPeaks();
    }
    const st = state.stats;
    const peaks = state.runStatPeaks;
    peaks.maxHp = Math.max(peaks.maxHp, st.maxHp || 0);
    peaks.critChance = Math.max(peaks.critChance, st.critChance || 0);
    peaks.critMultiplier = Math.max(peaks.critMultiplier, st.critMultiplier || 0);
    peaks.hpRegen = Math.max(peaks.hpRegen, st.hpRegen || 0);
    peaks.physicalDamage = Math.max(peaks.physicalDamage, st.physicalDamage || 0);
    if (peaks.maxHp > (state.maxHpReached || 0)) {
        state.maxHpReached = peaks.maxHp;
    }
}

/** @returns {{ maxHp: number, critChance: number, critMultiplier: number, hpRegen: number, physicalDamage: number }} */
export function createEmptyRunStatPeaks() {
    return {
        maxHp: 0,
        critChance: 0,
        critMultiplier: 0,
        hpRegen: 0,
        physicalDamage: 0
    };
}

/**
 * @param {object} params
 * @param {import('../game/gameState.js').GameState} params.state
 * @param {{ bestStreak?: number }} [params.killStreak]
 * @param {{ treasuresOpened?: number }} [params.treasureEvents]
 * @param {{ equipped?: object, getEquippedCount?: () => number }} [params.gearInventory]
 * @param {ReturnType<import('./metaProgress.js').createDefaultMeta>} params.meta
 * @returns {AchievementContext}
 */
export function buildAchievementContext({ state, killStreak, treasureEvents, gearInventory, meta }) {
    trackRunStatPeaks(state);
    const peaks = state.runStatPeaks ?? createEmptyRunStatPeaks();
    const equipped = gearInventory?.equipped || {};
    const equippedValues = Object.values(equipped).filter(Boolean);
    const skillEntries = Object.values(state.skillList || {});

    return {
        killCount: state.killCount,
        level: state.stats?.level ?? 0,
        elapsedSeconds: state.elapsedSeconds,
        bestStreak: killStreak?.bestStreak ?? 0,
        treasuresOpened: treasureEvents?.treasuresOpened ?? 0,
        itemsLooted: state.itemsLooted ?? 0,
        equippedRareCount: equippedValues.filter(i => i.rarity === 'rare' || i.rarity === 'unique').length,
        equippedUniqueCount: equippedValues.filter(i => i.rarity === 'unique').length,
        equippedGearCount: gearInventory?.getEquippedCount?.() ?? 0,
        currentWave: state.currentWave,
        maxWaveReached: state.maxWaveReached ?? state.currentWave,
        skillLevelSum: skillEntries.reduce((sum, sk) => sum + (sk?.level || 0), 0),
        skillsAtMax: skillEntries.filter(sk => sk && sk.level >= (sk.maxLevel || 5)).length,
        elitesKilled: state.elitesKilled ?? 0,
        bossesKilled: state.bossesKilled ?? 0,
        maxHpReached: peaks.maxHp,
        maxHp: state.stats?.maxHp ?? 0,
        critChanceReached: peaks.critChance,
        critMultiplierReached: peaks.critMultiplier,
        hpRegenReached: peaks.hpRegen,
        physicalDamageReached: peaks.physicalDamage,
        charactersBeatGame: countCharactersBeatGame(meta),
        finalVictoryAchieved: Boolean(state.finalVictoryAchieved)
    };
}

/**
 * Unlock achievements that depend only on saved meta (e.g. roster victories).
 * @param {ReturnType<import('./metaProgress.js').createDefaultMeta>} meta
 * @returns {string[]}
 */
export function reconcileMetaAchievements(meta) {
    return evaluateAchievements(meta, buildMetaOnlyAchievementContext(meta));
}

/**
 * Context for achievements that only depend on saved meta (no active run).
 * @param {ReturnType<import('./metaProgress.js').createDefaultMeta>} meta
 * @returns {AchievementContext}
 */
export function buildMetaOnlyAchievementContext(meta) {
    return {
        killCount: 0,
        level: 0,
        elapsedSeconds: 0,
        bestStreak: 0,
        treasuresOpened: 0,
        itemsLooted: 0,
        equippedRareCount: 0,
        equippedGearCount: 0,
        charactersBeatGame: countCharactersBeatGame(meta),
        finalVictoryAchieved: false
    };
}
