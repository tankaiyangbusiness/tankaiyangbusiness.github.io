import { describe, it, expect } from 'vitest';
import {
    getDifficultyIndex,
    getWaveNumber,
    waveToDifficultyIndex
} from '../js/config/waveProgression.js';
import { BALANCE } from '../js/config/balance.js';

describe('waveProgression', () => {
    it('starts player-facing wave at 1', () => {
        expect(getWaveNumber(0)).toBe(1);
        expect(getWaveNumber(11)).toBe(1);
        expect(getWaveNumber(BALANCE.difficultyIntervalSec)).toBe(2);
        expect(getWaveNumber(119)).toBe(10);
        expect(getWaveNumber(1188)).toBe(100);
    });

    it('maps wave number to 0-based difficulty index', () => {
        expect(getDifficultyIndex(0)).toBe(0);
        expect(waveToDifficultyIndex(1)).toBe(0);
        expect(waveToDifficultyIndex(3)).toBe(2);
    });
});
