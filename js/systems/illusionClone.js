/** PoE-style illusion clone — mirrors basic attacks at reduced damage. */
import { getIllusionConfig } from '../config/skills.js';
import { buildCompanionModelHtml } from '../ui/entityModels.js';
import { companionAiStep } from '../utils/companionAi.js';
import { scaledRealTimeoutMs } from './gameClock.js';

export { getIllusionConfig };

/**
 * @typedef {object} IllusionCloneState
 * @property {HTMLElement} el
 * @property {number} expiresAt
 * @property {number} lastAttackTime
 * @property {number} damagePercent
 * @property {boolean} roam
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [speedVw]
 * @property {number} [leashVw]
 * @property {number} [homeOffsetX]
 * @property {number} [homeOffsetY]
 */

/**
 * Manages illusion clones — Ranger passive (roaming) and Illusion skill (flank) are independent slots.
 */
export class IllusionCloneManager {
    /** @param {object} game */
    constructor(game) {
        this.game = game;
        /** @type {IllusionCloneState|null} Ranger passive companion */
        this.roamClone = null;
        /** @type {IllusionCloneState|null} Illusion skill summon */
        this.skillClone = null;
    }

    /** @param {number} now */
    tick(now) {
        this._tickSlot(this.skillClone, now, { allowExpiry: true });
        this._tickSlot(this.roamClone, now, { allowExpiry: false });
    }

    /**
     * @param {IllusionCloneState|null} clone
     * @param {number} now
     * @param {{ allowExpiry: boolean }} opts
     */
    _tickSlot(clone, now, opts) {
        if (!clone) return;
        if (opts.allowExpiry && now >= clone.expiresAt) {
            this._removeSkillClone();
            return;
        }
        if (clone.roam) {
            this._tickRoamMovement(clone);
        } else {
            this._syncSkillPosition(clone);
        }
        this._tickCloneAttacks(clone, now);
    }

    /**
     * Permanent roaming companion (Ranger passive) — never expires; does not block the Illusion skill.
     * @param {number} now
     * @param {{ damagePercent: number, speedVw?: number, leashVw?: number }} opts
     */
    ensureRoamingCompanion(now, opts) {
        if (this.roamClone) {
            this.roamClone.damagePercent = opts.damagePercent ?? this.roamClone.damagePercent;
            if (opts.speedVw != null) this.roamClone.speedVw = opts.speedVw;
            if (opts.leashVw != null) this.roamClone.leashVw = opts.leashVw;
            return;
        }

        const { x, y } = this.game.ui.getPlayerPosition();
        const homeX = x + 3.2;
        const homeY = y;
        const el = document.createElement('div');
        el.className = 'illusion-clone illusion-clone-ranger';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = buildCompanionModelHtml('illusion', { ranger: true });
        el.style.left = `${homeX}vw`;
        el.style.top = `${homeY}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        this.roamClone = {
            el,
            x: homeX,
            y: homeY,
            expiresAt: Number.MAX_SAFE_INTEGER,
            lastAttackTime: now,
            damagePercent: opts.damagePercent ?? 60,
            roam: true,
            speedVw: opts.speedVw ?? 0.55,
            leashVw: opts.leashVw ?? 14,
            homeOffsetX: 3.2,
            homeOffsetY: 0
        };
    }

    /** External roam step — move clone to new vw position. */
    setRoamPosition(x, y) {
        if (!this.roamClone) return;
        this.roamClone.x = x;
        this.roamClone.y = y;
        this.roamClone.el.style.left = `${x}vw`;
        this.roamClone.el.style.top = `${y}vh`;
    }

    /**
     * Summon skill clone if off cooldown — coexists with the Ranger roam companion.
     * @param {number} level
     * @param {number} now
     * @returns {boolean}
     */
    trySummon(level, now) {
        const s = this.game.state;
        const cfg = getIllusionConfig(level);
        if (level <= 0 || this.skillClone) return false;
        if (now - (s.skillCooldowns.illusion || 0) < cfg.cooldown) return false;

        s.skillCooldowns.illusion = now;
        this._spawnSkillClone(now, cfg);
        this.game.audio?.playSkillSfx?.('illusion');
        this.game.effects?.spawnCastFlash(
            parseFloat(this.skillClone.el.style.left),
            parseFloat(this.skillClone.el.style.top),
            'arcane'
        );
        return true;
    }

    /** @param {number} now @param {ReturnType<typeof getIllusionConfig>} cfg */
    _spawnSkillClone(now, cfg) {
        const { x, y } = this.game.ui.getPlayerPosition();
        const el = document.createElement('div');
        el.className = 'illusion-clone';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = buildCompanionModelHtml('illusion');
        el.style.left = `${x + cfg.offsetVw}vw`;
        el.style.top = `${y}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        this.skillClone = {
            el,
            x: x + cfg.offsetVw,
            y,
            expiresAt: now + cfg.duration,
            lastAttackTime: 0,
            damagePercent: cfg.damagePercent,
            roam: false
        };

        el.classList.add('illusion-spawn-in');
        const spawnMs = scaledRealTimeoutMs(this.game.state, 500);
        this.game.state.trackTimeout(setTimeout(() => {
            el.classList.remove('illusion-spawn-in');
        }, spawnMs));
    }

