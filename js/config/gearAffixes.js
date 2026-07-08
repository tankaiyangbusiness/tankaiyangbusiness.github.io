/**
 * Path of Exile–inspired affix pools (simplified for Survivor Arena stats).
 * Prefixes and suffixes are rolled separately; tiers use a single value band.
 */

/** @typedef {{ id: string, label: string, stat: string, min: number, max: number, slots?: string[] }} AffixDef */

/** @type {AffixDef[]} */
export const PREFIXES = [
    { id: 'heavy', label: 'Heavy', stat: 'physicalDamage', min: 4, max: 18, slots: ['weapon', 'glove'] },
    { id: 'tyrannical', label: 'Tyrannical', stat: 'physicalDamage', min: 10, max: 28, slots: ['weapon'] },
    { id: 'robust', label: 'Robust', stat: 'maxHp', min: 15, max: 55, slots: ['helmet', 'bodyArmour', 'amulet'] },
    { id: 'stout', label: 'Stout', stat: 'maxHp', min: 8, max: 30, slots: ['helmet', 'bodyArmour', 'ring', 'amulet'] },
    { id: 'reinforced', label: 'Reinforced', stat: 'armour', min: 5, max: 22, slots: ['helmet', 'bodyArmour', 'glove'] },
    { id: 'fortified', label: 'Fortified', stat: 'armour', min: 12, max: 35, slots: ['bodyArmour', 'helmet'] },
    { id: 'quick', label: 'Quick', stat: 'attackSpeed', min: 0.05, max: 0.18, slots: ['weapon', 'glove', 'boot'] },
    { id: 'long', label: 'Long', stat: 'attackRange', min: 8, max: 35, slots: ['weapon'] },
    { id: 'deadly', label: 'Deadly', stat: 'critChance', min: 2, max: 8, slots: ['weapon', 'ring', 'glove'] },
    { id: 'lethal', label: 'Lethal', stat: 'critMultiplier', min: 8, max: 25, slots: ['weapon', 'amulet'] },
    { id: 'evasive', label: 'Evasive', stat: 'evade', min: 3, max: 12, slots: ['boot', 'glove', 'helmet'] },
    { id: 'regenerating', label: 'Regenerating', stat: 'hpRegen', min: 2, max: 12, slots: ['amulet', 'bodyArmour', 'ring'] }
];

/** @type {AffixDef[]} */
export const SUFFIXES = [
    { id: 'of_the_bear', label: 'of the Bear', stat: 'maxHp', min: 12, max: 45, slots: ['helmet', 'bodyArmour', 'ring'] },
    { id: 'of_the_whale', label: 'of the Whale', stat: 'maxHp', min: 25, max: 70, slots: ['bodyArmour', 'amulet'] },
    { id: 'of_the_armadillo', label: 'of the Armadillo', stat: 'armour', min: 6, max: 24, slots: ['helmet', 'bodyArmour', 'boot'] },
    { id: 'of_slaying', label: 'of Slaying', stat: 'physicalDamage', min: 3, max: 14, slots: ['weapon', 'glove', 'ring'] },
    { id: 'of_alacrity', label: 'of Alacrity', stat: 'attackSpeed', min: 0.04, max: 0.15, slots: ['glove', 'boot', 'weapon'] },
    { id: 'of_reach', label: 'of Reach', stat: 'attackRange', min: 6, max: 28, slots: ['weapon', 'boot'] },
    { id: 'of_precision', label: 'of Precision', stat: 'critChance', min: 2, max: 7, slots: ['weapon', 'ring', 'glove'] },
    { id: 'of_ferocity', label: 'of Ferocity', stat: 'critMultiplier', min: 10, max: 30, slots: ['weapon', 'amulet'] },
    { id: 'of_the_ghost', label: 'of the Ghost', stat: 'evade', min: 4, max: 14, slots: ['boot', 'helmet', 'glove'] },
    { id: 'of_regeneration', label: 'of Regeneration', stat: 'hpRegen', min: 3, max: 15, slots: ['amulet', 'ring', 'bodyArmour'] },
    { id: 'of_the_falcon', label: 'of the Falcon', stat: 'critChance', min: 3, max: 9, slots: ['ring', 'amulet'] },
    { id: 'of_the_tortoise', label: 'of the Tortoise', stat: 'armour', min: 4, max: 18, slots: ['helmet', 'boot', 'glove'] }
];

/** @param {AffixDef} def @param {string} slot @param {number} [ilvl] */
export function rollAffixValue(def, slot, ilvl = 1) {
    if (def.slots && !def.slots.includes(slot)) return null;
    const scale = 1 + Math.min(ilvl, 40) * 0.02;
    const raw = def.min + Math.random() * (def.max - def.min);
    const val = def.stat === 'attackSpeed' ? raw * scale : Math.floor(raw * scale);
    return { id: def.id, label: def.label, stat: def.stat, value: val };
}

/** @param {AffixDef[]} pool @param {string} slot @param {Set<string>} usedIds @param {number} ilvl */
export function pickAffix(pool, slot, usedIds, ilvl) {
    const candidates = pool.filter(a => (!a.slots || a.slots.includes(slot)) && !usedIds.has(a.id));
    if (candidates.length === 0) return null;
    const def = candidates[Math.floor(Math.random() * candidates.length)];
    usedIds.add(def.id);
    return rollAffixValue(def, slot, ilvl);
}
