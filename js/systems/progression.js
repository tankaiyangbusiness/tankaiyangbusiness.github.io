/**
 * Determines which upgrade screen to show when leveling up.
 * Skill milestones: 5, then every 10 → 5, 15, 25, 35…
 * Ability milestones remain in abilityThresholds (e.g. 9, 19, 29).
 *
 * @param {number} currentLevel — level before increment
 * @param {number[]} abilityThresholds
 * @returns {'skill' | 'ability' | 'stat'}
 */
export function getLevelUpType(currentLevel, abilityThresholds) {
    const nextLevel = currentLevel + 1;
    if (isSkillLevel(nextLevel)) return 'skill';
    if (abilityThresholds.includes(nextLevel)) return 'ability';
    return 'stat';
}

/** Skill unlock levels: 5, 15, 25, 35… */
export function createSkillLevelThresholds(count = 40) {
    const thresholds = [];
    for (let i = 0; i < count; i++) {
        thresholds.push(5 + i * 10);
    }
    return thresholds;
}

/** @param {number} level */
export function isSkillLevel(level) {
    return level >= 5 && (level - 5) % 10 === 0;
}
