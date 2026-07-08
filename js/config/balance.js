/**
 * Centralized difficulty & spawn tuning.
 * Target: ~20 minute average survival before death at moderate skill.
 */
export const SURVIVAL_TARGET_MINUTES = 20;

export const BALANCE = {
    /** Seconds before difficulty tier increases — slower ramp for longer runs */
    difficultyIntervalSec: 20,

    /** Extended warmup — gentler first ~3 minutes */
    warmupSeconds: 180,
    warmupSpawnMultiplier: 0.30,

    maxEnemiesOnScreen: 70,

    /** Enemy damage reduced through early waves (0–11) */
    earlyWaveCap: 12,
    earlyWaveDamageMultiplier: 0.50,
    /** Early-wave HP reduction (−30% through wave 11) */
    earlyWaveHpMultiplier: 0.70,
    /** Early-wave EXP bonus (+50% through wave 11) */
    earlyWaveExpMultiplier: 1.50,

    spawnsPerMinute: {
        normal: 27.5,
        rare: 10.5,
        elite: 2.2,
        boss: 0.65
    },

    spawnScaling: {
        normal: 2.6,
        rare: 1.2,
        elite: 0.45,
        boss: 0.035
    },

    maxDifficultyForSpawn: 300,

    enemyHpScale: 0.60,
    /** Tuned down for ~20 min average survival */
    enemyDamageScale: 0.55,
    /** +10% exp vs prior patch (0.842 × 1.1) */
    enemyExpScale: 0.926,

    playerPressure: {
        moveSpeedPerTier: 0.008,
        moveSpeedCap: 1.28
    }
};

/** @param {keyof BALANCE.spawnsPerMinute} category @param {number} difficulty */
export function getSpawnIntervalMs(category, difficulty) {
    const cap = Math.min(difficulty, BALANCE.maxDifficultyForSpawn);
    const base = BALANCE.spawnsPerMinute[category];
    const scale = BALANCE.spawnScaling[category];
    const rate = base + scale * cap;
    return 1000 * 60 / rate;
}

/** @param {number} stat @param {'hp'|'damage'|'exp'} type */
export function applyBalanceScale(stat, type) {
    if (type === 'hp') return Math.floor(stat * BALANCE.enemyHpScale);
    if (type === 'damage') return Math.floor(stat * BALANCE.enemyDamageScale);
    return Math.floor(stat * BALANCE.enemyExpScale);
}

/** @param {number} baseMoveSpeed @param {number} difficulty */
export function applyEnemyMovePressure(baseMoveSpeed, difficulty) {
    const bonus = Math.min(
        BALANCE.playerPressure.moveSpeedCap,
        1 + difficulty * BALANCE.playerPressure.moveSpeedPerTier
    );
    return baseMoveSpeed * bonus;
}

/** @param {number} damage @param {number} difficultyWave */
export function applyEarlyWaveDamageReduction(damage, difficultyWave) {
    if (difficultyWave >= BALANCE.earlyWaveCap) return damage;
    return Math.max(1, Math.floor(damage * BALANCE.earlyWaveDamageMultiplier));
}

/** @param {number} hp @param {number} difficultyWave */
export function applyEarlyWaveHpReduction(hp, difficultyWave) {
    if (difficultyWave >= BALANCE.earlyWaveCap) return hp;
    return Math.max(1, Math.floor(hp * BALANCE.earlyWaveHpMultiplier));
}

/** @param {number} exp @param {number} difficultyWave */
export function applyEarlyWaveExpBonus(exp, difficultyWave) {
    if (difficultyWave >= BALANCE.earlyWaveCap) return exp;
    return Math.max(1, Math.floor(exp * BALANCE.earlyWaveExpMultiplier));
}
