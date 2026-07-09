import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from '../js/game/gameState.js';
import {
    initGameClock,
    advanceGameClock,
    getElapsedSeconds,
    syncClockAfterResume
} from '../js/systems/gameClock.js';

const SAMPLE_STATS = {
    hp: 500,
    maxHp: 500,
    physicalDamage: 30,
    attackSpeed: 2,
    attackRange: 150,
    armour: 10,
    hpRegen: 3,
    critChance: 5,
    critMultiplier: 150,
    evade: 0,
    level: 1,
    exp: 0,
    expThreshold: 100,
    buffList: {}
};

describe('run lifecycle / timer start', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(2_000_000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initForCharacter leaves the run unpaused with a zeroed clock', () => {
        const state = new GameState();
        state.gamePaused = true;
        state.pauseTime = Date.now();
        state.elapsedSeconds = 99;
        state.simulatedMs = 99_000;

        state.initForCharacter(SAMPLE_STATS);

        expect(state.characterSelection).toBe(false);
        expect(state.gamePaused).toBe(false);
        expect(state.gameOver).toBe(false);
        expect(state.elapsedSeconds).toBe(0);
        expect(state.pauseTime).toBe(0);
        expect(state.simulatedMs).toBe(0);
        expect(state.lastRealTickMs).toBe(0);
        expect(state.runStatPeaks).toBeNull();
        expect(state.maxHpReached).toBe(0);
    });

    it('re-initializing a character resets elapsed time for restart / re-pick', () => {
        const state = new GameState();
        state.initForCharacter(SAMPLE_STATS);
        initGameClock(state);
        let now = 2_000_000;
        for (let i = 0; i < 60; i++) {
            now += 20;
            advanceGameClock(state, now);
        }
        expect(getElapsedSeconds(state)).toBeGreaterThan(0);

        state.initForCharacter(SAMPLE_STATS);
        initGameClock(state);

        expect(state.elapsedSeconds).toBe(0);
        expect(state.simulatedMs).toBe(0);
        now = 2_100_000;
        for (let i = 0; i < 5; i++) {
            now += 20;
            advanceGameClock(state, now);
        }
        expect(state.simulatedMs).toBeGreaterThan(0);
        expect(getElapsedSeconds(state)).toBe(0);
    });

    it('begin-run clock init advances timer after sim time accumulates', () => {
        const state = new GameState();
        state.initForCharacter(SAMPLE_STATS);
        initGameClock(state);

        let now = 2_000_000;
        for (let i = 0; i < 60; i++) {
            now += 20;
            advanceGameClock(state, now);
        }

        expect(getElapsedSeconds(state)).toBeGreaterThanOrEqual(1);
    });

    it('syncClockAfterResume prevents a pause-length jump in sim time', () => {
        const state = new GameState();
        initGameClock(state);
        advanceGameClock(state, 2_000_500);
        const beforePause = state.simulatedMs;

        state.gamePaused = true;
        state.pauseTime = 2_000_500;
        vi.setSystemTime(2_120_500);
        syncClockAfterResume(state);
        state.gamePaused = false;

        advanceGameClock(state, 2_120_516);
        expect(state.simulatedMs - beforePause).toBeLessThanOrEqual(48);
        expect(getElapsedSeconds(state)).toBe(0);
    });
});
