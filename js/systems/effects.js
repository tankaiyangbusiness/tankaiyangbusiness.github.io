/**
 * Visual effect factory — creates and manages transient DOM effects.
 * Owned VFX nodes and class timers are tracked separately so trim/cleanup
 * cannot accidentally remove live enemy or player DOM.
 */
import { getRuntimeBudgets, shouldThrottleCosmeticEffects } from './runtimeBudget.js';
import { RUNTIME_BUDGET } from '../config/runtimeBudget.js';
import { DomPool } from '../utils/domPool.js';

export class EffectManager {
    /** @param {HTMLElement} container */
    constructor(container) {
        this.container = container;
        /** @type {{ el: HTMLElement, id: ReturnType<typeof setTimeout> }[]} */
        this.activeEffects = [];
        /** Class-only timers (do not own the element). */
        /** @type {{ el: HTMLElement, className: string, id: ReturnType<typeof setTimeout>, onDone: (() => void)|null }[]} */
        this._classTimers = [];
        const budgets = getRuntimeBudgets();
        this.maxEffects = budgets.maxEffects;
        this._maxClassTimers = budgets.maxClassTimers;
        this._timeScale = 1;
        this._damageNumberBudget = RUNTIME_BUDGET.damageNumberBudgetPerWindow;
        this._damageNumberBudgetWindowStart = 0;
        this._hitEffectPool = new DomPool(() => this._createHitEffectElement(), RUNTIME_BUDGET.poolPrewarm.hitEffects);
        this._expOrbPool = new DomPool(() => this._createExpOrbElement(), RUNTIME_BUDGET.poolPrewarm.expOrbs);
        this._damageNumberPool = new DomPool(
            () => this._createDamageNumberElement(),
            RUNTIME_BUDGET.poolPrewarm.damageNumbers ?? 12
        );
    }

    _createDamageNumberElement() {
        const el = document.createElement('div');
        el.className = 'damage-number';
        return el;
    }

    _createHitEffectElement() {
        const el = document.createElement('div');
        el.className = 'hit-effect hit-effect-physical particle-25d';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
        return el;
    }

    _createExpOrbElement() {
        const el = document.createElement('div');
        el.className = 'world-exp-orb particle-25d';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
        return el;
    }

    /** @param {HTMLElement} el @param {'hit'|'exp'|'damage'} kind */
    _releasePooledElement(el, kind) {
        if (kind === 'hit') this._hitEffectPool.release(el);
        else if (kind === 'damage') this._damageNumberPool.release(el);
        else this._expOrbPool.release(el);
    }

    /** @param {number} scale — affects VFX lifetime only (sim-time), not spawn rules or caps. */
    setTimeScale(scale) {
        this._timeScale = Math.max(1, scale || 1);
        this._trimEffects();
        this._trimClassTimers();
    }

    _isCosmeticThrottled() {
        return shouldThrottleCosmeticEffects(this.activeEffects.length, this.maxEffects);
    }

    /** Public check for gameplay code that should skip heavy VFX under load. */
    isCosmeticThrottled() {
        return this._isCosmeticThrottled();
    }

    _consumeDamageNumberBudget() {
        const now = Date.now();
        const windowMs = RUNTIME_BUDGET.damageNumberBudgetWindowMs / this._timeScale;
        if (!this._damageNumberBudgetWindowStart || now - this._damageNumberBudgetWindowStart >= windowMs) {
            this._damageNumberBudgetWindowStart = now;
            const base = RUNTIME_BUDGET.damageNumberBudgetPerWindow;
            this._damageNumberBudget = Math.max(4, Math.floor(base / this._timeScale));
        }
        if (this._damageNumberBudget <= 0) return false;
        this._damageNumberBudget -= 1;
        return true;
    }

    /**
     * Register a transient node owned by this manager.
     * @param {HTMLElement} el
     * @param {number} lifetimeMs
     * @returns {HTMLElement}
     */
    _trackEffect(el, lifetimeMs, poolKind = null) {
        this.container.appendChild(el);
        const maxLife = RUNTIME_BUDGET.maxTransientDomLifetimeMs ?? 15000;
        const scaledMs = Math.min(maxLife, Math.max(80, lifetimeMs / this._timeScale));
        const id = setTimeout(() => {
            if (poolKind) {
                this._releasePooledElement(el, poolKind);
            } else {
                el.remove();
            }
            this.activeEffects = this.activeEffects.filter(e => e.el !== el);
        }, scaledMs);
        this.activeEffects.push({ el, id, poolKind });
        this._trimEffects();
        return el;
    }

    _trimClassTimers() {
        const cap = this._maxClassTimers ?? 120;
        while (this._classTimers.length > cap) {
            const old = this._classTimers.shift();
            if (!old) break;
            clearTimeout(old.id);
            old.el.classList.remove(old.className);
            old.onDone?.();
        }
    }

    _trimEffects() {
        while (this.activeEffects.length > this.maxEffects) {
            const old = this.activeEffects.shift();
            if (old) {
                clearTimeout(old.id);
                if (old.poolKind) this._releasePooledElement(old.el, old.poolKind);
                else old.el?.remove();
            }
        }
    }

