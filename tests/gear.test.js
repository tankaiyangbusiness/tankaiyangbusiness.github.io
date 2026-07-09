import { describe, it, expect, beforeEach } from 'vitest';
import {
    generateGearItem,
    generateGearItemByRarity,
    getItemStatTotals,
    buildItemName,
    buildItemTooltipHtml,
    buildGearCompareTooltipHtml,
    rollLootDrop,
    rollGuaranteedUniqueDrop,
    scaleBaseStatsForIlvl,
    computeDropIlvl,
    countItemAffixes,
    resetItemIdCounter
} from '../js/systems/gearGenerator.js';
import { GearInventory } from '../js/systems/gearInventory.js';
import {
    rarityFromAffixCount,
    rollAffixCount,
    shouldDropGear,
    getDropChance,
    DROP_RATE_MULTIPLIER,
    DROP_CHANCE,
    getAdjustedAffixWeights,
    AFFIX_COUNT_WEIGHTS,
    getGearRarityDropRates,
    getAbsoluteRarityDropRates
} from '../js/config/gearRarity.js';
import { getAffixTierBand, TIERED_PREFIXES } from '../js/config/gearAffixTiers.js';
import { GEAR_SLOTS } from '../js/config/gearSlots.js';

describe('rarityFromAffixCount', () => {
    it('maps affix counts to correct rarity colors', () => {
        expect(rarityFromAffixCount(0)).toBe('normal');
        expect(rarityFromAffixCount(1)).toBe('magic');
        expect(rarityFromAffixCount(2)).toBe('magic');
        expect(rarityFromAffixCount(3)).toBe('rare');
        expect(rarityFromAffixCount(6)).toBe('rare');
        expect(rarityFromAffixCount(7)).toBe('unique');
        expect(rarityFromAffixCount(8)).toBe('unique');
    });
});

describe('affix tiers', () => {
    it('picks better tiers at higher ilvl', () => {
        const def = TIERED_PREFIXES[0];
        const low = getAffixTierBand(def, 5);
        const high = getAffixTierBand(def, 70);
        expect(high.tier).toBeLessThan(low.tier);
        expect(high.max).toBeGreaterThan(low.max);
    });
});

describe('ilvl scaling', () => {
    it('weakens low-level base stats', () => {
        const low = scaleBaseStatsForIlvl({ physicalDamage: 10 }, 1);
        const high = scaleBaseStatsForIlvl({ physicalDamage: 10 }, 60);
        expect(low.physicalDamage).toBeLessThan(high.physicalDamage);
    });

    it('computes drop ilvl from player level and difficulty', () => {
        expect(computeDropIlvl(10, 0)).toBe(10);
        expect(computeDropIlvl(10, 10)).toBeGreaterThan(10);
    });
});

