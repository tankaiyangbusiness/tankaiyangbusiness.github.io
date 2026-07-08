/**
 * Wave display (1-based) vs difficulty index (0-based for spawn formulas).
 */
import { BALANCE } from './balance.js';

/** @param {number} elapsedSeconds */
export function getDifficultyIndex(elapsedSeconds) {
    return Math.floor(elapsedSeconds / BALANCE.difficultyIntervalSec);
}

/** Player-facing wave number — starts at 1. */
export function getWaveNumber(elapsedSeconds) {
    return getDifficultyIndex(elapsedSeconds) + 1;
}

/** @param {number} waveNumber 1-based */
export function waveToDifficultyIndex(waveNumber) {
    return Math.max(0, waveNumber - 1);
}
