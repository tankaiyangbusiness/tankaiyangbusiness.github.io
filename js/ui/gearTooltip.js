import { buildGearCompareTooltipHtml } from '../systems/gearGenerator.js';
import { positionFloatingTooltip } from '../utils/floatingTooltip.js';

/** Floating gear item tooltip with equipped comparison. */
export class GearTooltip {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'gear-tooltip';
        this.el.className = 'gear-tooltip floating-tooltip';
        this.el.setAttribute('role', 'tooltip');
        this.el.hidden = true;
        document.body.appendChild(this.el);
        this._clientX = 0;
        this._clientY = 0;
        this._onMove = this._onMove.bind(this);
    }

    /**
     * @param {object} item
     * @param {HTMLElement} anchor
     * @param {object|null} [equippedItem]
     * @param {number} [clientX]
     * @param {number} [clientY]
     */
    show(item, anchor, equippedItem = null, clientX, clientY) {
        this._anchor = anchor;
        const hoveredIsEquipped = Boolean(equippedItem && item?.id === equippedItem.id);
        this.el.innerHTML = buildGearCompareTooltipHtml(item, equippedItem, { hoveredIsEquipped });
        const rect = anchor.getBoundingClientRect();
        this._clientX = clientX ?? rect.left + rect.width / 2;
        this._clientY = clientY ?? rect.top + rect.height / 2;
        positionFloatingTooltip(this.el, this._clientX, this._clientY);
        document.addEventListener('mousemove', this._onMove);
    }

    hide() {
        this.el.hidden = true;
        this.el.innerHTML = '';
        this._anchor = null;
        document.removeEventListener('mousemove', this._onMove);
    }

    _onMove(event) {
        this._clientX = event.clientX;
        this._clientY = event.clientY;
        if (!this.el.hidden) {
            positionFloatingTooltip(this.el, this._clientX, this._clientY);
        }
    }

    /**
     * @param {HTMLElement} el
     * @param {object|null} item
     * @param {() => object|null} [getEquipped]
     */
    bind(el, item, getEquipped) {
        if (!item) return;
        el.addEventListener('mouseenter', (event) => {
            const equipped = getEquipped?.() ?? null;
            this.show(item, el, equipped, event.clientX, event.clientY);
        });
        el.addEventListener('mousemove', (event) => {
            if (this.el.hidden) return;
            this._clientX = event.clientX;
            this._clientY = event.clientY;
            positionFloatingTooltip(this.el, this._clientX, this._clientY);
        });
        el.addEventListener('mouseleave', () => this.hide());
        el.addEventListener('mousedown', () => this.hide());
    }
}
