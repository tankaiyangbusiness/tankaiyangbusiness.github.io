/**
 * Player EXP curve — tuned alongside BALANCE for ~20 min average sessions.
 */
import { BALANCE } from './balance.js';

export const EXP_CONFIG = {
    baseThreshold: 14,
    linearFactor: 0.55,
    powerExponent: 1.85,
    powerMultiplier: 1.5,
    /**
     * Kill EXP = enemy.stats.exp × grantRatio × playerExpGain × streak.
     * 1.0 grants the full enemy exp stat (no hidden 10% tax).
     */
    enemyExpGrantRatio: 1.0,
    /** Early-wave minimum kill EXP by enemy category (waves 1–12). */
    earlyWaveKillExp: {
        standard: 2,
        swarm: 1
    },
    /** Additional reduction on swarm/split-fragment kill payout. */
    swarmKillMultiplier: 0.55,
    thresholdMultiplier: 1.2,
    goldPerExp: 0.45,
    streakBonusCap: 0.22,
    streakBonusPerKill: 0.018
};

/**
 * Wave-tier kill EXP modifiers — multiplicative, no global runtime multiplier.
 * Baseline −5%; after wave 50 another −5%; after wave 100 another −10%.
 */
export const EXP_KILL_WAVE_MODIFIERS = {
    baseline: 0.95,
    afterWave50: { thresholdWave: 50, multiplier: 0.95 },
    afterWave100: { thresholdWave: 100, multiplier: 0.90 }
};

/**
 * Combined EXP payout multiplier from wave progression.
 * @param {number} waveIndex 0-based difficulty index (wave 1 → index 0)
 * @returns {number}
 */
export function getExpKillWaveMultiplier(waveIndex = 0) {
    const wave = Math.max(1, Math.floor(waveIndex) + 1);
    let mult = EXP_KILL_WAVE_MODIFIERS.baseline;
    if (wave > EXP_KILL_WAVE_MODIFIERS.afterWave50.thresholdWave) {
        mult *= EXP_KILL_WAVE_MODIFIERS.afterWave50.multiplier;
    }
    if (wave > EXP_KILL_WAVE_MODIFIERS.afterWave100.thresholdWave) {
        mult *= EXP_KILL_WAVE_MODIFIERS.afterWave100.multiplier;
    }
    return mult;
}

/** @deprecated Use enemyExpGrantRatio */
export const enemyExpMultiplier = EXP_CONFIG.enemyExpGrantRatio;

/** @param {number} level @param {number} baseThreshold */
export function calculateExpThreshold(level, baseThreshold) {
    const b = baseThreshold ?? EXP_CONFIG.baseThreshold;
    const raw = b + Math.floor(
        b * level * EXP_CONFIG.linearFactor +
        Math.pow(level, EXP_CONFIG.powerExponent) * EXP_CONFIG.powerMultiplier
    );
    return Math.floor(raw * EXP_CONFIG.thresholdMultiplier);
}

/** Total EXP required to reach `targetLevel` from level 1. */
export function totalExpToReachLevel(targetLevel, baseThreshold = EXP_CONFIG.baseThreshold) {
    let total = 0;
    for (let level = 1; level < targetLevel; level++) {
        total += calculateExpThreshold(level, baseThreshold);
    }
    return total;
}

/**
 * @param {number} enemyExp — value from enemy.stats.exp
 * @param {number} expGain — player expGain stat
 * @param {number} [streakBonus]
 * @param {{ waveIndex?: number, enemyType?: string }} [context]
 */
export function calculateExpFromKill(enemyExp, expGain, streakBonus = 0, context = {}) {
    const { waveIndex = 0, enemyType = 'grunt' } = context;
    const isSwarmLike = enemyType === 'swarm' || enemyType === 'splitFragment';

    let gained = Math.floor(
        enemyExp * EXP_CONFIG.enemyExpGrantRatio * expGain * (1 + streakBonus)
    );
    gained = Math.max(1, gained);

    if (isSwarmLike) {
        gained = Math.max(1, Math.floor(gained * EXP_CONFIG.swarmKillMultiplier));
    }

    gained = Math.max(1, Math.floor(gained * getExpKillWaveMultiplier(waveIndex)));

    if (waveIndex < BALANCE.earlyWaveCap) {
        if (isSwarmLike) {
            gained = Math.min(gained, EXP_CONFIG.earlyWaveKillExp.swarm);
        } else {
            gained = Math.max(EXP_CONFIG.earlyWaveKillExp.standard, gained);
        }
    }

    return gained;
}

/** @param {number} expGained */
export function calculateGoldFromKill(expGained) {
    return Math.max(1, Math.floor(expGained * EXP_CONFIG.goldPerExp));
}

/**
 * Ensures enemy.stats.exp reflects intended kill value before grant ratio is applied.
 * @param {number} exp
 * @param {string} enemyType
 * @param {number} difficultyIndex 0-based wave index
 */
export function finalizeEnemyExpStat(exp, enemyType, difficultyIndex) {
    const value = Math.max(1, Math.floor(exp));
    if (difficultyIndex >= BALANCE.earlyWaveCap) return value;

    const isSwarmLike = enemyType === 'swarm' || enemyType === 'splitFragment';
    if (isSwarmLike) {
        return Math.max(1, Math.min(value, EXP_CONFIG.earlyWaveKillExp.swarm));
    }
    return Math.max(EXP_CONFIG.earlyWaveKillExp.standard, value);
}
