/**
 * PoE-inspired affix tiers — lower tier number = better rolls, gated by item level.
 * Tier 1 requires ilvl 64+, tier 8 can roll from ilvl 1.
 */
import { boostGearStatValue, gearIlvlMultiplier } from './gearBalance.js';

export const TIER_MIN_ILVL = {
    1: 64,
    2: 56,
    3: 48,
    4: 40,
    5: 32,
    6: 24,
    7: 16,
    8: 1
};

/** @typedef {{ tier: number, min: number, max: number }} AffixTierBand */
/** @typedef {{ id: string, label: string, stat: string, slots?: string[], tiers: AffixTierBand[] }} TieredAffixDef */

/** @type {TieredAffixDef[]} */
export const TIERED_PREFIXES = [
    {
        id: 'heavy', label: 'Heavy', stat: 'physicalDamage', slots: ['weapon', 'glove'],
        tiers: [
            { tier: 8, min: 1, max: 4 }, { tier: 7, min: 2, max: 6 }, { tier: 6, min: 4, max: 9 },
            { tier: 5, min: 6, max: 12 }, { tier: 4, min: 8, max: 15 }, { tier: 3, min: 11, max: 18 },
            { tier: 2, min: 14, max: 22 }, { tier: 1, min: 18, max: 28 }
        ]
    },
    {
        id: 'robust', label: 'Robust', stat: 'maxHp', slots: ['helmet', 'bodyArmour', 'amulet'],
        tiers: [
            { tier: 8, min: 6, max: 14 }, { tier: 7, min: 10, max: 20 }, { tier: 6, min: 14, max: 28 },
            { tier: 5, min: 20, max: 36 }, { tier: 4, min: 26, max: 44 }, { tier: 3, min: 32, max: 52 },
            { tier: 2, min: 38, max: 62 }, { tier: 1, min: 46, max: 72 }
        ]
    },
    {
        id: 'reinforced', label: 'Reinforced', stat: 'armour', slots: ['helmet', 'bodyArmour', 'glove'],
        tiers: [
            { tier: 8, min: 1, max: 4 }, { tier: 7, min: 2, max: 6 }, { tier: 6, min: 4, max: 9 },
            { tier: 5, min: 6, max: 12 }, { tier: 4, min: 8, max: 15 }, { tier: 3, min: 11, max: 18 },
            { tier: 2, min: 14, max: 22 }, { tier: 1, min: 18, max: 28 }
        ]
    },
    {
        id: 'quick', label: 'Quick', stat: 'attackSpeed', slots: ['weapon', 'glove', 'boot'],
        tiers: [
            { tier: 8, min: 0.01, max: 0.03 }, { tier: 7, min: 0.02, max: 0.05 }, { tier: 6, min: 0.04, max: 0.08 },
            { tier: 5, min: 0.06, max: 0.11 }, { tier: 4, min: 0.08, max: 0.14 }, { tier: 3, min: 0.11, max: 0.17 },
            { tier: 2, min: 0.14, max: 0.22 }, { tier: 1, min: 0.18, max: 0.28 }
        ]
    },
    {
        id: 'long', label: 'Long', stat: 'attackRange', slots: ['weapon'],
        tiers: [
            { tier: 8, min: 3, max: 8 }, { tier: 7, min: 5, max: 12 }, { tier: 6, min: 7, max: 15 },
            { tier: 5, min: 9, max: 18 }, { tier: 4, min: 11, max: 22 }, { tier: 3, min: 14, max: 26 },
            { tier: 2, min: 17, max: 30 }, { tier: 1, min: 20, max: 36 }
        ]
    },
    {
        id: 'deadly', label: 'Deadly', stat: 'critChance', slots: ['weapon', 'ring', 'glove'],
        tiers: [
            { tier: 8, min: 1, max: 2 }, { tier: 7, min: 1, max: 3 }, { tier: 6, min: 2, max: 4 },
            { tier: 5, min: 2, max: 5 }, { tier: 4, min: 3, max: 6 }, { tier: 3, min: 3, max: 7 },
            { tier: 2, min: 4, max: 8 }, { tier: 1, min: 5, max: 10 }
        ]
    },
    {
        id: 'cruel', label: 'Cruel', stat: 'critMultiplier', slots: ['weapon', 'amulet', 'glove'],
        tiers: [
            { tier: 8, min: 4, max: 8 }, { tier: 7, min: 6, max: 12 }, { tier: 6, min: 8, max: 15 },
            { tier: 5, min: 10, max: 18 }, { tier: 4, min: 12, max: 22 }, { tier: 3, min: 15, max: 26 },
            { tier: 2, min: 18, max: 30 }, { tier: 1, min: 22, max: 36 }
        ]
    },
    {
        id: 'regenerating', label: 'Regenerating', stat: 'hpRegen', slots: ['amulet', 'bodyArmour', 'ring'],
        tiers: [
            { tier: 8, min: 1, max: 3 }, { tier: 7, min: 2, max: 4 }, { tier: 6, min: 2, max: 6 },
            { tier: 5, min: 3, max: 7 }, { tier: 4, min: 4, max: 9 }, { tier: 3, min: 5, max: 11 },
            { tier: 2, min: 6, max: 13 }, { tier: 1, min: 8, max: 16 }
        ]
    }
];