    /** @param {IllusionCloneState} clone */
    _tickRoamMovement(clone) {
        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const attackRangePx = this.game.state.stats.attackRange;

        const ax = Number.isFinite(clone.x) ? clone.x : parseFloat(clone.el.style.left);
        const ay = Number.isFinite(clone.y) ? clone.y : parseFloat(clone.el.style.top);

        const step = companionAiStep(
            { x: ax, y: ay },
            {
                ownerX: px,
                ownerY: py,
                enemies: this.game.state.enemies,
                speedVw: clone.speedVw ?? 0.55,
                leashVw: clone.leashVw ?? 14,
                homeOffsetX: clone.homeOffsetX ?? 3.2,
                homeOffsetY: clone.homeOffsetY ?? 0,
                attackRangePx,
                style: 'ranged',
                innerWidth: iw,
                innerHeight: ih
            }
        );
        clone.x = step.x;
        clone.y = step.y;
        clone.el.style.left = `${step.x}vw`;
        clone.el.style.top = `${step.y}vh`;
    }

    /** @param {IllusionCloneState} clone */
    _syncSkillPosition(clone) {
        const cfg = getIllusionConfig(this.game.state.skillList.illusion?.level || 1);
        const { x, y } = this.game.ui.getPlayerPosition();
        clone.x = x + cfg.offsetVw;
        clone.y = y;
        clone.el.style.left = `${clone.x}vw`;
        clone.el.style.top = `${clone.y}vh`;
    }

    /** @param {IllusionCloneState} clone @param {number} now */
    _tickCloneAttacks(clone, now) {
        const s = this.game.state;
        if (!clone || s.gamePaused || s.gameOver) return;

        const interval = 1000 / s.stats.attackSpeed;
        if (now - clone.lastAttackTime < interval) return;

        const x = Number.isFinite(clone.x) ? clone.x : parseFloat(clone.el.style.left);
        const y = Number.isFinite(clone.y) ? clone.y : parseFloat(clone.el.style.top);
        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        clone.lastAttackTime = now;

        clone.el.classList.remove('illusion-attacking');
        void clone.el.offsetWidth;
        clone.el.classList.add('illusion-attacking');

        this.game._attackNearestEnemy(x, y, null, null, {
            rangeCenterX: px,
            rangeCenterY: py,
            damageMultiplier: clone.damagePercent / 100,
            skipPlayerAnim: true,
            projectileClass: 'projectile-illusion'
        });
    }

    _removeSkillClone() {
        if (!this.skillClone) return;
        this.skillClone.el.remove();
        this.skillClone = null;
    }

    _removeRoamClone() {
        if (!this.roamClone) return;
        this.roamClone.el.remove();
        this.roamClone = null;
    }

    dismiss() {
        this._removeSkillClone();
        this._removeRoamClone();
    }

    cleanup() {
        this.dismiss();
    }

    isActive() {
        return Boolean(this.roamClone || this.skillClone);
    }

    /** @deprecated Prefer roamClone / skillClone — legacy alias for tests. */
    get clone() {
        return this.skillClone || this.roamClone;
    }
}