    /** @param {number} x @param {number} y @param {string} type */
    spawnHitEffect(x, y, type = 'physical') {
        if (this._isCosmeticThrottled()) return null;
        const el = this._hitEffectPool.acquire();
        el.className = `hit-effect hit-effect-${type} particle-25d`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        return this._trackEffect(el, 550, 'hit');
    }

    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {boolean} [enhanced] */
    spawnLightningBolt(x1, y1, x2, y2, enhanced = false) {
        const el = document.createElement('div');
        el.className = enhanced ? 'lightning-bolt lightning-bolt-enhanced' : 'lightning-bolt';
        const dx = (x2 - x1) * window.innerWidth / 100;
        const dy = (y2 - y1) * window.innerHeight / 100;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        el.style.left = `${x1}vw`;
        el.style.top = `${y1}vh`;
        el.style.width = `${length}px`;
        el.style.transform = `rotate(${angle}deg)`;
        return this._trackEffect(el, enhanced ? 420 : 280);
    }

    /** @param {HTMLElement} enemyEl */
    applyBurnAura(enemyEl) {
        if (!enemyEl.querySelector('.status-burn')) {
            const aura = document.createElement('div');
            aura.className = 'status-burn';
            enemyEl.appendChild(aura);
        }
    }

    removeBurnAura(enemyEl) {
        enemyEl.querySelector('.status-burn')?.remove();
    }

    /** @param {HTMLElement} enemyEl */
    applyFrostAura(enemyEl) {
        enemyEl.classList.add('status-frozen');
        const aura = enemyEl.querySelector('.status-frost') || document.createElement('div');
        aura.className = 'status-frost';
        if (!aura.parentElement) enemyEl.appendChild(aura);
    }

    /** @param {HTMLElement} enemyEl */
    removeFrostAura(enemyEl) {
        enemyEl.classList.remove('status-frozen');
        enemyEl.querySelector('.status-frost')?.remove();
    }

    /** @param {HTMLElement} playerEl */
    triggerAttackAnimation(playerEl) {
        const sprite = playerEl.querySelector('.player-sprite') || playerEl;
        sprite.classList.remove('player-attacking', 'player-melee-attacking');
        void sprite.offsetWidth;
        sprite.classList.add('player-attacking');
        this._trackClassTimeout(sprite, 'player-attacking', 240);
    }

    /**
     * Melee lunge toward target — used by melee basic attacks.
     * @param {HTMLElement} playerEl
     * @param {number} fromX @param {number} fromY
     * @param {number} toX @param {number} toY
     */
    triggerMeleeAttackAnimation(playerEl, fromX, fromY, toX, toY) {
        const sprite = playerEl.querySelector('.player-sprite') || playerEl;
        const dx = (toX - fromX) * window.innerWidth / 100;
        const dy = (toY - fromY) * window.innerHeight / 100;
        const len = Math.hypot(dx, dy) || 1;
        const lungePx = 18;
        sprite.style.setProperty('--melee-lunge-x', `${(dx / len) * lungePx}px`);
        sprite.style.setProperty('--melee-lunge-y', `${(dy / len) * lungePx}px`);
        sprite.classList.remove('player-attacking', 'player-melee-attacking');
        void sprite.offsetWidth;
        sprite.classList.add('player-melee-attacking');
        this._trackClassTimeout(sprite, 'player-melee-attacking', 340, () => {
            sprite.style.removeProperty('--melee-lunge-x');
            sprite.style.removeProperty('--melee-lunge-y');
        });
        this.spawnMeleeSwordSlash(fromX, fromY, toX, toY);
    }

    /**
     * Visible sword arc from player to target — readable even with large AoE rings.
     * @param {number} fromX @param {number} fromY @param {number} toX @param {number} toY
     */
    spawnMeleeSwordSlash(fromX, fromY, toX, toY) {
        const iw = window.innerWidth || 1000;
        const ih = window.innerHeight || 1000;
        const dx = (toX - fromX) * iw / 100;
        const dy = (toY - fromY) * ih / 100;
        const len = Math.hypot(dx, dy) || 1;
        const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

        const slash = document.createElement('div');
        slash.className = 'melee-sword-slash';
        slash.style.left = `${fromX}vw`;
        slash.style.top = `${fromY}vh`;
        slash.style.width = `${Math.min(len * 0.92, iw * 0.22)}px`;
        slash.style.transform = `translate(0, -50%) rotate(${angleDeg}deg)`;
        slash.innerHTML = '<span class="melee-sword-blade" aria-hidden="true"></span><span class="melee-sword-tip" aria-hidden="true"></span>';
        this._trackEffect(slash, 320);

        if (this._isCosmeticThrottled()) return slash;

        const spark = document.createElement('div');
        spark.className = 'melee-sword-impact';
        spark.style.left = `${toX}vw`;
        spark.style.top = `${toY}vh`;
        this._trackEffect(spark, 280);
    }

    /** @param {HTMLElement} enemyEl */
    triggerEnemyHitAnimation(enemyEl) {
        enemyEl.classList.remove('enemy-hit');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-hit');
        this._trackClassTimeout(enemyEl, 'enemy-hit', 280);
    }

