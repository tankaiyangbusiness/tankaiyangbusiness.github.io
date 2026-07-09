import { GAME_SPEED_OPTIONS, setTimeScale } from '../systems/gameClock.js';

/**
 * In-game 1× / 2× / 4× speed buttons below the timer.
 */
export class GameSpeedControls {
    /**
     * @param {import('../game/gameState.js').GameState} state
     * @param {HTMLElement} [root]
     */
    constructor(state, root = document.getElementById('game-speed-controls')) {
        this.state = state;
        this.root = root;
        this._buttons = [];

        if (!this.root) return;

        this._buttons = [...this.root.querySelectorAll('[data-speed]')];
        this._buttons.forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const speed = Number(btn.dataset.speed);
                this.setSpeed(speed);
            });
        });

        this.syncUi();
    }

    /** @param {number} speed */
    setSpeed(speed) {
        if (!GAME_SPEED_OPTIONS.includes(speed)) return;
        setTimeScale(this.state, speed);
        this._applyDomSpeed(speed);
        this.syncUi();
    }

    syncUi() {
        const active = this.state.timeScale ?? 1;
        this._buttons.forEach(btn => {
            const speed = Number(btn.dataset.speed);
            const isActive = speed === active;
            btn.classList.toggle('game-speed-btn-active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    /** @private */
    _applyDomSpeed(speed) {
        document.documentElement.style.setProperty('--game-speed', String(speed));
        const container = document.getElementById('game-container');
        container?.style.setProperty('--game-speed', String(speed));
    }

    destroy() {
        this._buttons = [];
        this.root = null;
    }
}
