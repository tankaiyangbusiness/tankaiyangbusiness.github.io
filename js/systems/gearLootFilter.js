/** @typedef {'normal'|'magic'|'rare'} AutoDeleteRarity */

const FILTERABLE_RARITIES = /** @type {const} */ (['normal', 'magic', 'rare']);

/** Tracks auto-delete filters for incoming gear drops. */
export class GearLootFilter {
    constructor() {
        /** @type {Record<AutoDeleteRarity, boolean>} */
        this.autoDelete = { normal: false, magic: false, rare: false };
    }

    reset() {
        this.autoDelete = { normal: false, magic: false, rare: false };
    }

    /** @param {AutoDeleteRarity} rarity */
    toggle(rarity) {
        if (!FILTERABLE_RARITIES.includes(rarity)) return false;
        this.autoDelete[rarity] = !this.autoDelete[rarity];
        return this.autoDelete[rarity];
    }

    /** @param {string} rarity */
    shouldAutoDelete(rarity) {
        return Boolean(this.autoDelete[rarity]);
    }

    /** @param {AutoDeleteRarity} rarity */
    isActive(rarity) {
        return Boolean(this.autoDelete[rarity]);
    }
}

export { FILTERABLE_RARITIES };
