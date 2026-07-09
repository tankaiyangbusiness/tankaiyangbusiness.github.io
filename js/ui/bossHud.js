/**
 * Milestone boss HP HUD (Wave 50 & 100) — below the kill streak meta row.
 * When both bosses could be alive, Wave 100 takes display priority over Wave 50.
 */
import {
    BOSS_HUD_LABELS,
    BOSS_HUD_PRIORITY,
    findLivingMilestoneBoss
} from '../config/milestoneBosses.js';

export class BossHud {
    constructor() {
        /** @type {HTMLElement|null} */
        this.root = null;
        /** @type {HTMLElement|null} */
        this.label = null;
        /** @type {HTMLElement|null} */
        this.fill = null;
        /** @type {HTMLElement|null} */
        this.value = null;
        /** @type {string|null} */
        this._bossId = null;
        /** @type {number} */
        this._priority = 0;
        this._ensureDom();
    }

    /** Lazy DOM bind — safe if constructed before first paint. */
    _ensureDom() {
        if (!this.root) this.root = document.getElementById('final-boss-hud');
        if (!this.label) this.label = document.getElementById('boss-hud-label');
        if (!this.fill) this.fill = document.getElementById('final-boss-hp-fill');
        if (!this.value) this.value = document.getElementById('final-boss-hp-value');
    }

    /** @param {{ id: string, milestoneBossWave?: number, stats: { hp: number, maxHp: number } }} enemy */
    track(enemy) {
        this._ensureDom();
        const wave = enemy?.milestoneBossWave;
        if (!this.root || !wave || !BOSS_HUD_LABELS[wave]) return;

        const priority = BOSS_HUD_PRIORITY[wave] ?? 0;
        if (this._bossId && this._priority > priority) return;

        this._bossId = enemy.id;
        this._priority = priority;
        if (this.label) this.label.textContent = BOSS_HUD_LABELS[wave];
        this._show();
        this.update(enemy);
    }

    /**
     * Self-healing sync — ensures the HUD tracks a living milestone boss even if
     * the initial track() was missed (e.g. spawn race or DOM not ready).
     * @param {Array<{ id: string, milestoneBossWave?: number, stats?: { hp?: number, maxHp?: number } }>} enemies
     */
    syncFromEnemies(enemies) {
        this._ensureDom();
        const living = findLivingMilestoneBoss(enemies);
        if (!living) {
            if (this._bossId && !enemies.some(
                e => e.id === this._bossId && (e.stats?.hp ?? 0) > 0
            )) {
                this.clear();
            }
            return;
        }

        if (!this._bossId || this._bossId !== living.id) {
            this.track(living);
            return;
        }
        this.update(living);
    }

    /** @param {{ id: string, milestoneBossWave?: number, stats: { hp: number, maxHp: number } }} enemy */
    update(enemy) {
        if (!this.root || !enemy?.milestoneBossWave || enemy.id !== this._bossId) return;
        const maxHp = Math.max(1, enemy.stats.maxHp);
        const hp = Math.max(0, Math.floor(enemy.stats.hp));
        const pct = Math.min(100, (hp / maxHp) * 100);
        if (this.fill) this.fill.style.width = `${pct}%`;
        if (this.value) this.value.textContent = `${hp} / ${maxHp}`;
    }

    /**
     * Clear tracking for a defeated boss; retarget a lower-priority milestone boss if one remains.
     * @param {{ id: string }} enemy
     * @param {Array<{ id: string, milestoneBossWave?: number, stats?: { hp?: number } }>} [enemies]
     */
    onBossDeath(enemy, enemies = []) {
        if (!enemy || enemy.id !== this._bossId) return;
        this.clear();
        const next = findLivingMilestoneBoss(enemies);
        if (next) this.track(next);
    }

    _show() {
        if (!this.root) return;
        this.root.hidden = false;
        this.root.classList.add('final-boss-hud--active');
    }

    clear() {
        this._bossId = null;
        this._priority = 0;
        if (this.root) {
            this.root.hidden = true;
            this.root.classList.remove('final-boss-hud--active');
        }
        if (this.fill) this.fill.style.width = '0%';
        if (this.value) this.value.textContent = '';
    }

    isTracking(enemyId) {
        return Boolean(this._bossId && this._bossId === enemyId);
    }
}

/** @deprecated Use BossHud */
export { BossHud as FinalBossHud };
