import { buildGearCompareTooltipHtml } from '../systems/gearGenerator.js';

/** Floating gear item tooltip with equipped comparison. */
export class GearTooltip {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'gear-tooltip';
        this.el.className = 'gear-tooltip';
        this.el.setAttribute('role', 'tooltip');
        this.el.hidden = true;
        document.body.appendChild(this.el);
        this._anchor = null;
        this._onMove = this._onMove.bind(this);
    }

    /**
     * @param {object} item
     * @param {HTMLElement} anchor
     * @param {object|null} [equippedItem]
     */
    show(item, anchor, equippedItem = null) {
        this._anchor = anchor;
        const hoveredIsEquipped = Boolean(equippedItem && item?.id === equippedItem.id);
        this.el.innerHTML = buildGearCompareTooltipHtml(item, equippedItem, { hoveredIsEquipped });
        this.el.hidden = false;
        this._position();
        document.addEventListener('mousemove', this._onMove);
    }

    hide() {
        this.el.hidden = true;
        this.el.innerHTML = '';
        this._anchor = null;
        document.removeEventListener('mousemove', this._onMove);
    }

    _onMove() {
        if (this._anchor) this._position();
    }

    _position() {
        if (!this._anchor) return;
        const rect = this._anchor.getBoundingClientRect();
        const tipRect = this.el.getBoundingClientRect();
        const margin = 10;

        let left = rect.right + margin;
        let top = rect.top;

        if (left + tipRect.width > window.innerWidth - 8) {
            left = rect.left - tipRect.width - margin;
        }
        if (top + tipRect.height > window.innerHeight - 8) {
            top = window.innerHeight - tipRect.height - 8;
        }
        if (top < 8) top = 8;
        if (left < 8) left = 8;

        this.el.style.left = `${left}px`;
        this.el.style.top = `${top}px`;
    }

    /**
     * @param {HTMLElement} el
     * @param {object|null} item
     * @param {() => object|null} [getEquipped]
     */
    bind(el, item, getEquipped) {
        if (!item) return;
        el.addEventListener('mouseenter', () => {
            const equipped = getEquipped?.() ?? null;
            this.show(item, el, equipped);
        });
        el.addEventListener('mouseleave', () => this.hide());
        el.addEventListener('mousedown', () => this.hide());
    }
}