/** @type {TieredAffixDef[]} */
export const TIERED_SUFFIXES = [
    {
        id: 'of_the_bear', label: 'of the Bear', stat: 'maxHp', slots: ['helmet', 'bodyArmour', 'ring'],
        tiers: [
            { tier: 8, min: 6, max: 14 }, { tier: 7, min: 10, max: 20 }, { tier: 6, min: 14, max: 28 },
            { tier: 5, min: 18, max: 34 }, { tier: 4, min: 22, max: 40 }, { tier: 3, min: 26, max: 46 },
            { tier: 2, min: 30, max: 52 }, { tier: 1, min: 36, max: 60 }
        ]
    },
    {
        id: 'of_the_armadillo', label: 'of the Armadillo', stat: 'armour', slots: ['helmet', 'bodyArmour', 'boot'],
        tiers: [
            { tier: 8, min: 2, max: 5 }, { tier: 7, min: 3, max: 8 }, { tier: 6, min: 5, max: 11 },
            { tier: 5, min: 6, max: 14 }, { tier: 4, min: 8, max: 17 }, { tier: 3, min: 10, max: 20 },
            { tier: 2, min: 12, max: 24 }, { tier: 1, min: 15, max: 28 }
        ]
    },
    {
        id: 'of_slaying', label: 'of Slaying', stat: 'physicalDamage', slots: ['weapon', 'glove', 'ring'],
        tiers: [
            { tier: 8, min: 1, max: 4 }, { tier: 7, min: 2, max: 6 }, { tier: 6, min: 3, max: 8 },
            { tier: 5, min: 4, max: 10 }, { tier: 4, min: 5, max: 12 }, { tier: 3, min: 6, max: 14 },
            { tier: 2, min: 8, max: 16 }, { tier: 1, min: 10, max: 20 }
        ]
    },
    {
        id: 'of_alacrity', label: 'of Alacrity', stat: 'attackSpeed', slots: ['glove', 'boot', 'weapon'],
        tiers: [
            { tier: 8, min: 0.01, max: 0.03 }, { tier: 7, min: 0.02, max: 0.05 }, { tier: 6, min: 0.04, max: 0.08 },
            { tier: 5, min: 0.06, max: 0.11 }, { tier: 4, min: 0.08, max: 0.14 }, { tier: 3, min: 0.11, max: 0.17 },
            { tier: 2, min: 0.14, max: 0.22 }, { tier: 1, min: 0.18, max: 0.28 }
        ]
    },
    {
        id: 'of_reach', label: 'of Reach', stat: 'attackRange', slots: ['weapon', 'boot'],
        tiers: [
            { tier: 8, min: 2, max: 6 }, { tier: 7, min: 4, max: 10 }, { tier: 6, min: 6, max: 13 },
            { tier: 5, min: 8, max: 16 }, { tier: 4, min: 10, max: 19 }, { tier: 3, min: 12, max: 22 },
            { tier: 2, min: 14, max: 26 }, { tier: 1, min: 18, max: 32 }
        ]
    },
    {
        id: 'of_precision', label: 'of Precision', stat: 'critChance', slots: ['weapon', 'ring', 'glove'],
        tiers: [
            { tier: 8, min: 1, max: 2 }, { tier: 7, min: 1, max: 3 }, { tier: 6, min: 2, max: 4 },
            { tier: 5, min: 2, max: 5 }, { tier: 4, min: 3, max: 6 }, { tier: 3, min: 3, max: 7 },
            { tier: 2, min: 4, max: 8 }, { tier: 1, min: 5, max: 9 }
        ]
    },
    {
        id: 'of_ferocity', label: 'of Ferocity', stat: 'critMultiplier', slots: ['weapon', 'amulet', 'ring'],
        tiers: [
            { tier: 8, min: 5, max: 10 }, { tier: 7, min: 8, max: 14 }, { tier: 6, min: 10, max: 18 },
            { tier: 5, min: 12, max: 22 }, { tier: 4, min: 15, max: 26 }, { tier: 3, min: 18, max: 30 },
            { tier: 2, min: 22, max: 34 }, { tier: 1, min: 26, max: 40 }
        ]
    },
    {
        id: 'of_the_ghost', label: 'of the Ghost', stat: 'evade', slots: ['boot', 'helmet', 'glove'],
        tiers: [
            { tier: 8, min: 1, max: 3 }, { tier: 7, min: 2, max: 5 }, { tier: 6, min: 3, max: 7 },
            { tier: 5, min: 4, max: 8 }, { tier: 4, min: 5, max: 10 }, { tier: 3, min: 6, max: 12 },
            { tier: 2, min: 7, max: 14 }, { tier: 1, min: 9, max: 17 }
        ]
    },
    {
        id: 'of_regeneration', label: 'of Regeneration', stat: 'hpRegen', slots: ['amulet', 'ring', 'bodyArmour'],
        tiers: [
            { tier: 8, min: 1, max: 3 }, { tier: 7, min: 2, max: 5 }, { tier: 6, min: 3, max: 7 },
            { tier: 5, min: 4, max: 9 }, { tier: 4, min: 5, max: 11 }, { tier: 3, min: 6, max: 13 },
            { tier: 2, min: 7, max: 15 }, { tier: 1, min: 9, max: 18 }
        ]
    }
];

