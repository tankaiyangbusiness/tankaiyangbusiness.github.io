/**
 * Centralized difficulty & spawn tuning.
 * Target: ~20 minute average survival before death at moderate skill.
 */
export const SURVIVAL_TARGET_MINUTES = 20;

export const BALANCE = {
    /** Seconds before difficulty tier increases — slower ramp for longer runs */
    difficultyIntervalSec: 20,

    /** Extended warmup — gentler first ~3 minutes */
    /**
     * Warmup spawn curve — higher early density, identical asymptote (≥ warmupSeconds → 1.0).
     * Ease-out exponent (< 1) raises early waves without changing late/end-game rates.
     */
    warmupSeconds: 180,
    warmupSpawnMultiplier: 0.52,
    /** Curve power for early ramp: t^k with k&lt;1 → more enemies earlier, still hits 1.0 at end of warmup */
    warmupSpawnEase: 0.62,

    /** Hard cap — raised slightly, still capped to protect FPS/memory */
    maxEnemiesOnScreen: 55,

    /** Enemy damage reduced through early waves (0–11) — HP/EXP only; attack uses enemyAttackTime */
    earlyWaveCap: 12,
    /** @deprecated Wave-based damage reduction — use enemyAttackTime scaling at hit time instead */
    earlyWaveDamageMultiplier: 0.50,

    /**
     * Time-based enemy attack damage curve (uses run elapsedSeconds).
     * 0s: −10% damage → 8min: normal → +10% every 8min thereafter (16m +10%, 24m +20%…).
     */
    enemyAttackTime: {
        earlyPenalty: 0.10,
        normalizeAtSec: 480,
        rampIntervalSec: 480,
        rampStep: 0.10
    },
    /** Early-wave HP reduction (−30% through wave 11) */
    earlyWaveHpMultiplier: 0.70,
    /** Early-wave EXP bonus (+50% through wave 11) */
    earlyWaveExpMultiplier: 1.50,

    /**
     * Every N completed 1-based waves, non-HP / non-moveSpeed combat stats ×(1+bonus).
     * Applied as floor(wave / interval) stacks (waves 12, 24, 36…).
     */
    waveStatBoostInterval: 12,
    waveStatBoostBonus: 0.25,

    spawnsPerMinute: {
        normal: 30,
        rare: 11.5,
        elite: 2.4,
        boss: 0.7
    },

    spawnScaling: {
        normal: 2.9,
        rare: 1.35,
        elite: 0.5,
        boss: 0.04
    },

    maxDifficultyForSpawn: 300,

    enemyHpScale: 0.63,
    /** Prior patch damage scale — starting +20% combat boost is applied separately; +5% global HP patch */
    enemyDamageScale: 0.7686525,
    /** +10% exp vs prior patch (0.842 × 1.1) */
    enemyExpScale: 0.926,

    /**
     * Flat multipliers from the start (not HP / moveSpeed).
     * Damage & attackSpeed +20%; armour +10%. Archer range bumped in ENEMY_TYPES.
     */
    enemyBaseDamageBonus: 1.20,
    enemyBaseAttackSpeedBonus: 1.20,
    enemyBaseArmourBonus: 1.10,

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

/**
 * Multiplier for enemy→player damage by run elapsed time.
 * Linear −10%→0% over first 8 minutes, then +10% per additional 8 minutes.
 * @param {number} elapsedSeconds
 * @returns {number}
 */
export function getEnemyAttackTimeMultiplier(elapsedSeconds) {
    const cfg = BALANCE.enemyAttackTime;
    const t = Math.max(0, Number(elapsedSeconds) || 0);
    const { earlyPenalty, normalizeAtSec, rampIntervalSec, rampStep } = cfg;

    if (t < normalizeAtSec) {
        const progress = t / normalizeAtSec;
        return 1 - earlyPenalty + earlyPenalty * progress;
    }

    const blocksAfterNormalize = Math.floor((t - normalizeAtSec) / rampIntervalSec);
    return 1 + blocksAfterNormalize * rampStep;
}

/**
 * Scale base enemy physical damage for the current run time.
 * @param {number} baseDamage
 * @param {number} elapsedSeconds
 * @returns {number}
 */
export function scaleEnemyAttackDamageForElapsed(baseDamage, elapsedSeconds) {
    const mult = getEnemyAttackTimeMultiplier(elapsedSeconds);
    return Math.max(1, Math.floor(baseDamage * mult + 1e-9));
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

/**
 * Milestone stacks for waves 12, 24, 36… (1-based wave number).
 * @param {number} wave 1-based
 * @returns {number}
 */
export function getWaveStatBoostStacks(wave) {
    const w = Math.max(0, Math.floor(Number(wave) || 0));
    const interval = BALANCE.waveStatBoostInterval || 12;
    return Math.floor(w / interval);
}

/**
 * Multiply non-HP / non-moveSpeed combat stats by milestone bonus.
 * Skips evadeChance (already has its own difficulty curve + soft cap).
 * @param {object} stats
 * @param {number} wave 1-based
 */
export function applyWaveStatBoost(stats, wave) {
    const stacks = getWaveStatBoostStacks(wave);
    if (stacks <= 0 || !stats) return stats;
    const mult = 1 + stacks * (BALANCE.waveStatBoostBonus || 0.25);
    if (typeof stats.physicalDamage === 'number') {
        stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * mult + 1e-9));
    }
    if (typeof stats.armour === 'number') {
        stats.armour = Math.max(0, Math.floor(stats.armour * mult + 1e-9));
    }
    if (typeof stats.attackSpeed === 'number') {
        stats.attackSpeed = Math.max(0.1, Number((stats.attackSpeed * mult).toFixed(3)));
    }
    return stats;
}

/**
 * Baseline combat pressure from run start — damage/AS +20%, armour +10%.
 * Does not touch HP or moveSpeed.
 * @param {object} stats
 */
export function applyEnemyStartingCombatBoost(stats) {
    if (!stats) return stats;
    const dmgMult = BALANCE.enemyBaseDamageBonus || 1.2;
    const asMult = BALANCE.enemyBaseAttackSpeedBonus || 1.2;
    const armMult = BALANCE.enemyBaseArmourBonus || 1.1;
    if (typeof stats.physicalDamage === 'number') {
        stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * dmgMult + 1e-9));
    }
    if (typeof stats.attackSpeed === 'number') {
        stats.attackSpeed = Math.max(0.1, Number((stats.attackSpeed * asMult).toFixed(3)));
    }
    if (typeof stats.armour === 'number' && stats.armour > 0) {
        stats.armour = Math.max(0, Math.floor(stats.armour * armMult + 1e-9));
    }
    return stats;
}
