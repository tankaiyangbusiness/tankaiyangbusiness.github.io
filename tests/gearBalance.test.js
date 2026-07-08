import { describe, it, expect } from 'vitest';
import {
    GEAR_STAT_MULTIPLIER,
    GEAR_BASE_ILVL,
    gearIlvlMultiplier,
    boostGearStatValue
} from '../js/config/gearBalance.js';
import { scaleBaseStatsForIlvl } from '../js/systems/gearGenerator.js';

describe('gearBalance', () => {
    it('applies global stat multiplier', () => {
        expect(GEAR_STAT_MULTIPLIER).toBeGreaterThan(1);
        expect(boostGearStatValue(10, 'armour')).toBe(Math.floor(10 * GEAR_STAT_MULTIPLIER));
        expect(boostGearStatValue(0.1, 'attackSpeed')).toBeCloseTo(0.1 * GEAR_STAT_MULTIPLIER, 2);
    });

    it('scales ilvl curve above legacy baseline', () => {
        expect(gearIlvlMultiplier(1)).toBeGreaterThan(0.35 + 1 * 0.012);
        expect(GEAR_BASE_ILVL.intercept).toBeGreaterThan(0.4);
    });

    it('produces stronger base stats than pre-boost curve', () => {
        const boosted = scaleBaseStatsForIlvl({ physicalDamage: 10 }, 5);
        const legacy = Math.floor(10 * (0.35 + 5 * 0.012));
        expect(boosted.physicalDamage).toBeGreaterThan(legacy * 2);
    });

    it('uses elevated global gear multiplier', () => {
        expect(GEAR_STAT_MULTIPLIER).toBeGreaterThanOrEqual(2);
    });
});
