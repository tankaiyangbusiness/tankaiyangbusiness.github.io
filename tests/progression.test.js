import { describe, it, expect } from 'vitest';
import { getLevelUpType, isSkillLevel } from '../js/systems/progression.js';
import { createAbilityLevelThresholds } from '../js/config/progression.js';

describe('getLevelUpType', () => {
    const abilityThresholds = createAbilityLevelThresholds();

    it('returns skill when next level is multiple of 5', () => {
        expect(getLevelUpType(4, abilityThresholds)).toBe('skill');
        expect(getLevelUpType(9, abilityThresholds)).toBe('skill');
        expect(getLevelUpType(14, abilityThresholds)).toBe('skill');
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

    it('skill takes priority over stat at level 5 milestones', () => {
        expect(getLevelUpType(4, abilityThresholds)).toBe('skill');
    });
});

describe('isSkillLevel', () => {
    it('identifies skill milestone levels', () => {
        expect(isSkillLevel(5)).toBe(true);
        expect(isSkillLevel(10)).toBe(true);
        expect(isSkillLevel(7)).toBe(false);
    });
});
