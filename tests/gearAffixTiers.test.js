import { describe, it, expect } from 'vitest';
import {
    TIER_MIN_ILVL,
    getAffixTierBand,
    getLegalAffixTierBands,
    rollRandomAffixTierBand,
    rollTieredAffixValue,
    rollValueInTierBand,
    rollBaseStatsWithTiers,
    TIERED_PREFIXES
} from '../js/config/gearAffixTiers.js';
import { boostGearStatValue } from '../js/config/gearBalance.js';

describe('TIER_MIN_ILVL', () => {
    it('tier 1 requires ilvl 64+', () => {
        expect(TIER_MIN_ILVL[1]).toBe(64);
        expect(TIER_MIN_ILVL[2]).toBe(56);
    });
});

describe('getAffixTierBand', () => {
    it('returns tier 8 band at low ilvl', () => {
        const def = TIERED_PREFIXES.find(p => p.id === 'heavy');
        const band = getAffixTierBand(def, 3);
        expect(band.tier).toBe(8);
    });

    it('returns tier 1 band at ilvl 64+', () => {
        const def = TIERED_PREFIXES.find(p => p.id === 'heavy');
        const band = getAffixTierBand(def, 64);
        expect(band.tier).toBe(1);
    });
});

describe('rollRandomAffixTierBand', () => {
    it('allows any legal tier at high ilvl', () => {
        const def = TIERED_PREFIXES.find(p => p.id === 'reinforced');
        const legal = getLegalAffixTierBands(def, 64);
        expect(legal.some(b => b.tier === 1)).toBe(true);
        expect(legal.some(b => b.tier === 8)).toBe(true);

        const seen = new Set();
        for (let i = 0; i < 40; i++) {
            seen.add(rollRandomAffixTierBand(def, 64).tier);
        }
        expect(seen.size).toBeGreaterThan(1);
    });
});

describe('attack speed tier spread', () => {
    it('tier 2 attack speed band reaches ~0.18', () => {
        const def = TIERED_PREFIXES.find(p => p.id === 'quick');
        const band = def.tiers.find(t => t.tier === 2);
        expect(band.min).toBeGreaterThanOrEqual(0.14);
        expect(band.max).toBeGreaterThanOrEqual(0.20);
        const t8 = def.tiers.find(t => t.tier === 8);
        expect(t8.max).toBeLessThanOrEqual(0.04);
    });
});

describe('rollValueInTierBand', () => {
    it('rolls within boosted tier min and max', () => {
        const band = { tier: 2, min: 20, max: 30 };
        for (let i = 0; i < 20; i++) {
            const v = rollValueInTierBand(band, 'armour');
            expect(v).toBeGreaterThanOrEqual(boostGearStatValue(band.min, 'armour'));
            expect(v).toBeLessThanOrEqual(boostGearStatValue(band.max, 'armour'));
        }
    });
});

describe('rollTieredAffixValue', () => {
    it('rolls affix with tier and value in band', () => {
        const def = TIERED_PREFIXES.find(p => p.id === 'reinforced');
        const rolled = rollTieredAffixValue(def, 'helmet', 64);
        expect(rolled).not.toBeNull();
        expect(rolled.stat).toBe('armour');
        expect(rolled.tier).toBeGreaterThanOrEqual(1);
        expect(rolled.tier).toBeLessThanOrEqual(8);
        const band = def.tiers.find(t => t.tier === rolled.tier);
        expect(rolled.value).toBeGreaterThanOrEqual(boostGearStatValue(band.min, rolled.stat));
        expect(rolled.value).toBeLessThanOrEqual(boostGearStatValue(band.max, rolled.stat));
    });
});

describe('rollBaseStatsWithTiers', () => {
    it('assigns tier tags to white item base stats', () => {
        const { stats, rolls } = rollBaseStatsWithTiers({ armour: 4 }, 12);
        expect(stats.armour).toBeGreaterThan(0);
        expect(rolls[0].tier).toBeGreaterThanOrEqual(1);
        expect(rolls[0].tier).toBeLessThanOrEqual(8);
    });
});
