import { GEAR_SLOTS, createEmptyEquipment } from '../config/gearSlots.js';
import { getItemStatTotals } from './gearGenerator.js';

/** Manages inventory and equipment with stat apply/remove. */
export class GearInventory {
    /** @param {number} maxSize */
    constructor(maxSize = 28) {
        this.maxSize = maxSize;
        this.items = [];
        this.equipped = createEmptyEquipment();
        /** Stats currently applied from gear (for unequip). */
        this._appliedTotals = {};
    }

    reset() {
        this.items = [];
        this.equipped = createEmptyEquipment();
        this._appliedTotals = {};
    }

    /** @param {object} item @returns {boolean} */
    addItem(item) {
        if (this.items.length >= this.maxSize) return false;
        this.items.push(item);
        return true;
    }

    /** @param {string} itemId */
    removeItem(itemId) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx === -1) return null;
        return this.items.splice(idx, 1)[0];
    }

    /** @param {string[]} rarities @returns {number} count removed */
    removeByRarities(rarities) {
        const before = this.items.length;
        this.items = this.items.filter(i => !rarities.includes(i.rarity));
        return before - this.items.length;
    }

    /** @param {string} itemId @param {object} stats — mutable player stats */
    equip(itemId, stats) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx === -1) return false;
        const item = this.items[idx];
        const slot = item.slot;

        if (this.equipped[slot]) {
            this.unequip(slot, stats);
        }

        this.items.splice(idx, 1);
        this.equipped[slot] = item;
        this._applyItemStats(item, stats, 1);
        return true;
    }

    /** @param {string} slot @param {object} stats */
    unequip(slot, stats) {
        const item = this.equipped[slot];
        if (!item) return null;
        this._applyItemStats(item, stats, -1);
        this.equipped[slot] = null;
        this.addItem(item);
        return item;
    }

    /** @param {object} item @param {object} stats @param {1|-1} dir */
    _applyItemStats(item, stats, dir) {
        const totals = getItemStatTotals(item);
        Object.entries(totals).forEach(([key, val]) => {
            if (stats[key] === undefined) return;
            stats[key] += val * dir;
            if (key === 'maxHp' && dir === 1) stats.hp += val;
            if (key === 'maxHp' && dir === -1) {
                stats.hp = Math.min(stats.hp, stats.maxHp);
            }
        });
    }

    /** Total stats from all equipped gear (read-only). */
    getEquippedTotals() {
        const totals = {};
        GEAR_SLOTS.forEach(slot => {
            const item = this.equipped[slot];
            if (!item) return;
            const itemTotals = getItemStatTotals(item);
            Object.entries(itemTotals).forEach(([k, v]) => {
                totals[k] = (totals[k] || 0) + v;
            });
        });
        return totals;
    }

    getEquippedCount() {
        return GEAR_SLOTS.filter(s => this.equipped[s]).length;
    }
}
