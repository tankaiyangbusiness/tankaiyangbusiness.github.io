/** PoE-style illusion clone — mirrors basic attacks at reduced damage. */
import { getIllusionConfig } from '../config/skills.js';
import { buildCompanionModelHtml } from '../ui/entityModels.js';
import { companionAiStep } from '../utils/companionAi.js';

export { getIllusionConfig };

/**
 * Manages a single invulnerable illusion clone beside the player.
 * Skill clones stay glued to the player flank; Ranger roam clones chase like a ranged bot.
 */
export class IllusionCloneManager {
    /** @param {object} game */
    constructor(game) {
        this.game = game;
        /** @type {{
         *   el: HTMLElement,
         *   expiresAt: number,
         *   lastAttackTime: number,
         *   damagePercent: number,
         *   roam?: boolean,
         *   x?: number,
         *   y?: number,
         *   speedVw?: number,
         *   leashVw?: number,
         *   homeOffsetX?: number,
         *   homeOffsetY?: number
         * }|null} */
        this.clone = null;
    }

    /** @param {number} now */
    tick(now) {
        if (!this.clone) return;
        if (now >= this.clone.expiresAt) {
            this.dismiss();
            return;
        }
        if (this.clone.roam) {
            this._tickRoamMovement();
        } else {
            this._syncPosition();
        }
        this._tickCloneAttacks(now);
    }

    /**
     * Permanent roaming companion (Ranger passive) — never expires.
     * @param {number} now
     * @param {{ damagePercent: number, speedVw?: number, leashVw?: number }} opts
     */
    ensureRoamingCompanion(now, opts) {
        if (this.clone?.roam) {
            // Keep damage in sync if passive params change mid-run
            this.clone.damagePercent = opts.damagePercent ?? this.clone.damagePercent;
            if (opts.speedVw != null) this.clone.speedVw = opts.speedVw;
            if (opts.leashVw != null) this.clone.leashVw = opts.leashVw;
            return;
        }
        this.dismiss();

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

        this.clone = {
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
        if (!this.clone?.roam) return;
        this.clone.x = x;
        this.clone.y = y;
        this.clone.el.style.left = `${x}vw`;
        this.clone.el.style.top = `${y}vh`;
    }

    /**
     * Summon if off cooldown and no active clone.
     * @param {number} level
     * @param {number} now
     * @returns {boolean}
     */
    trySummon(level, now) {
        const s = this.game.state;
        const cfg = getIllusionConfig(level);
        if (level <= 0 || this.clone) return false;
        if (now - (s.skillCooldowns.illusion || 0) < cfg.cooldown) return false;

        s.skillCooldowns.illusion = now;
        this._spawn(now, cfg);
        this.game.audio?.playSkillSfx?.('illusion');
        this.game.effects?.spawnCastFlash(
            parseFloat(this.clone.el.style.left),
            parseFloat(this.clone.el.style.top),
            'arcane'
        );
        return true;
    }

    /** @param {number} now @param {ReturnType<typeof getIllusionConfig>} cfg */
    _spawn(now, cfg) {
        const { x, y } = this.game.ui.getPlayerPosition();
        const el = document.createElement('div');
        el.className = 'illusion-clone';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = buildCompanionModelHtml('illusion');
        el.style.left = `${x + cfg.offsetVw}vw`;
        el.style.top = `${y}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        this.clone = {
            el,
            x: x + cfg.offsetVw,
            y,
            expiresAt: now + cfg.duration,
            lastAttackTime: 0,
            damagePercent: cfg.damagePercent,
            roam: false
        };

        el.classList.add('illusion-spawn-in');
        setTimeout(() => el.classList.remove('illusion-spawn-in'), 500);
    }

    /** Ranger passive: ranged bot chase within leash. */
    _tickRoamMovement() {
        const clone = this.clone;
        if (!clone?.roam) return;

        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const attackRangePx = this.game.state.stats.attackRange;

        // Prefer stored coords so attack animations can't jitter pathing
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
        this.setRoamPosition(step.x, step.y);
    }

    _syncPosition() {
        if (!this.clone || this.clone.roam) return;
        const cfg = getIllusionConfig(this.game.state.skillList.illusion?.level || 1);
        const { x, y } = this.game.ui.getPlayerPosition();
        this.clone.x = x + cfg.offsetVw;
        this.clone.y = y;
        this.clone.el.style.left = `${this.clone.x}vw`;
        this.clone.el.style.top = `${this.clone.y}vh`;
    }

    _tickCloneAttacks(now) {
        const s = this.game.state;
        if (!this.clone || s.gamePaused || s.gameOver) return;

        const interval = 1000 / s.stats.attackSpeed;
        if (now - this.clone.lastAttackTime < interval) return;

        const x = Number.isFinite(this.clone.x)
            ? this.clone.x
            : parseFloat(this.clone.el.style.left);
        const y = Number.isFinite(this.clone.y)
            ? this.clone.y
            : parseFloat(this.clone.el.style.top);
        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        this.clone.lastAttackTime = now;

        this.clone.el.classList.remove('illusion-attacking');
        void this.clone.el.offsetWidth;
        this.clone.el.classList.add('illusion-attacking');

        this.game._attackNearestEnemy(x, y, null, null, {
            rangeCenterX: px,
            rangeCenterY: py,
            damageMultiplier: this.clone.damagePercent / 100,
            skipPlayerAnim: true,
            projectileClass: 'projectile-illusion'
        });
    }

    dismiss() {
        if (!this.clone) return;
        this.clone.el.remove();
        this.clone = null;
    }

    cleanup() {
        this.dismiss();
    }

    isActive() {
        return Boolean(this.clone);
    }
}
