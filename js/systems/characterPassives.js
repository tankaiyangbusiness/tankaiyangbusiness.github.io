/**
 * Runtime executor for unique character passives.
 * Keeps game.js thin — balance knobs live in characterPassives.js.
 */
import {
    getCharacterPassive,
    ELEMENTALIST_ELEMENTS
} from '../config/characterPassives.js';
import { findEnemiesInRadius, getSkillTags } from '../config/skills.js';
import { distanceVw, rollChance } from '../utils/math.js';
import { companionAiStep } from '../utils/companionAi.js';
import { buildCompanionModelHtml } from '../ui/entityModels.js';
import { getSimulatedMs, intervalElapsed } from './gameClock.js';

export class CharacterPassiveManager {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
        this.game = game;
        /** @type {import('../config/characterPassives.js').CharacterPassiveDef|null} */
        this.def = null;
        this._lastPulse = 0;
        this._lastSnack = 0;
        this._frenzyUntil = 0;
        this._frenzyReadyAt = 0;
        this._frenzyBonus = 0;
        this._frenzyDurationMs = 0;
        this._shield = 0;
        this._shieldMax = 0;
        this._lastShieldRepair = 0;
        this._zombie = null;
        this._zombieReadyAt = 0;
        this._bears = [];
    }

    /** @param {string} characterName */
    activate(characterName) {
        this.cleanup();
        this.def = getCharacterPassive(characterName);
        if (!this.def) return;

        const now = this._getSimNow();

        if (this.def.id === 'paladin') this._initShield(now);
        if (this.def.id === 'summoner') this._spawnBears();
        if (this.def.id === 'berserker') this._frenzyReadyAt = now;
        if (this.def.id === 'necromancer') this._zombieReadyAt = now;

        this.game.ui?.setCharacterPassive?.(this.def);
        this.refreshPassiveHud(now);
    }

    /** @param {number} [now] */
    refreshPassiveHud(now = this._getSimNow()) {
        this.game.ui?.updatePassiveHud?.({
            shield: this._shield,
            shieldMax: this._shieldMax,
            frenzyActive: now < this._frenzyUntil
        });
    }

    _getSimNow() {
        return getSimulatedMs(this.game.state);
    }

    /** @param {number} now */
    tick(now) {
        if (!this.def || this.game.state.gamePaused || this.game.state.gameOver) return;

        switch (this.def.id) {
            case 'healer': this._tickHealerPulse(now); break;
            case 'necromancer': this._tickNecromancer(now); break;
            case 'paladin': this._tickPaladinShield(now); break;
            case 'berserker': this._tickBerserkerFrenzy(now); break;
            case 'summoner': this._tickBears(now); break;
            case 'capybara': this._tickCapybara(now); break;
            case 'ranger': this._tickRangerIllusion(now); break;
            default: break;
        }

        this.refreshPassiveHud(now);
    }

    /**
     * @param {object} hitEnemy
     * @param {{ damage: number, isCritical: boolean, missed?: boolean }} result
     */
    onBasicHit(hitEnemy, result) {
        if (!this.def || result?.missed || !hitEnemy) return;
        const ex = parseFloat(hitEnemy.element.style.left);
        const ey = parseFloat(hitEnemy.element.style.top);

        if (this.def.id === 'warrior' && rollChance(this.def.params.chance)) {
            this._splashAround(ex, ey, this.def.params.radiusPx, result.damage * this.def.params.splashMult, hitEnemy.id, 'fire');
            this.game.effects?.spawnMegaExplosion?.(ex, ey, 'fire');
        }

        if (this.def.id === 'assassin' && result.isCritical && rollChance(this.def.params.chance)) {
            this._splashAround(ex, ey, this.def.params.radiusPx, result.damage * this.def.params.splashMult, hitEnemy.id, 'crit');
        }
    }

    /**
     * @param {number} damage
     * @param {{ element?: string, skillId?: string, tags?: string[] }} [context]
     */
    modifySkillDamage(damage, context = {}) {
        if (!this.def) return damage;

        const tags = context.tags?.length
            ? context.tags
            : (context.skillId ? getSkillTags(context.skillId) : []);

        if (this.def.id === 'elementalist') {
            if (tags.includes('elemental')) {
                return Math.floor(damage * (1 + this.def.params.elementBonus));
            }
            if (context.element && ELEMENTALIST_ELEMENTS.has(context.element)) {
                return Math.floor(damage * (1 + this.def.params.elementBonus));
            }
        }

        if (this.def.id === 'slayer') {
            const isPhysicalSkill = tags.includes('physical');
            const isPhysicalElement = context.element === 'physical';
            if (isPhysicalSkill || isPhysicalElement) {
                return Math.floor(damage * (1 + this.def.params.physicalBonus));
            }
        }

        return damage;
    }

    /**
     * Flat physical/basic-attack multiplier (Slayer).
     * @param {number} damage
     */
    modifyPhysicalDamage(damage) {
        if (this.def?.id !== 'slayer') return damage;
        return Math.floor(damage * (1 + this.def.params.physicalBonus));
    }

    /** @param {number} expGain */
    modifyExpGain(expGain) {
        if (this.def?.id !== 'adventurer') return expGain;
        return expGain * (1 + this.def.params.expBonus);
    }

    /** @param {number} damage @returns {number} remaining HP damage */
    absorbDamage(damage) {
        if (this.def?.id !== 'paladin' || this._shield <= 0) return damage;
        const blocked = Math.min(this._shield, damage);
        this._shield -= blocked;
        this.refreshPassiveHud();
        return damage - blocked;
    }

    getShieldState() {
        return { current: this._shield, max: this._shieldMax };
    }

    cleanup() {
        this._clearFrenzy();
        this._zombie?.el?.remove();
        this._zombie = null;
        this._bears.forEach(b => b.el?.remove());
        this._bears = [];
        this._shield = 0;
        this._shieldMax = 0;
        this.def = null;
        this.game.ui?.clearCharacterPassive?.();
    }

    // --- implementation ---

    _initShield(now) {
        this._syncPaladinShieldCap();
        this._shield = this._shieldMax;
        this._lastShieldRepair = now;
    }

    _syncPaladinShieldCap() {
        if (this.def?.id !== 'paladin') return;
        const maxHp = this.game.state.stats.maxHp;
        this._shieldMax = Math.max(1, Math.floor(maxHp * this.def.params.shieldPercent / 100));
        this._shield = Math.min(this._shield, this._shieldMax);
    }

    _tickPaladinShield(now) {
        this._syncPaladinShieldCap();
        if (!intervalElapsed(this._lastShieldRepair, this.def.params.repairIntervalMs, now)) return;
        this._lastShieldRepair = now;
        this._shield = this._shieldMax;
        const { x, y } = this.game.ui.getPlayerPosition();
        this.game.effects?.spawnCastFlash?.(x, y, 'heal');
    }

    _tickHealerPulse(now) {
        if (now - this._lastPulse < this.def.params.intervalMs) return;
        this._lastPulse = now;
        const { x, y } = this.game.ui.getPlayerPosition();
        const damage = Math.max(1, Math.floor(this.game.state.stats.hpRegen * this.def.params.regenDamageMult));
        this._splashAround(x, y, this.def.params.radiusPx, damage, null, 'heal');
        this.game.effects?.spawnCastFlash?.(x, y, 'heal');
        this.game.skillRanges?.showImpactArea?.(x, y, this.def.params.radiusPx, 'holy', 650);
    }

    _tickCapybara(now) {
        if (now - this._lastSnack < this.def.params.intervalMs) return;
        this._lastSnack = now;
        const s = this.game.state;
        const { x, y } = this.game.ui.getPlayerPosition();
        const damage = Math.max(1, Math.floor(s.stats.physicalDamage * this.def.params.damageMult));
        this._splashAround(x, y, this.def.params.radiusPx, damage, null, 'cold');
        this.game.skillRanges?.showImpactArea?.(x, y, this.def.params.radiusPx, 'cold', 700);

        const heal = Math.max(1, Math.floor(s.stats.maxHp * this.def.params.healPercent / 100));
        s.stats.hp = Math.min(s.stats.maxHp, s.stats.hp + heal);
        this.game.effects?.spawnDamageNumber?.(x, y - 2, heal, false, 'heal');
        this.game.effects?.spawnCastFlash?.(x, y, 'cold');

        s.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            if (distanceVw(x, y, ex, ey, window.innerWidth, window.innerHeight) <= this.def.params.radiusPx) {
                this.game._applySlow?.(enemy, this.def.params.chillPercent, this.def.params.chillDurationMs);
            }
        });
    }

    _tickBerserkerFrenzy(now) {
        if (now < this._frenzyUntil) return;
        this._clearFrenzy();
        if (now < this._frenzyReadyAt) return;

        const bonus = this.game.state.stats.attackSpeed * (this.def.params.bonusPercent / 100);
        this._frenzyBonus = bonus;
        this.game.state.stats.attackSpeed += bonus;
        this._frenzyDurationMs = this.def.params.durationMs;
        this._frenzyUntil = now + this._frenzyDurationMs;
        this._frenzyReadyAt = this._frenzyUntil + (this.def.params.cooldownMs - this.def.params.durationMs);

        this.game.buffTracker?.apply({
            id: 'berserker-frenzy',
            name: 'Blood Frenzy',
            icon: '🩸',
            description: `+${this.def.params.bonusPercent}% attack speed`,
            durationMs: this.def.params.durationMs,
            now
        });

        const { x, y } = this.game.ui.getPlayerPosition();
        this.game.effects?.spawnCastFlash?.(x, y, 'fire');
    }

    _clearFrenzy() {
        if (this._frenzyBonus > 0 && this.game.state?.stats) {
            this.game.state.stats.attackSpeed = Math.max(
                0.1,
                this.game.state.stats.attackSpeed - this._frenzyBonus
            );
        }
        this._frenzyBonus = 0;
        this._frenzyUntil = 0;
        this.game.buffTracker?.remove('berserker-frenzy');
    }

    _tickNecromancer(now) {
        if (this._zombie) {
            if (now >= this._zombie.expiresAt) {
                this._zombie.el.remove();
                this._zombie = null;
                this._zombieReadyAt = now + this.def.params.cooldownMs;
                this.game.buffTracker?.remove('raise-zombie');
                return;
            }
            this._tickCombatMinion(this._zombie, now, {
                homeOffsetX: this.def.params.offsetVw,
                homeOffsetY: 0,
                leashVw: 14
            });
            return;
        }
        if (now < this._zombieReadyAt) return;
        this._spawnZombie(now);
    }

    _spawnZombie(now) {
        const { x, y } = this.game.ui.getPlayerPosition();
        const el = document.createElement('div');
        el.className = 'passive-minion passive-zombie';
        el.innerHTML = buildCompanionModelHtml('zombie');
        el.style.left = `${x + this.def.params.offsetVw}vw`;
        el.style.top = `${y}vh`;
        this.game.ui.els.gameContainer.appendChild(el);
        this._zombie = {
            el,
            x: x + this.def.params.offsetVw,
            y,
            expiresAt: now + this.def.params.durationMs,
            lastAttack: 0,
            damagePercent: this.def.params.damagePercent,
            moveSpeed: this.def.params.moveSpeed,
            attackIntervalMs: this.def.params.attackIntervalMs
        };
        this.game.buffTracker?.apply({
            id: 'raise-zombie',
            name: 'Raise Zombie',
            icon: '🧟',
            description: 'A zombie fights beside you',
            durationMs: this.def.params.durationMs,
            now
        });
        this.game.effects?.spawnCastFlash?.(x, y, 'chaos');
    }

    _spawnBears() {
        const { x, y } = this.game.ui.getPlayerPosition();
        const count = this.def.params.count;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const ox = Math.cos(angle) * this.def.params.orbitVw;
            const oy = Math.sin(angle) * this.def.params.orbitVw;
            const el = document.createElement('div');
            el.className = 'passive-minion passive-bear';
            el.innerHTML = buildCompanionModelHtml('bear');
            el.style.left = `${x + ox}vw`;
            el.style.top = `${y + oy}vh`;
            this.game.ui.els.gameContainer.appendChild(el);
            this._bears.push({
                el,
                x: x + ox,
                y: y + oy,
                homeOffsetX: ox,
                homeOffsetY: oy,
                lastAttack: 0,
                damagePercent: this.def.params.damagePercent,
                moveSpeed: this.def.params.moveSpeed,
                attackIntervalMs: this.def.params.attackIntervalMs
            });
        }
    }

    _tickBears(now) {
        this._bears.forEach(bear => {
            this._tickCombatMinion(bear, now, {
                homeOffsetX: bear.homeOffsetX,
                homeOffsetY: bear.homeOffsetY,
                leashVw: 16
            });
        });
    }

    _tickRangerIllusion(now) {
        const cloneMgr = this.game.illusionClone;
        if (!cloneMgr) return;

        const iw = window.innerWidth;
        const leashVw = Math.max(
            12,
            (this.game.state.stats.attackRange / iw) * 100 * (this.def.params.roamRadiusFraction || 0.85) + 4
        );

        // Spawn / refresh roam clone — movement runs inside IllusionCloneManager.tick
        cloneMgr.ensureRoamingCompanion(now, {
            damagePercent: this.def.params.damagePercent,
            speedVw: 0.55,
            leashVw
        });
    }

    /**
     * Combat minion AI: chase foes, attack in melee, return home.
     */
    _tickCombatMinion(minion, now, opts) {
        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const step = companionAiStep(
            { x: minion.x, y: minion.y },
            {
                ownerX: px,
                ownerY: py,
                enemies: this.game.state.enemies,
                speedVw: minion.moveSpeed,
                leashVw: opts.leashVw,
                homeOffsetX: opts.homeOffsetX,
                homeOffsetY: opts.homeOffsetY,
                attackRangePx: 48,
                innerWidth: iw,
                innerHeight: ih
            }
        );
        minion.x = step.x;
        minion.y = step.y;
        minion.el.style.left = `${step.x}vw`;
        minion.el.style.top = `${step.y}vh`;

        if (!step.target || !step.inAttackRange) return;
        if (now - minion.lastAttack < minion.attackIntervalMs) return;
        minion.lastAttack = now;
        const damage = Math.max(1, Math.floor(this.game.state.stats.physicalDamage * minion.damagePercent / 100));
        this.game._dealSkillDamageToEnemy?.(step.target, damage, 'physical', false);

        // Directional melee jab toward the target
        const tx = parseFloat(step.target.element.style.left);
        const ty = parseFloat(step.target.element.style.top);
        const dx = (tx - minion.x) * iw / 100;
        const dy = (ty - minion.y) * ih / 100;
        const len = Math.hypot(dx, dy) || 1;
        minion.el.style.setProperty('--melee-lunge-x', `${(dx / len) * 10}px`);
        minion.el.style.setProperty('--melee-lunge-y', `${(dy / len) * 10}px`);
        minion.el.classList.remove('passive-minion-attack');
        void minion.el.offsetWidth;
        minion.el.classList.add('passive-minion-attack');
    }

    _getViewport() {
        return {
            innerWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
            innerHeight: typeof window !== 'undefined' ? window.innerHeight : 1080
        };
    }

    _splashAround(cx, cy, radiusPx, damage, excludeId, element) {
        const dmg = Math.max(1, Math.floor(damage));
        const { innerWidth, innerHeight } = this._getViewport();
        const targets = findEnemiesInRadius(
            this.game.state.enemies.map(e => ({
                id: e.id,
                x: parseFloat(e.element.style.left),
                y: parseFloat(e.element.style.top),
                hp: e.stats.hp,
                ref: e
            })),
            cx, cy, radiusPx, innerWidth, innerHeight, excludeId
        );
        targets.forEach(t => {
            if (t.ref) this.game._dealSkillDamageToEnemy?.(t.ref, dmg, element, false);
        });
    }
}
