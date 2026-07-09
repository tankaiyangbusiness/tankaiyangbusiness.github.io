/** @typedef {import('../game/gameState.js').GameState} GameState */

import { getRuntimeBudgets } from './runtimeBudget.js';

export const GAME_SPEED_OPTIONS = [1, 2, 4];

/** Cap real frame delta so lag spikes cannot advance sim time excessively. */
export const MAX_REAL_DELTA_MS = 48;

/** Max simulated milliseconds advanced per game tick (prevents 4× death spirals). */
export const MAX_SIM_ADVANCE_PER_FRAME_MS = 120;

/**
 * Initialize scaled game clock for a new run.
 * @param {GameState} state
 */
export function initGameClock(state) {
    state.timeScale = 1;
    state.simulatedMs = 0;
    state.lastSimDeltaMs = 0;
    state.lastRealTickMs = Date.now();
}

/**
 * Advance simulated time by (realDelta × timeScale). Call once per game tick while unpaused.
 * Real and sim deltas are capped to keep high speed modes performant.
 * @param {GameState} state
 * @param {number} [realNow]
 * @returns {number} simulated milliseconds since run start
 */
export function advanceGameClock(state, realNow = Date.now()) {
    if (state.lastRealTickMs == null) {
        state.lastRealTickMs = realNow;
    }
    const rawDelta = Math.max(0, realNow - state.lastRealTickMs);
    const realDelta = Math.min(rawDelta, MAX_REAL_DELTA_MS);
    state.lastRealTickMs = realNow;
    const scale = state.timeScale ?? 1;
    const simAdvance = Math.min(realDelta * scale, MAX_SIM_ADVANCE_PER_FRAME_MS);
    state.lastSimDeltaMs = simAdvance;
    state.simulatedMs = (state.simulatedMs ?? 0) + simAdvance;
    return state.simulatedMs;
}

/** Simulated milliseconds advanced on the last tick — for sim-time projectile movement. */
export function getLastSimDeltaMs(state) {
    return state.lastSimDeltaMs ?? 0;
}

/** @param {GameState} state @returns {number} */
export function getSimulatedMs(state) {
    return state.simulatedMs ?? 0;
}

/** @param {GameState} state @returns {number} */
export function getElapsedSeconds(state) {
    return Math.floor(getSimulatedMs(state) / 1000);
}

/**
 * @param {GameState} state
 * @param {number} scale
 * @param {number} [realNow]
 */
export function setTimeScale(state, scale, realNow = Date.now()) {
    if (!GAME_SPEED_OPTIONS.includes(scale)) return;
    advanceGameClock(state, realNow);
    state.timeScale = scale;
}

/** @param {GameState} state @param {number} [realNow] @returns {number} */
export function getProjectedSimMs(state, realNow = Date.now()) {
    const rawDelta = Math.max(0, realNow - (state.lastRealTickMs ?? realNow));
    const realDelta = Math.min(rawDelta, MAX_REAL_DELTA_MS);
    const projected = realDelta * (state.timeScale ?? 1);
    return (state.simulatedMs ?? 0) + Math.min(projected, MAX_SIM_ADVANCE_PER_FRAME_MS);
}

/** Resume after pause — real clock jumps forward without advancing sim time. */
export function syncClockAfterResume(state) {
    state.lastRealTickMs = Date.now();
}

/**
 * @param {number} lastSimMs
 * @param {number} intervalMs
 * @param {number} simNow
 */
export function intervalElapsed(lastSimMs, intervalMs, simNow) {
    return simNow - lastSimMs >= intervalMs;
}

/**
 * Scale movement per animation frame.
 * @param {GameState} state
 * @param {number} baseSpeed
 */
export function scaleMovementSpeed(state, baseSpeed) {
    return baseSpeed * (state.timeScale ?? 1);
}

/**
 * Real-time timeout duration for scaled gameplay (dash, toasts, etc.).
 * @param {GameState} state
 * @param {number} durationMs
 */
export function scaledRealTimeoutMs(state, durationMs) {
    const scale = state.timeScale ?? 1;
    return Math.max(16, durationMs / scale);
}

/**
 * VFX lifetime — shorter at higher time scales so DOM nodes recycle in the same game-time.
 * @param {GameState} state
 * @param {number} durationMs
 */
export function scaledEffectLifetimeMs(state, durationMs) {
    const scale = Math.max(1, state?.timeScale ?? 1);
    return Math.max(80, durationMs / scale);
}

/** @returns {number} */
export function getEffectCap() {
    return getRuntimeBudgets().maxEffects;
}

/** @deprecated Use getEffectCap — budgets no longer vary by game speed. */
export function getEffectCapForTimeScale(state, baseMax = 64) {
    return getEffectCap();
}

