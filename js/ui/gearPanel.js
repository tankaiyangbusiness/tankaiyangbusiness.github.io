import { RARITY_CONFIG } from '../config/gearRarity.js';
import { panelsStartCollapsed } from '../utils/viewport.js';
import {
    GEAR_DOLL_LAYOUT,
    getSlotIconHtml,
    getSlotShortLabel
} from './gearIcons.js';
import { GearTooltip } from './gearTooltip.js';
import { FILTERABLE_RARITIES } from '../systems/gearLootFilter.js';

const BULK_DELETE_RARITIES = ['normal', 'magic', 'rare'];

const BULK_DELETE_LABELS = {
    normal: 'Normal (white)',
    magic: 'Magic (blue)',
    rare: 'Rare (yellow)'
};

/**
 * Collapsible gear panel — PoE-style paper doll + compact inventory grid.
 */
export class GearPanel {
    /**
     * @param {import('../systems/gearInventory.js').GearInventory} inventory
     * @param {(itemId: string) => void} onEquip
     * @param {(slot: string) => void} onUnequip
     * @param {(itemId: string) => void} [onDelete]
     * @param {(rarity: string) => void} [onBulkDelete]
     * @param {import('../systems/gearLootFilter.js').GearLootFilter} [lootFilter]
     */
    constructor(inventory, onEquip, onUnequip, onDelete, onBulkDelete, lootFilter) {
        this.inventory = inventory;
        this.lootFilter = lootFilter;
        this.onEquip = onEquip;
        this.onUnequip = onUnequip;
        this.onDelete = onDelete;
        this.onBulkDelete = onBulkDelete;
        this.expanded = !panelsStartCollapsed();
        this.tooltip = new GearTooltip();
        this._pendingBulkRarity = null;

        this.els = {
            panel: document.getElementById('gear-panel'),
            toggle: document.getElementById('gear-panel-toggle'),
            badge: document.getElementById('gear-panel-count'),
            slots: document.getElementById('gear-slots'),
            toolbar: document.getElementById('gear-inv-toolbar'),
            list: document.getElementById('gear-inventory-list'),
            bulkConfirm: document.getElementById('gear-bulk-confirm'),
            bulkConfirmText: document.getElementById('gear-bulk-confirm-text'),
            bulkConfirmYes: document.getElementById('gear-bulk-confirm-yes'),
            bulkConfirmNo: document.getElementById('gear-bulk-confirm-no'),
            filterBar: document.getElementById('gear-filter-bar')
        };

        this.els.toggle?.addEventListener('click', () => this.toggle());
        this._bindToolbar();
        this._bindFilterBar();
        this._bindBulkConfirm();
        this._applyExpandedClasses();
        if (this.expanded) this.refresh();
    }

