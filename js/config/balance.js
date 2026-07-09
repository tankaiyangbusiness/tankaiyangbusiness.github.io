/**
 * Centralized difficulty & spawn tuning.
 * Target: ~20 minute average survival before death at moderate skill.
 */
export const SURVIVAL_TARGET_MINUTES = 20;

export const BALANCE = {
    /** Seconds before difficulty tier increases — slower ramp for longer runs */
    /** 12s per wave → wave 100 at 20 minutes (1200s). */
    difficultyIntervalSec: 12,

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

    spawnsPerMinute: {
        normal: 22.5,
        rare: 8.625,
        elite: 1.8,
        boss: 0.525
    },

    spawnScaling: {
        normal: 2.9,
        rare: 1.35,
        elite: 0.5,
        boss: 0.04
    },

    maxDifficultyForSpawn: 300,

    /** Enemy HP scale — tuned with BASE_ENEMY_STATS.hp. */
    enemyHpScale: 0.52,
    /** Direct damage scale (includes prior global −19% folded in). */
    enemyDamageScale: 0.62261,
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
    },

    /**
     * Fewer ambient spawns during the mid-campaign (waves 6–49) to reduce clutter
     * before the Wave 50 milestone.
     */
    midCampaignSpawnReduction: {
        afterWave: 5,
        beforeWave: 50,
        multiplier: 0.51
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

/**
 * Ambient spawn density by wave — reduced between waves 6 and 49 (exclusive bounds).
 * @param {number} currentWave 1-based
 * @returns {number} multiplier in (0, 1]
 */
export function getWaveSpawnDensityMultiplier(currentWave) {
    const cfg = BALANCE.midCampaignSpawnReduction;
    if (!cfg) return 1;
    if (currentWave > cfg.afterWave && currentWave < cfg.beforeWave) {
        return cfg.multiplier;
    }
    return 1;
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
 * @param {number} wave 1-based
 * @returns {number}
 * @deprecated Wave milestone combat boosts removed — always 0 stacks.
 */
export function getWaveStatBoostStacks(wave) {
    void wave;
    return 0;
}

/**
 * @param {object} stats
 * @param {number} wave 1-based
 * @deprecated No-op — wave milestone boosts removed.
 */
export function applyWaveStatBoost(stats, wave) {
    void wave;
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

/** Global −25% starting HP regen; Healer receives an additional +10% on the reduced value. */
export const CHARACTER_REGEN_BALANCE = {
    globalMultiplier: 0.75,
    healerBonus: 1.10
};

/**
 * @param {number} hpRegen Base character regen before balance.
 * @param {string} characterName
 * @returns {number}
 */
export function balanceCharacterHpRegen(hpRegen, characterName) {
    let value = hpRegen * CHARACTER_REGEN_BALANCE.globalMultiplier;
    if (characterName === 'Healer') {
        value *= CHARACTER_REGEN_BALANCE.healerBonus;
    }
    return Math.max(0, Math.round(value * 100) / 100);
}
