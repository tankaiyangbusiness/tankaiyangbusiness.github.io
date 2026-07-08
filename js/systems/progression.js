/**
 * Determines which upgrade screen to show when leveling up.
 * @param {number} currentLevel — level before increment
 * @param {number[]} abilityThresholds — levels where passive abilities unlock (e.g. 9, 19, 29)
 * @returns {'skill' | 'ability' | 'stat'}
 */
export function getLevelUpType(currentLevel, abilityThresholds) {
    const nextLevel = currentLevel + 1;
    if (nextLevel > 0 && nextLevel % 5 === 0) return 'skill';
    if (abilityThresholds.includes(nextLevel)) return 'ability';
    return 'stat';
}

/** @param {number} count */
export function createSkillLevelThresholds(count = 40) {
    const thresholds = [];
    for (let i = 1; i <= count; i++) {
        thresholds.push(i * 5);
    }
    return thresholds;
}

export function isSkillLevel(level) {
    return level > 0 && level % 5 === 0;
}