describe('generateGearItem', () => {
    beforeEach(() => resetItemIdCounter());

    it('creates normal white item with zero affixes', () => {
        const item = generateGearItem('weapon', 5, { affixCount: 0 });
        expect(item.rarity).toBe('normal');
        expect(countItemAffixes(item)).toBe(0);
        expect(item.ilvl).toBe(5);
    });

    it('creates magic blue item with 1-2 affixes', () => {
        const item = generateGearItem('weapon', 10, { affixCount: 2 });
        expect(item.rarity).toBe('magic');
        expect(countItemAffixes(item)).toBeGreaterThanOrEqual(1);
        expect(countItemAffixes(item)).toBeLessThanOrEqual(2);
    });

    it('creates rare yellow item with 3+ affixes', () => {
        const item = generateGearItem('bodyArmour', 30, { affixCount: 4 });
        expect(item.rarity).toBe('rare');
        expect(countItemAffixes(item)).toBeGreaterThanOrEqual(3);
    });

    it('creates unique orange item with 7+ affixes', () => {
        const item = generateGearItem('weapon', 64, { affixCount: 7 });
        expect(item.rarity).toBe('unique');
        expect(countItemAffixes(item)).toBeGreaterThanOrEqual(7);
    });

    it('creates named unique from id', () => {
        const item = generateGearItemByRarity('unique', 'weapon', 1, 'survivors_blade');
        expect(item.name).toBe("Survivor's Blade");
        expect(item.rarity).toBe('unique');
    });

    it('rolls a guaranteed unique drop for milestone bosses with 7–8 affixes', () => {
        const item = rollGuaranteedUniqueDrop(30);
        expect(item.rarity).toBe('unique');
        expect(item.uniqueId).toBeTruthy();
        expect(item.ilvl).toBe(30);
        expect(countItemAffixes(item)).toBeGreaterThanOrEqual(7);
        expect(countItemAffixes(item)).toBeLessThanOrEqual(8);
        expect(Object.keys(item.baseStats).length).toBeGreaterThanOrEqual(2);
    });

    it('keeps bonus affixes on named unique items', () => {
        const item = generateGearItem('weapon', 20, { uniqueId: 'survivors_blade', affixCount: 7 });
        expect(item.name).toBe("Survivor's Blade");
        expect(item.rarity).toBe('unique');
        expect(countItemAffixes(item)).toBeGreaterThanOrEqual(7);
        expect(item.baseStats.physicalDamage).toBeGreaterThan(0);
    });
});

