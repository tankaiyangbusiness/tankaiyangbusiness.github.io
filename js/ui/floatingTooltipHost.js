import { positionFloatingTooltip } from '../utils/floatingTooltip.js';

/** Single floating tooltip element that follows the pointer. */
export class FloatingTooltipHost {
    /**
     * @param {string} [className]
     * @param {HTMLElement} [parent]
     */
    constructor(className = 'floating-tooltip', parent = document.body) {
        this.el = document.createElement('div');
        this.el.className = className;
        this.el.setAttribute('role', 'tooltip');
        this.el.hidden = true;
        parent.appendChild(this.el);
        this._onMove = this._onMove.bind(this);
        this._trackingMove = false;
    }

    /**
     * @param {string} html
     * @param {number} clientX
     * @param {number} clientY
     */
    show(html, clientX, clientY) {
        this.el.innerHTML = html;
        this.el.hidden = false;
        this.reposition(clientX, clientY);
        this._bindDocumentMove();
    }

    /**
     * @param {number} clientX
     * @param {number} clientY
     */
    reposition(clientX, clientY) {
        if (this.el.hidden) return;
        positionFloatingTooltip(this.el, clientX, clientY);
    }

    hide() {
        this.el.hidden = true;
        this.el.innerHTML = '';
        this._unbindDocumentMove();
    }

    destroy() {
        this.hide();
        this.el.remove();
    }

    /** @private */
    _bindDocumentMove() {
        if (this._trackingMove) return;
        document.addEventListener('mousemove', this._onMove);
        this._trackingMove = true;
    }

    /** @private */
    _unbindDocumentMove() {
        if (!this._trackingMove) return;
        document.removeEventListener('mousemove', this._onMove);
        this._trackingMove = false;
    }

    /** @private */
    _onMove(event) {
        if (this.el.hidden) return;
        positionFloatingTooltip(this.el, event.clientX, event.clientY);
    }
}