    /** @param {HTMLElement} enemyEl @param {number} [targetX] @param {number} [targetY] */
    triggerEnemyAttackAnimation(enemyEl, targetX, targetY) {
        const ex = parseFloat(enemyEl.style.left);
        const ey = parseFloat(enemyEl.style.top);
        const tx = targetX ?? ex;
        const ty = targetY ?? ey;
        const dx = (tx - ex) * window.innerWidth / 100;
        const dy = (ty - ey) * window.innerHeight / 100;
        const len = Math.hypot(dx, dy) || 1;
        const lungePx = 10;
        enemyEl.style.setProperty('--lunge-x', `${(dx / len) * lungePx}px`);
        enemyEl.style.setProperty('--lunge-y', `${(dy / len) * lungePx}px`);

        enemyEl.classList.remove('enemy-attacking');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-attacking');
        this._trackClassTimeout(enemyEl, 'enemy-attacking', 380, () => {
            enemyEl.style.removeProperty('--lunge-x');
            enemyEl.style.removeProperty('--lunge-y');
        });
    }

    /**
     * Temporary CSS class — tracked separately so VFX trim never removes the host element.
     * @param {HTMLElement} el
     * @param {string} className
     * @param {number} ms
     * @param {(() => void)|null} [onDone]
     */
    _trackClassTimeout(el, className, ms, onDone = null) {
        const scaledMs = Math.max(40, ms / this._timeScale);
        // Replace any existing timer for same el+class to avoid stacking
        for (let i = this._classTimers.length - 1; i >= 0; i--) {
            const t = this._classTimers[i];
            if (t.el === el && t.className === className) {
                clearTimeout(t.id);
                this._classTimers.splice(i, 1);
            }
        }
        const id = setTimeout(() => {
            el.classList.remove(className);
            onDone?.();
            this._classTimers = this._classTimers.filter(t => t.id !== id);
        }, scaledMs);
        this._classTimers.push({ el, className, id, onDone });
        this._trimClassTimers();
    }

    spawnDeathExplosion(x, y, type = 'normal') {
        const el = document.createElement('div');
        el.className = `death-explosion death-explosion-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        return this._trackEffect(el, 700);
    }

    spawnMegaExplosion(x, y, type) {
        const el = document.createElement('div');
        el.className = `mega-explosion mega-explosion-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        return this._trackEffect(el, 850);
    }

    spawnCastFlash(x, y, type) {
        const el = document.createElement('div');
        el.className = `cast-flash cast-flash-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        return this._trackEffect(el, 480);
    }

    spawnDamageNumber(x, y, damage, isCrit, element = null) {
        if (this._isCosmeticThrottled()) return null;
        if (!this._consumeDamageNumberBudget()) return null;
        if (this.activeEffects.length >= this.maxEffects) return null;
        const el = this._damageNumberPool.acquire();
        let className = 'damage-number';
        if (isCrit) className += ' damage-crit';
        if (element) className += ` damage-${element}`;
        el.className = className;
        el.textContent = String(damage);
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        el.classList.remove('damage-float');
        this._trackEffect(el, 1100, 'damage');
        requestAnimationFrame(() => {
            el.classList.add('damage-float');
        });
        return el;
    }

    /** @param {number} x @param {number} y */
    spawnLootBurst(x, y) {
        const el = document.createElement('div');
        el.className = 'world-loot-burst';
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        return this._trackEffect(el, 650);
    }

    /** @param {number} x @param {number} y @param {number} [count] */
    spawnExpOrbs(x, y, count = 3) {
        if (this._isCosmeticThrottled()) {
            count = 1;
        }
        const n = Math.min(count, 4);
        for (let i = 0; i < n; i++) {
            const el = this._expOrbPool.acquire();
            const ox = (Math.random() - 0.5) * 4;
            el.style.left = `${x + ox}vw`;
            el.style.top = `${y}vh`;
            el.style.animationDelay = `${i * 0.06}s`;
            this._trackEffect(el, 750, 'exp');
        }
    }

    /** @param {HTMLElement} enemyEl */
    playEnemySpawn(enemyEl) {
        enemyEl.classList.add('enemy-spawn-in');
        this._trackClassTimeout(enemyEl, 'enemy-spawn-in', 480);
    }

    /** @param {HTMLElement} rangeEl */
    flashAttackRange(rangeEl) {
        if (!rangeEl) return;
        rangeEl.classList.remove('player-attacking-range');
        void rangeEl.offsetWidth;
        rangeEl.classList.add('player-attacking-range');
        this._trackClassTimeout(rangeEl, 'player-attacking-range', 280);
    }

    cleanup() {
        this.activeEffects.forEach(({ el, id, poolKind }) => {
            clearTimeout(id);
            if (poolKind) this._releasePooledElement(el, poolKind);
            else el?.remove();
        });
        this.activeEffects = [];
        this._classTimers.forEach(({ el, className, id, onDone }) => {
            clearTimeout(id);
            el?.classList.remove(className);
            onDone?.();
        });
        this._classTimers = [];
    }
}
