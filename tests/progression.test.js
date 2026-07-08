import { describe, it, expect } from 'vitest';
import {
    getLevelUpType,
    isSkillLevel,
    createSkillLevelThresholds
} from '../js/systems/progression.js';
import { createAbilityLevelThresholds } from '../js/config/progression.js';

describe('getLevelUpType', () => {
    const abilityThresholds = createAbilityLevelThresholds();

    it('returns skill at 5, 15, 25, 35 (not every 5)', () => {
        expect(getLevelUpType(4, abilityThresholds)).toBe('skill');
        expect(getLevelUpType(14, abilityThresholds)).toBe('skill');
        expect(getLevelUpType(24, abilityThresholds)).toBe('skill');
        expect(getLevelUpType(34, abilityThresholds)).toBe('skill');
    });

    it('does not treat level 10 as a skill milestone', () => {
        expect(getLevelUpType(9, abilityThresholds)).toBe('stat');
        expect(isSkillLevel(10)).toBe(false);
    });

    it('returns ability when next level is 9, 19, 29', () => {
        expect(getLevelUpType(8, abilityThresholds)).toBe('ability');
        expect(getLevelUpType(18, abilityThresholds)).toBe('ability');
    });

    it('returns stat for normal levels', () => {
        expect(getLevelUpType(2, abilityThresholds)).toBe('stat');
        expect(getLevelUpType(6, abilityThresholds)).toBe('stat');
        expect(getLevelUpType(12, abilityThresholds)).toBe('stat');
    });
});

describe('isSkillLevel', () => {
    it('identifies skill milestone levels 5 + 10n', () => {
        expect(isSkillLevel(5)).toBe(true);
        expect(isSkillLevel(15)).toBe(true);
        expect(isSkillLevel(25)).toBe(true);
        expect(isSkillLevel(10)).toBe(false);
        expect(isSkillLevel(7)).toBe(false);
        expect(isSkillLevel(0)).toBe(false);
    });
});

describe('createSkillLevelThresholds', () => {
    it('starts at 5 then steps by 10', () => {
        const t = createSkillLevelThresholds(4);
        expect(t).toEqual([5, 15, 25, 35]);
    });
});
