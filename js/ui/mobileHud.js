import { isMobileViewport, MOBILE_BREAKPOINT_PX } from '../utils/viewport.js';

/**
 * Applies mobile-only HUD behaviour without altering desktop layout/CSS.
 * Collapses gear/upgrade panels, toggles the root layout class for mobile.css,
 * and wires the in-game menu button (ESC equivalent on touch devices).
 */
export class MobileHudController {
    constructor() {
        /** @type {(() => void)|null} */
        this._onResize = null;
        /** @type {(() => void)|null} */
        this._onMenuPress = null;
        /** @type {HTMLButtonElement|null} */
        this._menuBtn = null;
        /** @type {((e: Event) => void)|null} */
        this._menuClickHandler = null;

        if (typeof document !== 'undefined') {
            this._menuBtn = document.getElementById('mobile-menu-btn');
        }

        if (typeof window !== 'undefined') {
            this._onResize = () => this.syncLayoutClass();
            window.addEventListener('resize', this._onResize);
            this.syncLayoutClass();
        }
    }

    /** Sync `layout-mobile` on <html> for CSS hooks + panel defaults. */
    syncLayoutClass() {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('layout-mobile', isMobileViewport());
        this._syncMenuButtonDom();
    }

    /**
     * Wire the mobile menu button to the same handler as keyboard Escape.
     * @param {() => void} onMenuPress
     */
    bindMenuButton(onMenuPress) {
        this._onMenuPress = onMenuPress;
        if (!this._menuBtn || this._menuClickHandler) return;

        this._menuClickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this._onMenuPress?.();
        };
        this._menuBtn.addEventListener('click', this._menuClickHandler);
    }

    /**
     * Show the menu button only during active gameplay on mobile viewports.
     * @param {boolean} visible
     */
    setGameplayMenuVisible(visible) {
        this._gameplayMenuVisible = visible;
        this._syncMenuButtonDom();
    }

    /**
     * Call after in-game panels are constructed for a new run.
     * @param {{ gearPanel?: { toggle: (v: boolean) => void }, upgradePanel?: { toggle: (v: boolean) => void }, enemyGuidePanel?: { collapse?: () => void } }} panels
     */
    applyForGame(panels) {
        this.syncLayoutClass();
        if (!isMobileViewport()) return;

        panels.gearPanel?.toggle(false);
        panels.upgradePanel?.toggle(false);
        panels.enemyGuidePanel?.collapse?.();
    }

    destroy() {
        if (this._menuBtn && this._menuClickHandler) {
            this._menuBtn.removeEventListener('click', this._menuClickHandler);
        }
        if (this._onResize && typeof window !== 'undefined') {
            window.removeEventListener('resize', this._onResize);
        }
        this._onResize = null;
        this._onMenuPress = null;
        this._menuClickHandler = null;
        this._menuBtn = null;
    }

    /** @private */
    _syncMenuButtonDom() {
        if (!this._menuBtn) return;
        const show = Boolean(this._gameplayMenuVisible) && isMobileViewport();
        this._menuBtn.hidden = !show;
    }
}

export { MOBILE_BREAKPOINT_PX, isMobileViewport };
