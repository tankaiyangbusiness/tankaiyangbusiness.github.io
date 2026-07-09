/**
 * Runtime enemy scaling — global HP patch, Wave 100 late-game ramp, and post-100 infinite stat growth.
 */
import { BALANCE } from './balance.js';
import { FINAL_VICTORY_WAVE } from './milestoneBosses.js';
import { getWaveNumber } from './waveProgression.js';

/** Seconds into Wave 100 before enemy HP reaches the full +45% late-game bonus. */
export const WAVE_100_HP_RAMP_SECONDS = 180;

/** Maximum extra HP multiplier during Wave 100 (on top of global +15%). */
export const WAVE_100_MAX_LATE_HP_BONUS = 0.45;

/** Per-wave stat increase after Wave 100 (wave 101 → +30%, wave 102 → +60%, …). */
export const POST_FINAL_WAVE_STAT_STEP = 0.30;

/**
 * Mid/late campaign damage ramp — +25% by Wave 100, linear from Wave 50.
 * Tunable curve; applied at spawn via applyRuntimeEnemyScaling.
 */
export const WAVE_DAMAGE_RAMP = {
    startWave: 50,
    endWave: 100,
    totalBonus: 0.25
};

/**
 * Linear damage multiplier from Wave 50 → 100 (+0% → +25%).
 * @param {number} currentWave 1-based wave number
 * @returns {number}
 */
export function getWaveDamageRampMultiplier(currentWave) {
    const { startWave, endWave, totalBonus } = WAVE_DAMAGE_RAMP;
    if (currentWave <= startWave) return 1;
    if (currentWave >= endWave) return 1 + totalBonus;
    const progress = (currentWave - startWave) / (endWave - startWave);
    return 1 + totalBonus * progress;
}

/**
 * Wave 100+ — ramps from 1.0 → 1.45 based on time spent in the current wave.
 * @param {number} elapsedSeconds
 * @param {number} [currentWave]
 * @returns {number}
 */
export function getWave100LateGameHpMultiplier(elapsedSeconds, currentWave) {
    const wave = currentWave ?? getWaveNumber(elapsedSeconds);
    if (wave < FINAL_VICTORY_WAVE) return 1;

    const waveStartSec = (FINAL_VICTORY_WAVE - 1) * BALANCE.difficultyIntervalSec;
    const intoWave = Math.max(0, elapsedSeconds - waveStartSec);
    const t = Math.min(1, intoWave / WAVE_100_HP_RAMP_SECONDS);
    return 1 + WAVE_100_MAX_LATE_HP_BONUS * t;
}

/**
 * Post–Wave 100 multiplier applied to all enemy combat stats.
 * Wave 101 → 1.15×, wave 120 → 4× (300% more than wave 100).
 * @param {number} currentWave 1-based wave number
 * @returns {number}
 */
export function getPostFinalWaveStatMultiplier(currentWave) {
    if (currentWave <= FINAL_VICTORY_WAVE) return 1;
    const steps = currentWave - FINAL_VICTORY_WAVE;
    return 1 + POST_FINAL_WAVE_STAT_STEP * steps;
}

/**
 * Combined HP multiplier for a newly spawned enemy (global + Wave 100 late ramp only).
 * @param {number} elapsedSeconds
 * @param {number} [currentWave]
 * @returns {number}
 */
export function getEnemyHpRuntimeMultiplier(elapsedSeconds, currentWave) {
    return getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
}

/**
 * Apply post–Wave 100 stat growth to HP, damage, armour, and attack speed.
 * @param {object} stats Enemy stats (mutated)
 * @param {number} currentWave 1-based wave number
 */
export function applyPostFinalWaveStatScaling(stats, currentWave) {
    if (!stats) return stats;
    const mult = getPostFinalWaveStatMultiplier(currentWave);
    if (mult === 1) return stats;

    stats.hp = Math.max(1, Math.floor(stats.hp * mult + 1e-9));
    stats.maxHp = stats.hp;
    stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * mult + 1e-9));
    if (typeof stats.armour === 'number') {
        stats.armour = Math.max(0, Math.floor(stats.armour * mult + 1e-9));
    }
    if (typeof stats.attackSpeed === 'number' && stats.attackSpeed > 0) {
        stats.attackSpeed = stats.attackSpeed * mult;
    }
    return stats;
}

/**
 * Full runtime scaling applied when an enemy spawns.
 * @param {object} stats Enemy stats (mutated)
 * @param {number} elapsedSeconds
 * @param {number} [currentWave]
 */
export function applyRuntimeEnemyScaling(stats, elapsedSeconds, currentWave) {
    if (!stats) return stats;
    const wave = currentWave ?? getWaveNumber(elapsedSeconds);

    applyPostFinalWaveStatScaling(stats, wave);

    const dmgRamp = getWaveDamageRampMultiplier(wave);
    if (dmgRamp !== 1 && typeof stats.physicalDamage === 'number') {
        stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * dmgRamp + 1e-9));
    }

    const hpMult = getEnemyHpRuntimeMultiplier(elapsedSeconds, currentWave);
    if (hpMult === 1) return stats;

    stats.hp = Math.max(1, Math.floor(stats.hp * hpMult + 1e-9));
    stats.maxHp = stats.hp;
    return stats;
}

/** @deprecated Alias — use applyRuntimeEnemyScaling */
export function applyRuntimeEnemyHpScaling(stats, elapsedSeconds, currentWave) {
    return applyRuntimeEnemyScaling(stats, elapsedSeconds, currentWave);
}

/**
 * Reinforcement spawn interval during Wave 100 finale (sim ms) — faster as the wave escalates.
 * @param {number} elapsedSeconds
 * @param {number} [currentWave]
 * @returns {number}
 */
export function getFinalVictoryReinforcementIntervalMs(elapsedSeconds, currentWave) {
    const escalation = getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
    return Math.max(650, Math.floor(4200 / escalation));
}

/** @param {number} elapsedSeconds @param {number} [currentWave] @returns {number} */
export function rollFinalVictoryReinforcementSwarmSize(elapsedSeconds, currentWave) {
    const escalation = getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
    const min = 4 + Math.floor(escalation * 4);
    const max = min + 4 + Math.floor(escalation * 6);
    return min + Math.floor(Math.random() * (max - min + 1));
}
