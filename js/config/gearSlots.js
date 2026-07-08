/** All equippable gear slots. */
export const GEAR_SLOTS = /** @type {const} */ ([
    'weapon', 'helmet', 'bodyArmour', 'boot', 'ring', 'amulet', 'glove'
]);

/** @typedef {'weapon'|'helmet'|'bodyArmour'|'boot'|'ring'|'amulet'|'glove'} GearSlot */
/** @typedef {'normal'|'magic'|'rare'|'unique'} GearRarity */

/** Base item templates per slot (normal white items). */
export const GEAR_BASES = {
    weapon: { label: 'Sword', stats: { physicalDamage: 14 } },
    helmet: { label: 'Helm', stats: { armour: 10 } },
    bodyArmour: { label: 'Chestplate', stats: { armour: 22, maxHp: 50 } },
    boot: { label: 'Boots', stats: { evade: 8 } },
    ring: { label: 'Ring', stats: { critChance: 5 } },
    amulet: { label: 'Amulet', stats: { hpRegen: 5 } },
    glove: { label: 'Gloves', stats: { attackSpeed: 0.12 } }
};

/** @param {GearSlot} slot */
export function getBaseForSlot(slot) {
    return GEAR_BASES[slot] || GEAR_BASES.weapon;
}

/** @returns {Record<GearSlot, null>} */
export function createEmptyEquipment() {
    return Object.fromEntries(GEAR_SLOTS.map(s => [s, null]));
}