    _bindToolbar() {
        this.els.toolbar?.querySelectorAll('[data-bulk-rarity]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._requestBulkDelete(btn.dataset.bulkRarity);
            });
        });
    }

    _bindFilterBar() {
        this.els.filterBar?.querySelectorAll('[data-filter-rarity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const rarity = btn.dataset.filterRarity;
                if (!this.lootFilter || !FILTERABLE_RARITIES.includes(rarity)) return;
                const active = this.lootFilter.toggle(rarity);
                btn.classList.toggle('gear-filter-active', active);
                btn.setAttribute('aria-pressed', String(active));
            });
        });
    }

    _bindBulkConfirm() {
        this.els.bulkConfirmYes?.addEventListener('click', () => {
            const rarity = this._pendingBulkRarity;
            this._hideBulkConfirm();
            if (rarity) this.onBulkDelete?.(rarity);
        });
        this.els.bulkConfirmNo?.addEventListener('click', () => this._hideBulkConfirm());
    }

    _requestBulkDelete(rarity) {
        const count = this.inventory.items.filter(i => i.rarity === rarity).length;
        if (count <= 0) return;

        const label = BULK_DELETE_LABELS[rarity] || rarity;
        this._pendingBulkRarity = rarity;
        if (this.els.bulkConfirmText) {
            this.els.bulkConfirmText.textContent =
                `Delete all ${count} ${label} item${count > 1 ? 's' : ''}?`;
        }
        this.els.bulkConfirm?.classList.add('gear-bulk-confirm-visible');
    }

    _hideBulkConfirm() {
        this._pendingBulkRarity = null;
        this.els.bulkConfirm?.classList.remove('gear-bulk-confirm-visible');
    }

    _applyExpandedClasses() {
        this.els.panel?.classList.toggle('gear-panel-expanded', this.expanded);
        this.els.panel?.classList.toggle('gear-panel-collapsed', !this.expanded);
    }

    toggle(forceExpanded) {
        this.expanded = typeof forceExpanded === 'boolean' ? forceExpanded : !this.expanded;
        this._applyExpandedClasses();
        if (!this.expanded) {
            this.tooltip.hide();
            this._hideBulkConfirm();
        }
        if (this.expanded) this.refresh();
    }

    isExpanded() {
        return this.expanded;
    }

    updateBadge(count) {
        if (!this.els.badge) return;
        this.els.badge.textContent = String(count);
        this.els.badge.classList.toggle('gear-panel-badge-hidden', count <= 0);
    }

    refresh() {
        this.updateBadge(this.inventory.items.length);
        this._renderDoll();
        this._renderInventory();
    }

    _renderDoll() {
        if (!this.els.slots) return;

        this.els.slots.innerHTML = GEAR_DOLL_LAYOUT.map(cell => {
            if (!cell.slot) {
                return `<div class="gear-doll-cell gear-doll-empty" data-area="${cell.area}"></div>`;
            }

            const slot = cell.slot;
            const item = this.inventory.equipped[slot];
            const rarity = item ? RARITY_CONFIG[item.rarity] : null;
            const icon = getSlotIconHtml(slot);
            const label = getSlotShortLabel(slot);

            if (!item) {
                return `
                    <div class="gear-doll-cell gear-slot gear-slot-empty" data-area="${cell.area}" data-slot="${slot}">
                        <span class="gear-slot-icon">${icon}</span>
                        <span class="gear-slot-label">${label}</span>
                    </div>
                `;
            }

            return `
                <div class="gear-doll-cell gear-slot gear-slot-filled ${rarity.cssClass}" data-area="${cell.area}" data-slot="${slot}"
                    style="--gear-rarity-color:${rarity.color}">
                    <span class="gear-slot-label">${label}</span>
                    <span class="gear-slot-divider" aria-hidden="true"></span>
                    <span class="gear-slot-icon">${icon}</span>
                    <button type="button" class="gear-unequip-btn" data-slot="${slot}" aria-label="Unequip ${label}">×</button>
                </div>
            `;
        }).join('');

        this.els.slots.querySelectorAll('.gear-slot-filled').forEach(el => {
            const slot = el.dataset.slot;
            const item = this.inventory.equipped[slot];
            this.tooltip.bind(el, item, () => this.inventory.equipped[slot]);
        });

        this.els.slots.querySelectorAll('.gear-unequip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tooltip.hide();
                this.onUnequip(btn.dataset.slot);
            });
        });
    }

    _renderInventory() {
        if (!this.els.list) return;

        if (this.inventory.items.length === 0) {
            this.els.list.innerHTML = '<p class="gear-empty">No items yet</p>';
            return;
        }

        this.els.list.innerHTML = this.inventory.items.map(item => {
            const r = RARITY_CONFIG[item.rarity];
            const icon = getSlotIconHtml(item.slot);
            return `
                <button type="button" class="gear-inv-item ${r.cssClass}" data-id="${item.id}"
                    style="--gear-rarity-color:${r.color}">
                    <span class="gear-inv-icon">${icon}</span>
                </button>
            `;
        }).join('');

        this.els.list.querySelectorAll('.gear-inv-item').forEach(btn => {
            const item = this.inventory.items.find(i => i.id === btn.dataset.id);
            this.tooltip.bind(btn, item, () => this.inventory.equipped[item.slot]);

            btn.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    this.tooltip.hide();
                    this.onDelete?.(btn.dataset.id);
                    return;
                }
                this.tooltip.hide();
                this.onEquip(btn.dataset.id);
            });
        });
    }

    reset() {
        this.expanded = !panelsStartCollapsed();
        this.tooltip.hide();
        this._hideBulkConfirm();
        this.lootFilter?.reset();
        this.els.filterBar?.querySelectorAll('[data-filter-rarity]').forEach(btn => {
            btn.classList.remove('gear-filter-active');
            btn.setAttribute('aria-pressed', 'false');
        });
        this._applyExpandedClasses();
        this.refresh();
    }

    pulseNewLoot() {
        this.els.panel?.classList.add('gear-panel-loot-pulse');
        setTimeout(() => this.els.panel?.classList.remove('gear-panel-loot-pulse'), 600);
    }
}

export { BULK_DELETE_RARITIES };
