import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    advanceGameClock,
    getElapsedSeconds,
    getProjectedSimMs,
    initGameClock,
    setTimeScale,
    scaleMovementSpeed,
    scaledRealTimeoutMs,
    syncClockAfterResume,
    GAME_SPEED_OPTIONS
} from '../js/systems/gameClock.js';
import { GameState } from '../js/game/gameState.js';

describe('gameClock', () => {
    /** @type {GameState} */
    let state;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(1_000_000);
        state = new GameState();
        initGameClock(state);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('advances simulated time with caps for stability at high speed', () => {
        advanceGameClock(state, 1_001_000);
        expect(state.simulatedMs).toBe(48);
        expect(state.lastSimDeltaMs).toBe(48);
        setTimeScale(state, 2, 1_001_000);
        advanceGameClock(state, 1_002_000);
        expect(state.simulatedMs).toBe(48 + 96);
        expect(getElapsedSeconds(state)).toBe(0);
    });

    it('caps simulated advance per frame at 4× speed', () => {
        setTimeScale(state, 4, 1_000_000);
        advanceGameClock(state, 1_010_000);
        expect(state.simulatedMs).toBe(120);
    });

    it('projects simulated time between tick advances with the same caps', () => {
        advanceGameClock(state, 1_000_500);
        expect(getProjectedSimMs(state, 1_001_000)).toBe(48 + 48);
    });

    it('scales movement and real timeouts', () => {
        setTimeScale(state, 4, 1_000_000);
        expect(scaleMovementSpeed(state, 0.3)).toBeCloseTo(1.2);
        expect(scaledRealTimeoutMs(state, 400)).toBe(100);
    });

    it('exposes standard speed options', () => {
        expect(GAME_SPEED_OPTIONS).toEqual([1, 2, 4]);
    });

    it('syncClockAfterResume resets real tick baseline without advancing sim', () => {
        syncClockAfterResume(state);
        expect(state.lastRealTickMs).toBe(1_000_000);
    });
});
