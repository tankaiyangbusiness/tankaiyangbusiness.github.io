import { describe, it, expect } from 'vitest';
import {
    ABILITY_COMBAT_SCALING,
    getAbilityPercent,
    buildAbilityProgression
} from '../js/config/abilityCombatScaling.js';

describe('abilityCombatScaling', () => {
    it('caps reflect at 50% over five levels', () => {
        expect(getAbilityPercent('reflect', 1)).toBe(10);
        expect(getAbilityPercent('reflect', 5)).toBe(50);
        expect(getAbilityPercent('reflect', 99)).toBe(50);
    });

    it('caps lifesteal at 25%', () => {
        expect(getAbilityPercent('lifesteal', 5)).toBe(25);
        expect(buildAbilityProgression('lifesteal')).toEqual(['5', '10', '15', '20', '25']);
    });

    it('caps damage reduction at 50%', () => {
        expect(getAbilityPercent('damageReduction', 5)).toBe(50);
        expect(buildAbilityProgression('damageReduction')).toEqual(['10', '20', '30', '40', '50']);
    });

    it('caps attack speed buff at 100%', () => {
        expect(getAbilityPercent('attackSpeedBuff', 5)).toBe(100);
        expect(buildAbilityProgression('attackSpeedBuff')).toEqual(['20', '40', '60', '80', '100']);
    });

    it('exposes stable max levels for each passive', () => {
        expect(ABILITY_COMBAT_SCALING.reflect.maxLevel).toBe(5);
        expect(ABILITY_COMBAT_SCALING.lifesteal.maxLevel).toBe(5);
    });
});
