/** Fixed unique items (dark orange). */
export const UNIQUE_ITEMS = [
    {
        id: 'survivors_blade',
        name: "Survivor's Blade",
        slot: 'weapon',
        stats: { physicalDamage: 22, critChance: 6, attackSpeed: 0.1 }
    },
    {
        id: 'capybara_shell',
        name: "Capybara's Shell",
        slot: 'bodyArmour',
        stats: { maxHp: 90, armour: 28, hpRegen: 5 }
    },
    {
        id: 'summoner_focus',
        name: "Summoning Focus",
        slot: 'amulet',
        stats: { attackRange: 40, physicalDamage: 8, hpRegen: 4 }
    },
    {
        id: 'ring_of_endurance',
        name: 'Ring of Endurance',
        slot: 'ring',
        stats: { maxHp: 45, hpRegen: 8, evade: 5 }
    },
    {
        id: 'windwalker_boots',
        name: 'Windwalker Boots',
        slot: 'boot',
        stats: { evade: 15, attackSpeed: 0.12, attackRange: 15 }
    },
    {
        id: 'iron_crown',
        name: 'Iron Crown',
        slot: 'helmet',
        stats: { armour: 25, maxHp: 40, physicalDamage: 5 }
    },
    {
        id: 'berserker_grip',
        name: "Berserker's Grip",
        slot: 'glove',
        stats: { physicalDamage: 12, attackSpeed: 0.15, critMultiplier: 20 }
    }
];

/** @param {string} slot */
export function pickUniqueForSlot(slot) {
    const pool = UNIQUE_ITEMS.filter(u => u.slot === slot);
    if (pool.length === 0) return UNIQUE_ITEMS[Math.floor(Math.random() * UNIQUE_ITEMS.length)];
    return pool[Math.floor(Math.random() * pool.length)];
}

/** @param {string} id */
export function getUniqueById(id) {
    return UNIQUE_ITEMS.find(u => u.id === id);
}
