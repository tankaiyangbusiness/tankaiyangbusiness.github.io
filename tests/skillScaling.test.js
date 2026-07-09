import { describe, it, expect } from 'vitest';
import {
    SKILL_LEVEL_1_DAMAGE_FACTOR,
    SKILL_DAMAGE_RAMP_FACTOR,
    skillLevelDamageMult,
    skillLevelDamageFromBase,
    skillLevelDamagePercent,
    legacySkillLevelDamageMult
} from '../js/config/skillScaling.js';

describe('skillLevelDamageMult', () => {
    const constant = 0.75;
    const step = 0.1;

    it('nerfs level 1 by 20% vs legacy linear formula', () => {
        const legacyLv1 = legacySkillLevelDamageMult(1, constant, step);
        const scaledLv1 = skillLevelDamageMult(1, constant, step);
        expect(scaledLv1).toBeCloseTo(legacyLv1 * SKILL_LEVEL_1_DAMAGE_FACTOR);
    });

    it('ramps faster from level 2 onward', () => {
        const lv2 = skillLevelDamageMult(2, constant, step);
        const legacyLv2 = legacySkillLevelDamageMult(2, constant, step);
        expect(lv2).toBeGreaterThan(legacySkillLevelDamageMult(1, constant, step));
        expect(lv2).toBeLessThan(legacyLv2);

        const lv5 = skillLevelDamageMult(5, constant, step);
        const legacyLv5 = legacySkillLevelDamageMult(5, constant, step);
        expect(lv5).toBeGreaterThan(legacyLv5);
    });

    it('uses steeper per-level steps after level 1', () => {
        const lv1 = skillLevelDamageMult(1, constant, step);
        const lv2 = skillLevelDamageMult(2, constant, step);
        const lv3 = skillLevelDamageMult(3, constant, step);
        const stepAfterLv1 = lv2 - lv1;
        expect(stepAfterLv1).toBeCloseTo(step * SKILL_DAMAGE_RAMP_FACTOR);
        expect(lv3 - lv2).toBeCloseTo(stepAfterLv1);
    });

    it('returns zero for non-positive levels', () => {
        expect(skillLevelDamageMult(0, constant, step)).toBe(0);
        expect(skillLevelDamageMult(-1, constant, step)).toBe(0);
    });
});

describe('skillLevelDamageFromBase', () => {
    it('nerfs illusion-style base at level 1', () => {
        expect(skillLevelDamagePercent(1, 30, 7.5)).toBe(24);
    });

    it('scales illusion-style percent steeply by level 5', () => {
        expect(skillLevelDamagePercent(5, 30, 7.5)).toBe(99);
        expect(skillLevelDamageFromBase(5, 30, 7.5)).toBeGreaterThan(60);
    });
});
