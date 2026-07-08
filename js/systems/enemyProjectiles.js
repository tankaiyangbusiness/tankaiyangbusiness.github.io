/**
 * Tracks enemy archer (and similar) projectiles for reliable cleanup on pause/game over.
 */
export class EnemyProjectileManager {
    /** @param {import('../game/gameState.js').GameState} state */
    constructor(state) {
        this.state = state;
        /** @type {Array<{ el: HTMLElement, animId: number|null }>} */
        this.projectiles = [];
    }

    /**
     * @param {HTMLElement} el
     * @param {() => void} onTick
     * @returns {() => void} cancel
     */
    track(el, onTick) {
        const entry = { el, animId: null };
        this.projectiles.push(entry);

        const step = () => {
            if (!this.projectiles.includes(entry)) return;
            if (this.state.gamePaused || this.state.gameOver) {
                this._removeEntry(entry);
                return;
            }
            const keepAlive = onTick();
            if (!keepAlive) {
                this._removeEntry(entry);
                return;
            }
            entry.animId = requestAnimationFrame(step);
            this.state.trackAnimation(entry.animId);
        };

        entry.animId = requestAnimationFrame(step);
        this.state.trackAnimation(entry.animId);

        return () => this._removeEntry(entry);
    }

    /** @param {{ el: HTMLElement, animId: number|null }} entry */
    _removeEntry(entry) {
        if (entry.animId) this.state.cancelAnimation(entry.animId);
        entry.el?.remove();
        const idx = this.projectiles.indexOf(entry);
        if (idx !== -1) this.projectiles.splice(idx, 1);
    }

    clearAll() {
        [...this.projectiles].forEach(entry => this._removeEntry(entry));
    }
}