describe('buildItemTooltipHtml', () => {
    beforeEach(() => resetItemIdCounter());

    it('shows ilvl and colored name without rarity label text', () => {
        const item = generateGearItem('ring', 12, { affixCount: 2 });
        const html = buildItemTooltipHtml(item);
        expect(html).toContain('gear-tip-name');
        expect(html).toContain('Item Level 12');
        expect(html).not.toContain('gear-tip-rarity');
        expect(html).not.toContain('>Magic<');
    });

    it('separates base stats and affixes with neutral styling', () => {
        const item = generateGearItem('weapon', 20, { affixCount: 3 });
        const html = buildItemTooltipHtml(item);
        expect(html).toContain('gear-tip-section');
        expect(html).toContain('Base Stats');
        expect(html).toContain('Affixes (');
        expect(html).not.toContain('gear-tip-prefix');
        expect(html).not.toContain('gear-tip-suffix');
    });

    it('shows affix tier tags', () => {
        const item = generateGearItem('weapon', 30, { affixCount: 2 });
        const html = buildItemTooltipHtml(item);
        if (item.prefixes?.length || item.suffixes?.length) {
            expect(html).toMatch(/gear-tip-tier">T\d+/);
        }
    });

    it('shows tier on normal white item base stats', () => {
        const item = generateGearItem('helmet', 20, { affixCount: 0 });
        expect(item.rarity).toBe('normal');
        const html = buildItemTooltipHtml(item);
        expect(html).toContain('Base Stats');
        expect(html).toMatch(/gear-tip-tier">T\d+/);
    });

    it('builds compare tooltip with hovered and equipped columns', () => {
        const hovered = generateGearItem('ring', 15, { affixCount: 1 });
        const equipped = generateGearItem('ring', 10, { affixCount: 0 });
        const html = buildGearCompareTooltipHtml(hovered, equipped);
        expect(html).toContain('gear-tip-compare');
        expect(html).toContain('Equipped');
        expect(html).toContain(hovered.name);
    });

    it('shows empty equipped slot in compare tooltip', () => {
        const item = generateGearItem('boot', 5, { affixCount: 0 });
        const html = buildGearCompareTooltipHtml(item, null);
        expect(html).toContain('Empty slot');
    });
});

describe('buildItemName', () => {
    it('combines prefix base suffix', () => {
        const name = buildItemName({
            baseLabel: 'Sword',
            prefixes: [{ label: 'Heavy' }],
            suffixes: [{ label: 'of Alacrity' }]
        });
        expect(name).toContain('Heavy');
        expect(name).toContain('of Alacrity');
    });
});

describe('GearInventory', () => {
    beforeEach(() => resetItemIdCounter());

    it('equips and applies stats', () => {
        const inv = new GearInventory();
        const stats = { physicalDamage: 10, maxHp: 100, hp: 100, armour: 5 };
        const item = generateGearItem('weapon', 20, { affixCount: 0 });
        inv.addItem(item);
        inv.equip(item.id, stats);
        expect(stats.physicalDamage).toBeGreaterThan(10);
        expect(inv.getEquippedCount()).toBe(1);
    });

    it('bulk removes items by rarity', () => {
        const inv = new GearInventory();
        inv.addItem(generateGearItem('ring', 1, { affixCount: 0 }));
        inv.addItem(generateGearItem('boot', 1, { affixCount: 2 }));
        inv.addItem(generateGearItem('helmet', 1, { affixCount: 4 }));
        expect(inv.removeByRarities(['normal', 'magic'])).toBe(2);
        expect(inv.items).toHaveLength(1);
        expect(inv.items[0].rarity).toBe('rare');
    });
});

describe('gear drop', () => {
    beforeEach(() => resetItemIdCounter());

    it('rollAffixCount returns 0-8', () => {
        for (let i = 0; i < 50; i++) {
            const c = rollAffixCount('normal');
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThanOrEqual(8);
        }
    });

    it('drop check returns boolean', () => {
        expect(typeof shouldDropGear('boss')).toBe('boolean');
    });

    it('applies −30% drop rate via multiplier (0.3762 × 0.7)', () => {
        expect(DROP_RATE_MULTIPLIER).toBeCloseTo(0.26334, 4);
        expect(DROP_CHANCE.normal).toBeCloseTo(0.06 * DROP_RATE_MULTIPLIER, 4);
        expect(DROP_CHANCE.boss).toBeCloseTo(0.45 * DROP_RATE_MULTIPLIER, 4);
    });

    it('scales drop chance down in late waves', () => {
        const early = getDropChance('normal', 5);
        const late = getDropChance('normal', 25);
        expect(late).toBeLessThan(early);
        expect(late / early).toBeLessThan(0.55);
    });

    it('favors zero-affix normal drops from normal enemies', () => {
        const weights = AFFIX_COUNT_WEIGHTS.normal;
        const zeroAffixShare = weights[0] / weights.reduce((a, b) => a + b, 0);
        expect(zeroAffixShare).toBeGreaterThan(0.5);
        expect(weights[7]).toBe(0);
        expect(weights[8]).toBe(0);
    });

    it('returns unmodified affix weights per enemy category', () => {
        const adjusted = getAdjustedAffixWeights('normal');
        expect(adjusted).toEqual(AFFIX_COUNT_WEIGHTS.normal);
    });

    it('exposes gear rarity rates (not enemy category) that sum to ~1', () => {
        const rates = getGearRarityDropRates('normal');
        expect(rates.normal).toBeCloseTo(0.62, 2);
        expect(rates.magic).toBeCloseTo(0.35, 2);
        expect(rates.rare).toBeCloseTo(0.03, 2);
        expect(rates.unique).toBe(0);
        const sum = rates.normal + rates.magic + rates.rare + rates.unique;
        expect(sum).toBeCloseTo(1, 5);
    });

    it('absolute rarity rates = drop chance × conditional rarity', () => {
        const abs = getAbsoluteRarityDropRates('boss', 1);
        const drop = getDropChance('boss', 1);
        const cond = getGearRarityDropRates('boss');
        expect(abs.rare).toBeCloseTo(drop * cond.rare, 6);
        expect(abs.unique).toBeCloseTo(drop * cond.unique, 6);
    });

    it('returns item with valid slot and ilvl', () => {
        const item = rollLootDrop('elite', 25);
        expect(GEAR_SLOTS).toContain(item.slot);
        expect(item.ilvl).toBe(25);
        expect(rarityFromAffixCount(countItemAffixes(item))).toBe(item.rarity);
    });
});
