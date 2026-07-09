import { ENEMY_GUIDE_ENTRIES } from '../config/enemyGuide.js';
import { isMobileViewport, MOBILE_BREAKPOINT_PX } from '../utils/viewport.js';

const PANEL_WIDTH_PX = 300;
const PANEL_GAP_PX = 8;
const PLACEMENT_CLASSES = ['placement-right', 'placement-left', 'placement-center'];

/**
 * Collapsible enemy-type hint panel (collapsed by default).
 */
export class EnemyGuidePanel {
    constructor() {
        this.root = document.getElementById('enemy-guide-panel');
        this.toggleBtn = document.getElementById('enemy-guide-toggle');
        this.body = document.getElementById('enemy-guide-body');
        this.expanded = false;
        this._pausedHidden = false;

        if (!this.root) return;

        this._resetDomState();
        this._renderEntries();
        this.toggleBtn?.addEventListener('click', () => this.toggle());
    }

    _resetDomState() {
        if (!this.root) return;
        this.root.classList.remove('expanded', ...PLACEMENT_CLASSES);
        this.root.classList.remove('enemy-guide-panel--paused-hidden');
        this.toggleBtn?.setAttribute('aria-expanded', 'false');
        this.expanded = false;
        this._pausedHidden = false;
    }

    _renderEntries() {
        if (!this.body) return;
        this.body.innerHTML = ENEMY_GUIDE_ENTRIES.map(entry => `
            <div class="enemy-guide-row" data-type="${entry.type}">
                <span class="enemy-guide-swatch" style="background:${entry.color}"></span>
                <div class="enemy-guide-text">
                    <div class="enemy-guide-title">
                        <strong style="color:${entry.color}">${entry.label}</strong>
                        <span class="enemy-guide-tag">${entry.tag}</span>
                    </div>
                    <p class="enemy-guide-desc">${entry.description}</p>
                </div>
            </div>
        `).join('');
    }

    toggle() {
        this.expanded = !this.expanded;
        this.root?.classList.toggle('expanded', this.expanded);
        if (this.toggleBtn) {
            this.toggleBtn.setAttribute('aria-expanded', String(this.expanded));
        }
        if (this.expanded) {
            this._updateBodyPlacement();
        } else {
            this.root?.classList.remove(...PLACEMENT_CLASSES);
        }
    }

    collapse() {
        this.expanded = false;
        this.root?.classList.remove('expanded', ...PLACEMENT_CLASSES);
        this.toggleBtn?.setAttribute('aria-expanded', 'false');
    }

    /** Hide the entire panel while the game is paused (ESC menu). */
    setPausedHidden(hidden) {
        this._pausedHidden = hidden;
        if (!this.root) return;
        this.root.classList.toggle('enemy-guide-panel--paused-hidden', hidden);
        if (hidden) this.collapse();
    }

    isPausedHidden() {
        return this._pausedHidden;
    }

    /**
     * Prefer opening to the right of the toggle; flip left or center when cramped.
     * @param {number} [viewportWidth]
     */
    _updateBodyPlacement(viewportWidth = typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT_PX + 1) {
        if (!this.root || !this.toggleBtn) return;

        this.root.classList.remove(...PLACEMENT_CLASSES);

        if (isMobileViewport(viewportWidth)) {
            this.root.classList.add('placement-center');
            return;
        }

        const toggleRect = this.toggleBtn.getBoundingClientRect();
        const bodyWidth = Math.min(PANEL_WIDTH_PX, viewportWidth - 24);
        const spaceRight = viewportWidth - toggleRect.right - PANEL_GAP_PX;
        const spaceLeft = toggleRect.left - PANEL_GAP_PX;

        if (spaceRight >= bodyWidth) {
            this.root.classList.add('placement-right');
        } else if (spaceLeft >= bodyWidth) {
            this.root.classList.add('placement-left');
        } else {
            this.root.classList.add('placement-center');
        }
    }
}
