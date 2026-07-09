/**
 * Sim-time enemy projectiles — batch tick, pooled DOM, sub-stepped movement (no tunneling at 4×).
 */
import { getRuntimeBudgets } from './runtimeBudget.js';
import { RUNTIME_BUDGET } from '../config/runtimeBudget.js';
import { DomPool } from '../utils/domPool.js';
import { distanceVw, distancePointToSegmentPx } from '../utils/math.js';

/**
 * @typedef {object} EnemyProjectileSpec
 * @property {number} x vw
 * @property {number} y vh
 * @property {string} [ownerId] Living enemy id — projectiles are culled when owner dies.
 * @property {() => void} onHit Called when the projectile reaches the player.
 */

/**
 * @typedef {object} EnemyProjectileTickContext
 * @property {() => { x: number, y: number }} getPlayerPosition
 * @property {number} innerWidth
 * @property {number} innerHeight
 */

export class EnemyProjectileManager {
    /**
     * @param {import('../game/gameState.js').GameState} state
     * @param {HTMLElement} container
     */
    constructor(state, container) {
        this.state = state;
        this.container = container;
        const budgets = getRuntimeBudgets();
        this._maxProjectiles = budgets.maxProjectiles;
        this._speedVwPerSec = budgets.projectileSpeedVwPerSec;
        this._maxStepVw = budgets.projectileMaxStepVw;
        this._hitRadius = budgets.projectileHitRadius;
        /** @type {Array<{ el: HTMLElement, x: number, y: number, ownerId: string|null, onHit: () => void }>} */
        this.projectiles = [];
        this._domPool = new DomPool(() => {
            const el = document.createElement('div');
            el.className = 'enemy-projectile';
            return el;
        }, RUNTIME_BUDGET.poolPrewarm.projectiles);
    }

    get activeCount() {
        return this.projectiles.length;
    }

    /** @param {EnemyProjectileSpec} spec */
    spawn(spec) {
        while (this.projectiles.length >= this._maxProjectiles) {
            this._removeAt(0);
        }

        const el = this._domPool.acquire();
        if (!el.parentElement) this.container.appendChild(el);

        el.style.left = `${spec.x}vw`;
        el.style.top = `${spec.y}vh`;

        this.projectiles.push({
            el,
            x: spec.x,
            y: spec.y,
            ownerId: spec.ownerId ?? null,
            onHit: spec.onHit
        });
    }

    /** Remove all projectiles fired by a dead or despawned enemy. */
    removeForOwner(ownerId) {
        if (!ownerId) return;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i].ownerId === ownerId) {
                this._removeAt(i);
            }
        }
    }

    /**
     * Advance all live projectiles in simulated time (called from the main game tick).
     * @param {number} simDeltaMs
     * @param {EnemyProjectileTickContext} ctx
     */
    tick(simDeltaMs, ctx) {
        if (simDeltaMs <= 0 || this.projectiles.length === 0) return;
        if (this.state.gamePaused || this.state.gameOver) {
            this.clearAll();
            return;
        }

        const totalStepVw = this._speedVwPerSec * (simDeltaMs / 1000);
        const { getPlayerPosition, innerWidth, innerHeight } = ctx;
        const { x: px, y: py } = getPlayerPosition();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile.ownerId && !this._isOwnerAlive(projectile.ownerId)) {
                this._removeAt(i);
                continue;
            }

            if (this._isAtPlayer(projectile.x, projectile.y, px, py, innerWidth, innerHeight)) {
                projectile.onHit?.();
                this._removeAt(i);
                continue;
            }

            const hit = this._advanceTowardPlayer(
                projectile,
                totalStepVw,
                px,
                py,
                innerWidth,
                innerHeight
            );
            projectile.el.style.left = `${projectile.x}vw`;
            projectile.el.style.top = `${projectile.y}vh`;

            if (hit) {
                projectile.onHit?.();
                this._removeAt(i);
            }
        }
    }

    /**
     * Move in capped sub-steps with swept segment tests so large 4× sim deltas cannot tunnel.
     * @returns {boolean} true when the path intersects the player this tick
     */
    _advanceTowardPlayer(projectile, totalStepVw, px, py, innerWidth, innerHeight) {
        const angle = Math.atan2(py - projectile.y, px - projectile.x);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        let remaining = totalStepVw;

        while (remaining > 0) {
            const step = Math.min(this._maxStepVw, remaining);
            const fromX = projectile.x;
            const fromY = projectile.y;
            projectile.x += cos * step;
            projectile.y += sin * step;
            remaining -= step;

            if (this._segmentHitsPlayer(fromX, fromY, projectile.x, projectile.y, px, py, innerWidth, innerHeight)) {
                return true;
            }
        }
        return false;
    }

    _isAtPlayer(x, y, px, py, innerWidth, innerHeight) {
        return distanceVw(x, y, px, py, innerWidth, innerHeight) < this._hitRadius;
    }

    _segmentHitsPlayer(x1, y1, x2, y2, px, py, innerWidth, innerHeight) {
        if (this._isAtPlayer(x2, y2, px, py, innerWidth, innerHeight)) return true;
        const pxPx = px * innerWidth / 100;
        const pyPx = py * innerHeight / 100;
        const segX1 = x1 * innerWidth / 100;
        const segY1 = y1 * innerHeight / 100;
        const segX2 = x2 * innerWidth / 100;
        const segY2 = y2 * innerHeight / 100;
        return distancePointToSegmentPx(pxPx, pyPx, segX1, segY1, segX2, segY2) < this._hitRadius;
    }

    /** @param {string} ownerId */
    _isOwnerAlive(ownerId) {
        return this.state.enemies.some(
            e => e.id === ownerId && (e.stats?.hp ?? 0) > 0
        );
    }

    /** @param {number} index */
    _removeAt(index) {
        const entry = this.projectiles[index];
        if (!entry) return;
        this._domPool.release(entry.el);
        this.projectiles.splice(index, 1);
    }

    clearAll() {
        while (this.projectiles.length > 0) {
            this._removeAt(0);
        }
    }

    destroy() {
        this.clearAll();
        this._domPool.clear(this.container);
    }
}
