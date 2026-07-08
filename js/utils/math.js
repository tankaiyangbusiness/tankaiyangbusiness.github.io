/** @param {number} x @param {number} y @returns {number} */
export function distanceVw(x1, y1, x2, y2, innerWidth, innerHeight) {
    const dx = Math.abs(x1 - x2) * innerWidth / 100;
    const dy = Math.abs(y1 - y2) * innerHeight / 100;
    return Math.hypot(dx, dy);
}

/** @param {number} value @param {number} min @param {number} max @returns {number} */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/** @param {number} chancePercent @returns {boolean} */
export function rollChance(chancePercent) {
    return Math.random() < chancePercent / 100;
}

/** @param {number} seconds @returns {string} */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/** @param {number} level @param {number} baseThreshold @returns {number} */
export { calculateExpThreshold } from '../config/expProgression.js';

/** @param {number} base @param {number} difficulty @returns {number} */
export function scaleStat(base, difficulty, growth = 1.7) {
    return base + base * (1 + 0.2 * difficulty) * Math.log(
        1 + difficulty + difficulty * Math.pow(growth, difficulty)
    );
}
