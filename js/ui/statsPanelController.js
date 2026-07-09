import { panelsStartCollapsed } from '../utils/viewport.js';

/**
 * Collapsible combat stat grid in the HUD (collapsed by default on mobile).
 */
export class StatsPanelController {
    constructor() {
        this.els = {
            panel: document.getElementById('player-stats'),
            toggle: document.getElementById('stats-detail-toggle'),
            grid: document.querySelector('#player-stats .stats-grid')
        };
        this.expanded = !panelsStartCollapsed();
        this._onResize = () => this._syncDefaultForViewport();

        this.els.toggle?.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this._onResize);
        }

        this.syncDom();
    }

    toggle(forceExpanded) {
        if (typeof forceExpanded === 'boolean') {
            this.expanded = forceExpanded;
        } else {
            this.expanded = !this.expanded;
        }
        this.syncDom();
    }

    isExpanded() {
        return this.expanded;
    }

    syncDom() {
        this.els.panel?.classList.toggle('stats-panel--detail-expanded', this.expanded);
        this.els.panel?.classList.toggle('stats-panel--detail-collapsed', !this.expanded);
        this.els.toggle?.setAttribute('aria-expanded', String(this.expanded));
    }

    /** @private */
    _syncDefaultForViewport() {
        this.expanded = !panelsStartCollapsed();
        this.syncDom();
    }

    destroy() {
        if (this._onResize && typeof window !== 'undefined') {
            window.removeEventListener('resize', this._onResize);
        }
    }
}
