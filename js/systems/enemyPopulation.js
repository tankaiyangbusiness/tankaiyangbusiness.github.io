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

    /** Spawn rate multiplier based on elapsed time (warmup). */
    getSpawnMultiplier(elapsedSeconds) {
        if (elapsedSeconds < BALANCE.warmupSeconds) {
            const t = elapsedSeconds / BALANCE.warmupSeconds;
            return BALANCE.warmupSpawnMultiplier + (1 - BALANCE.warmupSpawnMultiplier) * t;
        }
        return 1;
    }

    /** Whether a spawn tick should fire this frame. @param {number} now */
    shouldSpawnNow(category, elapsedSeconds, lastSpawn, intervalMs, now = Date.now()) {
        if (!this.canSpawn()) return false;
        const mult = this.getSpawnMultiplier(elapsedSeconds);
        const adjustedInterval = intervalMs / Math.max(0.35, mult);
        return now - lastSpawn >= adjustedInterval;
    }
}