/** Maps base item stats to tier tables for white items. */
export const BASE_STAT_TIER_DEF = {
    physicalDamage: 'heavy',
    maxHp: 'robust',
    armour: 'reinforced',
    attackSpeed: 'quick',
    attackRange: 'long',
    critChance: 'deadly',
    critMultiplier: 'cruel',
    hpRegen: 'regenerating',
    evade: 'of_the_ghost'
};

/** All tier bands legal at this item level (worst → best). */
export function getLegalAffixTierBands(def, ilvl) {
    return def.tiers
        .filter(t => ilvl >= TIER_MIN_ILVL[t.tier])
        .sort((a, b) => b.tier - a.tier);
}

/** Best (lowest number) tier band legal for this item level. */
export function getAffixTierBand(def, ilvl) {
    const legal = getLegalAffixTierBands(def, ilvl);
    return legal[legal.length - 1] || def.tiers[def.tiers.length - 1];
}

/** Random tier band from all legal tiers at this ilvl (T8–T1 mix on high ilvl). */
export function rollRandomAffixTierBand(def, ilvl) {
    const legal = getLegalAffixTierBands(def, ilvl);
    if (legal.length === 0) return def.tiers[def.tiers.length - 1];
    return legal[Math.floor(Math.random() * legal.length)];
}

/** @param {AffixTierBand} band @param {string} stat */
export function rollValueInTierBand(band, stat) {
    const raw = band.min + Math.random() * (band.max - band.min);
    return boostGearStatValue(raw, stat);
}

/** @param {TieredAffixDef} def @param {string} slot @param {number} ilvl */
export function rollTieredAffixValue(def, slot, ilvl) {
    if (def.slots && !def.slots.includes(slot)) return null;
    const band = rollRandomAffixTierBand(def, ilvl);
    const value = rollValueInTierBand(band, def.stat);
    return {
        id: def.id,
        label: def.label,
        stat: def.stat,
        value,
        tier: band.tier
    };
}

/** Chance weight when selecting which affix rolls — higher = more common. */
export const AFFIX_STAT_WEIGHTS = {
    maxHp: 100,
    armour: 70,
    physicalDamage: 48,
    attackSpeed: 32,
    attackRange: 22,
    hpRegen: 28,
    /** Crit rolls intentionally rare on gear */
    critMultiplier: 5,
    critChance: 4,
    evade: 8
};

/**
 * Weighted random pick from affix defs (by their stat weight).
 * @param {TieredAffixDef[]} candidates
 * @returns {TieredAffixDef|null}
 */
export function pickWeightedAffixDef(candidates) {
    if (!candidates.length) return null;
    let total = 0;
    const weights = candidates.map(def => {
        const w = AFFIX_STAT_WEIGHTS[def.stat] ?? 20;
        total += w;
        return w;
    });
    if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)];
    let roll = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
}

/** @param {TieredAffixDef[]} pool @param {string} slot @param {Set<string>} usedIds @param {number} ilvl */
export function pickTieredAffix(pool, slot, usedIds, ilvl) {
    const candidates = pool.filter(a => (!a.slots || a.slots.includes(slot)) && !usedIds.has(a.id));
    if (candidates.length === 0) return null;
    const def = pickWeightedAffixDef(candidates);
    if (!def) return null;
    const rolled = rollTieredAffixValue(def, slot, ilvl);
    if (!rolled) return null;
    usedIds.add(def.id);
    return rolled;
}

/** @param {string} stat */
export function getTierDefForBaseStat(stat) {
    const prefixId = BASE_STAT_TIER_DEF[stat];
    if (!prefixId) return null;
    return TIERED_PREFIXES.find(p => p.id === prefixId)
        || TIERED_SUFFIXES.find(s => s.id === prefixId)
        || null;
}

/** @param {Record<string, number>} templateStats @param {number} ilvl */
export function rollBaseStatsWithTiers(templateStats, ilvl) {
    const stats = {};
    const rolls = [];

    Object.entries(templateStats).forEach(([stat, templateVal]) => {
        const def = getTierDefForBaseStat(stat);
        if (def) {
            const band = rollRandomAffixTierBand(def, ilvl);
            const value = rollValueInTierBand(band, stat);
            stats[stat] = value;
            rolls.push({ stat, value, tier: band.tier });
        } else {
            const value = Math.max(1, boostGearStatValue(templateVal * gearIlvlMultiplier(ilvl), stat));
            stats[stat] = value;
            rolls.push({ stat, value, tier: 8 });
        }
    });

    return { stats, rolls };
}
