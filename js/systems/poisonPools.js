import {
    getPoisonBottleConfig,
    computePoisonTickDamage,
    findEnemiesInRadius
} from '../config/skills.js';

let nextPoolId = 0;

/**
 * Manages poison ground pools — persistent AoE damage zones.
 */
export class PoisonPoolManager {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.pools = [];
    }

    /** @param {number} x @param {number} y @param {number} level @param {number} baseDamage */
    createPool(x, y, level, baseDamage) {
        const cfg = getPoisonBottleConfig(level);
        const el = document.createElement('div');
        el.className = 'poison-pool';
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        el.style.width = `${cfg.poolRadius * 2}px`;
        el.style.height = `${cfg.poolRadius * 2}px`;
        el.innerHTML = '<div class="poison-pool-inner"></div><div class="poison-pool-bubbles"></div>';
        this.game.ui.els.gameContainer.appendChild(el);

        const pool = {
            id: `pool-${nextPoolId++}`,
            element: el,
            x, y,
            radius: cfg.poolRadius,
            level,
            tickDamage: computePoisonTickDamage(baseDamage, level),
            tickInterval: cfg.tickInterval,
            endTime: Date.now() + cfg.poolDuration,
            lastTick: Date.now()
        };

        this.pools.push(pool);
        this.game.skillRanges?.showImpactArea(x, y, cfg.poolRadius, 'poison', cfg.poolDuration);
        requestAnimationFrame(() => el.classList.add('poison-pool-active'));
        return pool;
    }

    /** @param {number} now */
    tick(now) {
        const s = this.game.state;
        if (s.gamePaused || s.gameOver) return;

        this.pools = this.pools.filter(pool => {
            if (now >= pool.endTime) {
                pool.element.classList.add('poison-pool-fade');
                const t = setTimeout(() => pool.element.remove(), 500);
                s.trackTimeout(t);
                return false;
            }

            if (now - pool.lastTick >= pool.tickInterval) {
                pool.lastTick = now;
                this._damageEnemiesInPool(pool);
            }
            return true;
        });
    }

    _damageEnemiesInPool(pool) {
        const s = this.game.state;
        const targets = findEnemiesInRadius(
            s.enemies.map(e => ({
                id: e.id,
                x: parseFloat(e.element.style.left),
                y: parseFloat(e.element.style.top),
                hp: e.stats.hp,
                ref: e
            })),
            pool.x, pool.y, pool.radius,
            window.innerWidth, window.innerHeight
        );

        targets.forEach(t => {
            if (t.ref) {
                this.game._dealSkillDamageToEnemy(t.ref, pool.tickDamage, 'poison', false);
                t.ref.element.classList.add('enemy-poisoned');
                const tOut = setTimeout(() => t.ref.element.classList.remove('enemy-poisoned'), 300);
                s.trackTimeout(tOut);
            }
        });

        pool.element.querySelector('.poison-pool-inner')?.classList.add('poison-pool-tick');
        const tickOut = setTimeout(() => {
            pool.element.querySelector('.poison-pool-inner')?.classList.remove('poison-pool-tick');
        }, 200);
        s.trackTimeout(tickOut);
    }

    clear() {
        this.pools.forEach(p => p.element.remove());
        this.pools = [];
    }
}
