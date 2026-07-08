import { BALANCE } from '../config/balance.js';

/**
 * Limits on-screen enemies and throttles spawns during warmup.
 * Survivor-style games start gentle then ramp pressure over time.
 */
export class EnemyPopulationManager {
    /** @param {import('../game/gameState.js').GameState} state */
    constructor(state) {
        this.state = state;
    }

    get maxEnemies() {
        return BALANCE.maxEnemiesOnScreen;
    }

    isAtCap() {
        const active = this.state.enemies.filter(e => !e.isSplitFragment && !e.isSplitMinion);
        return active.length >= this.maxEnemies;
    }

    /** Skip spawn when at cap. */
    canSpawn() {
        return !this.isAtCap();
    }

    /**
     * Cull excess low-priority enemies when over cap (memory + performance).
     * Removes farthest normal/swarm enemies first.
     */
    enforceCap(game) {
        const s = this.state;
        if (s.enemies.length <= this.maxEnemies) return;

        const { x: px, y: py } = game.ui.getPlayerPosition();
        const excess = s.enemies.length - this.maxEnemies;

        const sorted = [...s.enemies]
            .filter(e => e.rarity === 'normal' && !e.isTreasure && !e.isSplitFragment && !e.isSplitMinion)
            .map(e => ({
                enemy: e,
                dist: Math.hypot(
                    parseFloat(e.element.style.left) - px,
                    parseFloat(e.element.style.top) - py
                )
            }))
            .sort((a, b) => b.dist - a.dist);

        let removed = 0;
        for (const { enemy } of sorted) {
            if (removed >= excess) break;
            game._forceRemoveEnemy(enemy, false);
            removed++;
        }
    }

    /**
     * Spawn rate multiplier during warmup — ease-out so early waves get denser
     * packs while post-warmup (elapsed ≥ warmupSeconds) stays exactly 1.0.
     *
     * mult(t) = floor + (1 − floor) × t^ease
     * where t ∈ [0,1], floor = warmupSpawnMultiplier, ease ∈ (0,1] (default 0.62).
     *
     * @param {number} elapsedSeconds
     * @returns {number} in [warmupSpawnMultiplier, 1]
     */
    getSpawnMultiplier(elapsedSeconds) {
        const warmup = BALANCE.warmupSeconds || 180;
        if (elapsedSeconds >= warmup) return 1;
        const floor = BALANCE.warmupSpawnMultiplier ?? 0.52;
        const ease = BALANCE.warmupSpawnEase ?? 0.62;
        const t = Math.max(0, Math.min(1, elapsedSeconds / warmup));
        const shaped = Math.pow(t, ease);
        return floor + (1 - floor) * shaped;
    }

    /** Whether a spawn tick should fire this frame. @param {number} now */
    shouldSpawnNow(category, elapsedSeconds, lastSpawn, intervalMs, now = Date.now()) {
        if (!this.canSpawn()) return false;
        const mult = this.getSpawnMultiplier(elapsedSeconds);
        const adjustedInterval = intervalMs / Math.max(0.35, mult);
        return now - lastSpawn >= adjustedInterval;
    }
}
