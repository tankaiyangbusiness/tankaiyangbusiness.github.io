/**
 * Runtime execution of active skills — separate from passive abilities.
 */
import {
    SKILL_IDS,
    getFireballConfig,
    getIceNovaConfig,
    getLightningArcConfig,
    getPoisonBottleConfig,
    getHealingWaveConfig,
    getFrostboltConfig,
    getRighteousFireConfig,
    getSparkConfig,
    getPoisonDaggerConfig,
    getHammerSweepConfig,
    getThrowSpearConfig,
    findEnemiesInRadius,
    findChainTargets,
    computeSkillDamage,
    computeSplashDamage,
    computeBurnTotal,
    computePoisonDaggerForkDamage
} from '../config/skills.js';
import { distanceVw } from '../utils/math.js';
import { getProjectedSimMs } from './gameClock.js';
import { flashPlayerSprite } from '../ui/playerVisuals.js';
import { RUNTIME_BUDGET } from '../config/runtimeBudget.js';
import { TransientDomRegistry } from '../utils/transientDomRegistry.js';

export class SkillExecutor {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
        this.game = game;
        this._rfLastTick = 0;
        this._rfLastSfx = 0;
        this._activeSparks = [];
        this._transientDom = new TransientDomRegistry(RUNTIME_BUDGET.maxTransientDomLifetimeMs);
    }

    /**
     * Tracks a skill projectile DOM node with a hard lifetime cap and safe disposal.
     * @param {HTMLElement} el
     * @param {import('../game/gameState.js').GameState} state
     */
    _trackSkillProjectile(el, state) {
        let animId = null;
        const dispose = () => {
            if (animId != null) {
                state.cancelAnimation(animId);
                animId = null;
            }
            this._transientDom.untrack(el);
            el.remove();
        };
        this._transientDom.track(el, dispose);
        return {
            setAnimId: (id) => { animId = id; },
            dispose
        };
    }

    /** @param {number} now */
    tick(now) {
        const s = this.game.state;
        if (s.gamePaused || s.gameOver) return;

        this._transientDom.purgeExpired();

        const rfLevel = s.skillList.righteousFire?.level || 0;
        if (rfLevel > 0) this._tickRighteousFire(now, rfLevel);

        this._tickSparks(now);

        const illusionLevel = s.skillList.illusion?.level || 0;
        if (illusionLevel > 0) {
            this.game.illusionClone?.trySummon(illusionLevel, now);
        }

        SKILL_IDS.forEach(skillId => {
            const level = s.skillList[skillId]?.level || 0;
            if (level <= 0) return;
            if (skillId === 'righteousFire' || skillId === 'illusion') return;

            const cfg = getSkillConfigFor(skillId, level);
            const lastCast = s.skillCooldowns[skillId] || 0;
            if (now - lastCast < cfg.cooldown) return;

            const { x: px, y: py } = this.game.ui.getPlayerPosition();
            const hasTarget = s.enemies.some(e => e.stats.hp > 0);

            if (skillId === 'iceNova') {
                s.skillCooldowns[skillId] = now;
                this.game.audio?.playSkillSfx?.('iceNova');
                this.castIceNova(px, py, level);
            } else if (skillId === 'hammerSweep') {
                if (!hasTarget) return;
                s.skillCooldowns[skillId] = now;
                this.game.audio?.playSkillSfx?.('hammerSweep');
                this.castHammerSweep(px, py, level);
            } else if (skillId === 'healingWave') {
                if (s.stats.hp < s.stats.maxHp * 0.92) {
                    s.skillCooldowns[skillId] = now;
                    this.game.audio?.playSkillSfx?.('healingWave');
                    this.castHealingWave(px, py, level);
                }
            } else if (skillId === 'spark') {
                s.skillCooldowns[skillId] = now;
                this.game.audio?.playSkillSfx?.('spark');
                this.castSpark(px, py, level);
            } else if (hasTarget) {
                s.skillCooldowns[skillId] = now;
                this.game.audio?.playSkillSfx?.(skillId);
                if (skillId === 'fireball') this.castFireball(px, py, level);
                else if (skillId === 'lightningArc') this.castLightningArc(px, py, level);
                else if (skillId === 'poisonBottle') this.castPoisonBottle(px, py, level);
                else if (skillId === 'frostbolt') this.castFrostbolt(px, py, level);
                else if (skillId === 'poisonDagger') this.castPoisonDagger(px, py, level);
                else if (skillId === 'throwSpear') this.castThrowSpear(px, py, level);
            }
        });
    }

    castFireball(px, py, level) {
        const s = this.game.state;
        const cfg = getFireballConfig(level);
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('fireball');
        this.game.effects.spawnCastFlash(px, py, 'fire');

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-fireball';
        el.innerHTML = '<div class="skill-fireball-core"></div><div class="skill-fireball-trail"></div>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2(ty - py, tx - px);
        let bx = px; let by = py;
        const tracker = this._trackSkillProjectile(el, s);
        let lastAnimId = null;

        const animate = () => {
            if (s.gamePaused || s.gameOver) {
                tracker.dispose();
                return;
            }

            bx += Math.cos(angle) * cfg.projectileSpeed;
            by += Math.sin(angle) * cfg.projectileSpeed;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;

            let hit = null;
            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0) continue;
                const ex = parseFloat(enemy.element.style.left);
                const ey = parseFloat(enemy.element.style.top);
                const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
                const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
                if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2) {
                    hit = enemy;
                    break;
                }
            }

            if (hit || distanceVw(bx, by, tx, ty, window.innerWidth, window.innerHeight) < 15) {
                tracker.dispose();
                this._fireballExplode(bx, by, level, hit);
                return;
            }

            const animId = requestAnimationFrame(animate);
            tracker.setAnimId(animId);
            s.trackAnimation(animId, lastAnimId);
            lastAnimId = animId;
        };

        animate();
    }

    _fireballExplode(bx, by, level, directHit) {
        const s = this.game.state;
        const base = s.stats.physicalDamage;
        const cfg = getFireballConfig(level);
        const directDmg = computeSkillDamage(base, 'fireball', level);
        const splashDmg = computeSplashDamage(base, level);
        const burnTotal = computeBurnTotal(base, level);

        this.game.skillRanges?.showImpactArea(bx, by, cfg.splashRadius, 'fire', 800);
        this.game.effects.spawnMegaExplosion(bx, by, 'fire');
        this.game.effects.spawnHitEffect(bx, by, 'fire');

        const hitSet = new Set();
        if (directHit?.stats.hp > 0) {
            this.game._dealSkillDamageToEnemy(directHit, directDmg, 'fire', false, 'fireball');
            this.game._applyBurn(directHit, burnTotal, cfg.burnDuration);
            hitSet.add(directHit.id);
        }

        findEnemiesInRadius(
            s.enemies.map(e => ({
                id: e.id, x: parseFloat(e.element.style.left),
                y: parseFloat(e.element.style.top), hp: e.stats.hp, ref: e
            })),
            bx, by, cfg.splashRadius, window.innerWidth, window.innerHeight
        ).forEach(t => {
            if (hitSet.has(t.id) || !t.ref) return;
            this.game._dealSkillDamageToEnemy(t.ref, splashDmg, 'fire', false, 'fireball');
            this.game._applyBurn(t.ref, Math.floor(burnTotal * 0.5), cfg.burnDuration);
        });
    }

    castIceNova(px, py, level) {
        const s = this.game.state;
        const cfg = getIceNovaConfig(level);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'iceNova', level);

        this.game.skillRanges?.flash('iceNova');
        this.game.skillRanges?.showImpactArea(px, py, cfg.radius, 'cold', 900);

        const ring = document.createElement('div');
        ring.className = 'skill-ice-nova skill-ice-nova-enhanced';
        ring.style.left = `${px}vw`;
        ring.style.top = `${py}vh`;
        ring.style.width = `${cfg.radius * 2}px`;
        ring.style.height = `${cfg.radius * 2}px`;
        this.game.ui.els.gameContainer.appendChild(ring);
        s.trackTimeout(setTimeout(() => ring.remove(), 900));

        for (let i = 0; i < 8; i++) {
            const shard = document.createElement('div');
            shard.className = 'ice-nova-shard';
            const a = (i / 8) * Math.PI * 2;
            shard.style.left = `${px + Math.cos(a) * cfg.radius / window.innerWidth * 100 * 0.8}vw`;
            shard.style.top = `${py + Math.sin(a) * cfg.radius / window.innerHeight * 100 * 0.8}vh`;
            this.game.ui.els.gameContainer.appendChild(shard);
            s.trackTimeout(setTimeout(() => shard.remove(), 700));
        }

        this.game.effects.spawnCastFlash(px, py, 'cold');
        flashPlayerSprite(this.game.ui.els.player, 'player-casting-nova', 450);

        s.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) > cfg.radius) return;

            this.game._dealSkillDamageToEnemy(enemy, damage, 'cold', false, 'iceNova');
            this.game._applySlow(enemy, cfg.slowPercent, cfg.slowDuration);
            if (cfg.freezeDuration > 0) this.game._applyFreeze(enemy, cfg.freezeDuration);
        });
    }

    castLightningArc(px, py, level) {
        const s = this.game.state;
        const cfg = getLightningArcConfig(level);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'lightningArc', level);

        const enemyData = s.enemies.map(e => ({
            id: e.id, x: parseFloat(e.element.style.left),
            y: parseFloat(e.element.style.top), hp: e.stats.hp, ref: e
        }));

        const first = findChainTargets(enemyData, px, py, null, 1, cfg.castRange, window.innerWidth, window.innerHeight);
        if (first.length === 0) return;

        this.game.skillRanges?.flash('lightningArc');
        this.game.effects.spawnCastFlash(px, py, 'lightning');

        let prevX = px, prevY = py, excludeId = null;
        const chain = [];

        for (let i = 0; i <= cfg.chainCount; i++) {
            const targets = findChainTargets(enemyData, prevX, prevY, excludeId, 1, cfg.chainRange, window.innerWidth, window.innerHeight);
            if (!targets.length) break;
            const t = targets[0];
            chain.push(t);
            this.game.effects.spawnLightningBolt(prevX, prevY, t.x, t.y, true);
            prevX = t.x; prevY = t.y; excludeId = t.id;
        }

        chain.forEach(t => {
            if (t.ref) this.game._dealSkillDamageToEnemy(t.ref, damage, 'lightning', false, 'lightningArc');
        });

        if (chain.length) this.game.effects.spawnMegaExplosion(chain[0].x, chain[0].y, 'lightning');
    }

    castPoisonBottle(px, py, level) {
        const s = this.game.state;
        const cfg = getPoisonBottleConfig(level);
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('poisonBottle');
        this.game.effects.spawnCastFlash(px, py, 'chaos');

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-poison-bottle skill-chaos-bottle';
        el.innerHTML = '<div class="poison-bottle-icon chaos-bottle-icon"></div>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2(ty - py, tx - px);
        let bx = px, by = py;
        const tracker = this._trackSkillProjectile(el, s);
        let lastAnimId = null;

        const animate = () => {
            if (s.gamePaused || s.gameOver) {
                tracker.dispose();
                return;
            }

            bx += Math.cos(angle) * cfg.projectileSpeed;
            by += Math.sin(angle) * cfg.projectileSpeed;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;
            el.style.transform = `translate(-50%, -50%) rotate(${Date.now() / 8 % 360}deg)`;

            let hit = null;
            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0) continue;
                const ex = parseFloat(enemy.element.style.left);
                const ey = parseFloat(enemy.element.style.top);
                const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
                const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
                if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2) {
                    hit = enemy;
                    break;
                }
            }

            if (hit || distanceVw(bx, by, tx, ty, window.innerWidth, window.innerHeight) < 12) {
                tracker.dispose();
                this._poisonShatter(bx, by, level, hit);
                return;
            }

            const animId = requestAnimationFrame(animate);
            tracker.setAnimId(animId);
            s.trackAnimation(animId, lastAnimId);
            lastAnimId = animId;
        };

        animate();
    }

    _poisonShatter(bx, by, level, directHit) {
        const s = this.game.state;
        const cfg = getPoisonBottleConfig(level);
        const impactDmg = computeSkillDamage(s.stats.physicalDamage, 'poisonBottle', level);

        this.game.effects.spawnMegaExplosion(bx, by, 'chaos');
        if (directHit?.stats.hp > 0) {
            this.game._dealSkillDamageToEnemy(directHit, impactDmg, 'chaos', false, 'poisonBottle');
        }

        this.game.poisonPools.createPool(bx, by, level, s.stats.physicalDamage);
    }

    castHealingWave(px, py, level) {
        const s = this.game.state;
        const cfg = getHealingWaveConfig(level);
        const heal = Math.max(1, Math.floor(s.stats.maxHp * cfg.healPercent / 100));
        s.stats.hp = Math.min(s.stats.maxHp, s.stats.hp + heal);

        this.game.effects.spawnCastFlash(px, py, 'heal');
        this.game.effects.spawnDamageNumber(px, py, heal, false, 'heal');
        flashPlayerSprite(this.game.ui.els.player, 'buff');
    }

    castFrostbolt(px, py, level) {
        const s = this.game.state;
        const cfg = getFrostboltConfig(level);
        // Always originate at screen/player center (idle arena sits at 50/50).
        const originX = Number.isFinite(px) ? px : 50;
        const originY = Number.isFinite(py) ? py : 50;
        const nearest = this._findNearestEnemy(originX, originY, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('frostbolt');
        this.game.effects.spawnCastFlash(originX, originY, 'cold');

        const el = document.createElement('div');
        // skill-projectile first so position:absolute wins over particle helpers
        el.className = 'skill-projectile skill-frostbolt particle-25d skill-frostbolt-fly';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="frostbolt-trail" aria-hidden="true"></span>';
        el.style.position = 'absolute';
        el.style.left = `${originX}vw`;
        el.style.top = `${originY}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const iw = window.innerWidth || 1;
        const ih = window.innerHeight || 1;
        // Pixel-isotropic aim so motion stays screen-true (not skewed by vw/vh aspect)
        const angle = Math.atan2((ty - originY) * ih / 100, (tx - originX) * iw / 100);
        el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;

        const speedPx = cfg.projectileSpeed * iw / 100;
        const maxTravelPx = cfg.maxTravel * iw / 100;

        let bx = originX;
        let by = originY;
        let prevBx = originX;
        let prevBy = originY;
        let traveledPx = 0;
        const hitIds = new Set();
        const tracker = this._trackSkillProjectile(el, s);
        let lastAnimId = null;
        const damage = computeSkillDamage(s.stats.physicalDamage, 'frostbolt', level);
        const pierceRadius = 2.2 + level * 0.2;
        const maxPierce = cfg.maxPierce ?? Infinity;

        const animate = () => {
            if (s.gamePaused || s.gameOver) {
                tracker.dispose();
                return;
            }

            prevBx = bx;
            prevBy = by;
            const stepXvw = (Math.cos(angle) * speedPx) * 100 / iw;
            const stepYvh = (Math.sin(angle) * speedPx) * 100 / ih;
            bx += stepXvw;
            by += stepYvh;
            traveledPx += speedPx;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;

            let exhausted = false;
            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0 || hitIds.has(enemy.id)) continue;
                const hit = projectileSegmentHitsEnemy(
                    prevBx, prevBy, bx, by, enemy, iw, ih, pierceRadius
                ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, pierceRadius);
                if (hit) {
                    hitIds.add(enemy.id);
                    this.game._dealSkillDamageToEnemy(enemy, damage, 'cold', false, 'frostbolt');
                    this.game._applySlow(enemy, 12 + level * 3, 1500);
                    if (hasExhaustedPierce(hitIds.size, maxPierce)) {
                        exhausted = true;
                        break;
                    }
                }
            }

            const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
            if (exhausted || traveledPx >= maxTravelPx || offscreen) {
                tracker.dispose();
                return;
            }

            const animId = requestAnimationFrame(animate);
            tracker.setAnimId(animId);
            s.trackAnimation(animId, lastAnimId);
            lastAnimId = animId;
        };

        animate();
    }

    /**
     * Chaos dagger that forks into angled secondary blades on first contact.
     * @param {number} px @param {number} py @param {number} level
     */
    castPoisonDagger(px, py, level) {
        const s = this.game.state;
        const cfg = getPoisonDaggerConfig(level);
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('poisonDagger');
        this.game.effects.spawnCastFlash(px, py, 'chaos');

        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2((ty - py) * ih / 100, (tx - px) * iw / 100);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'poisonDagger', level);

        this._launchChaosDagger({
            px, py, angle, level, damage,
            maxTravelVw: cfg.maxTravel,
            speed: cfg.projectileSpeed,
            hitRadiusVw: cfg.hitRadiusVw,
            canFork: true
        });
    }

    /**
     * @param {{ px:number, py:number, angle:number, level:number, damage:number,
     *   maxTravelVw:number, speed:number, hitRadiusVw:number, canFork:boolean,
     *   sharedHitIds?: Set<string> }} opts
     */
    _launchChaosDagger(opts) {
        const s = this.game.state;
        const {
            px, py, angle, level, damage,
            maxTravelVw, speed, hitRadiusVw, canFork
        } = opts;
        const sharedHitIds = opts.sharedHitIds || new Set();
        const cfg = getPoisonDaggerConfig(level);
        const iw = window.innerWidth;
        const ih = window.innerHeight;

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-poison-dagger particle-25d skill-poison-dagger-fly';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="dagger-trail" aria-hidden="true"></span>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
        this.game.ui.els.gameContainer.appendChild(el);

        let bx = px;
        let by = py;
        let prevBx = px;
        let prevBy = py;
        let traveled = 0;
        const tracker = this._trackSkillProjectile(el, s);
        let lastAnimId = null;
        let forked = false;

        const animate = () => {
            if (s.gamePaused || s.gameOver) {
                tracker.dispose();
                return;
            }

            prevBx = bx;
            prevBy = by;
            bx += Math.cos(angle) * speed;
            by += Math.sin(angle) * speed;
            traveled += speed;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;

            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0 || sharedHitIds.has(enemy.id)) continue;
                const hit = projectileSegmentHitsEnemy(
                    prevBx, prevBy, bx, by, enemy, iw, ih, hitRadiusVw
                ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, hitRadiusVw);
                if (!hit) continue;

                sharedHitIds.add(enemy.id);
                this.game._dealSkillDamageToEnemy(enemy, damage, 'chaos', false, 'poisonDagger');
                this.game.effects.spawnHitEffect(bx, by, 'chaos');

                if (canFork && !forked) {
                    forked = true;
                    const forkDmg = computePoisonDaggerForkDamage(s.stats.physicalDamage, level);
                    const count = cfg.forkCount;
                    const spread = cfg.forkSpreadRad;
                    for (let i = 0; i < count; i++) {
                        const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
                        const forkAngle = angle + t * spread;
                        this._launchChaosDagger({
                            px: bx,
                            py: by,
                            angle: forkAngle,
                            level,
                            damage: forkDmg,
                            maxTravelVw: cfg.forkTravel,
                            speed: speed * 0.92,
                            hitRadiusVw,
                            canFork: false,
                            sharedHitIds
                        });
                    }
                }
            }

            const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
            if (traveled >= maxTravelVw || offscreen) {
                tracker.dispose();
                return;
            }

            const animId = requestAnimationFrame(animate);
            tracker.setAnimId(animId);
            s.trackAnimation(animId, lastAnimId);
            lastAnimId = animId;
        };

        animate();
    }

    /** Physical self AoE hammer smash. */
    castHammerSweep(px, py, level) {
        const s = this.game.state;
        const cfg = getHammerSweepConfig(level);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'hammerSweep', level);

        this.game.skillRanges?.flash('hammerSweep');
        this.game.skillRanges?.showImpactArea(px, py, cfg.radius, 'physical', 700);
        this.game.effects.spawnCastFlash(px, py, 'physical');
        flashPlayerSprite(this.game.ui.els.player, 'player-casting-nova', 400);

        const ring = document.createElement('div');
        ring.className = 'skill-hammer-sweep';
        ring.style.left = `${px}vw`;
        ring.style.top = `${py}vh`;
        ring.style.width = `${cfg.radius * 2}px`;
        ring.style.height = `${cfg.radius * 2}px`;
        ring.innerHTML = '<span class="hammer-sweep-head" aria-hidden="true"></span>';
        this.game.ui.els.gameContainer.appendChild(ring);
        s.trackTimeout(setTimeout(() => ring.remove(), 700));

        // Shock arcs for visual punch
        for (let i = 0; i < 6; i++) {
            const shard = document.createElement('div');
            shard.className = 'hammer-sweep-shard';
            const a = (i / 6) * Math.PI * 2;
            const rFrac = 0.7;
            shard.style.left = `${px + Math.cos(a) * cfg.radius / window.innerWidth * 100 * rFrac}vw`;
            shard.style.top = `${py + Math.sin(a) * cfg.radius / window.innerHeight * 100 * rFrac}vh`;
            this.game.ui.els.gameContainer.appendChild(shard);
            s.trackTimeout(setTimeout(() => shard.remove(), 550));
        }

        s.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) > cfg.radius) return;
            this.game._dealSkillDamageToEnemy(enemy, damage, 'physical', false, 'hammerSweep');
            this.game.effects.spawnHitEffect(ex, ey, 'physical');
        });
    }

    /** Line-pierce spear — every enemy on the flight path is hit once. */
    castThrowSpear(px, py, level) {
        const s = this.game.state;
        const cfg = getThrowSpearConfig(level);
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('throwSpear');
        this.game.effects.spawnCastFlash(px, py, 'physical');

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-throw-spear particle-25d skill-throw-spear-fly';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="spear-trail" aria-hidden="true"></span>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const iw = window.innerWidth;
        const ih = window.innerHeight;
        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2((ty - py) * ih / 100, (tx - px) * iw / 100);
        el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI + 90}deg)`;

        const speedPx = cfg.projectileSpeed * iw / 100;
        const maxTravelPx = cfg.maxTravel * iw / 100;
        let bx = px;
        let by = py;
        let prevBx = px;
        let prevBy = py;
        let traveledPx = 0;
        const hitIds = new Set();
        const tracker = this._trackSkillProjectile(el, s);
        let lastAnimId = null;
        const damage = computeSkillDamage(s.stats.physicalDamage, 'throwSpear', level);
        const maxPierce = cfg.maxPierce ?? 2;

        const animate = () => {
            if (s.gamePaused || s.gameOver) {
                tracker.dispose();
                return;
            }

            prevBx = bx;
            prevBy = by;
            const stepXvw = (Math.cos(angle) * speedPx) * 100 / iw;
            const stepYvh = (Math.sin(angle) * speedPx) * 100 / ih;
            bx += stepXvw;
            by += stepYvh;
            traveledPx += speedPx;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;

            let exhausted = false;
            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0 || hitIds.has(enemy.id)) continue;
                const hit = projectileSegmentHitsEnemy(
                    prevBx, prevBy, bx, by, enemy, iw, ih, cfg.hitRadiusVw
                ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, cfg.hitRadiusVw);
                if (hit) {
                    hitIds.add(enemy.id);
                    this.game._dealSkillDamageToEnemy(enemy, damage, 'physical', false, 'throwSpear');
                    this.game.effects.spawnHitEffect(
                        parseFloat(enemy.element.style.left),
                        parseFloat(enemy.element.style.top),
                        'physical'
                    );
                    if (hasExhaustedPierce(hitIds.size, maxPierce)) {
                        exhausted = true;
                        break;
                    }
                }
            }

            const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
            if (exhausted || traveledPx >= maxTravelPx || offscreen) {
                tracker.dispose();
                return;
            }

            const animId = requestAnimationFrame(animate);
            tracker.setAnimId(animId);
            s.trackAnimation(animId, lastAnimId);
            lastAnimId = animId;
        };

        animate();
    }

    _tickRighteousFire(now, level) {
        const s = this.game.state;
        const cfg = getRighteousFireConfig(level);
        if (now - this._rfLastTick < cfg.tickInterval) return;
        this._rfLastTick = now;

        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        const damage = computeSkillDamage(s.stats.physicalDamage, 'righteousFire', level);

        this.game.skillRanges?.flash('righteousFire');
        this.game.effects.spawnCastFlash(px, py, 'fire');
        // Soft fire crackle at most every 2s — avoid PoE-style fatigue spam
        if (now - this._rfLastSfx >= 2000) {
            this._rfLastSfx = now;
            this.game.audio?.playSkillSfx?.('righteousFire');
        }

        const aura = document.createElement('div');
        aura.className = 'skill-righteous-fire-aura';
        aura.style.left = `${px}vw`;
        aura.style.top = `${py}vh`;
        aura.style.width = `${cfg.radius * 2}px`;
        aura.style.height = `${cfg.radius * 2}px`;
        this.game.ui.els.gameContainer.appendChild(aura);
        s.trackTimeout(setTimeout(() => aura.remove(), cfg.tickInterval));

        s.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) <= cfg.radius) {
                this.game._dealSkillDamageToEnemy(enemy, damage, 'fire', false, 'righteousFire');
                this.game._applyBurn(enemy, Math.floor(damage * 0.4), 2000);
            }
        });
    }

    castSpark(px, py, level) {
        const s = this.game.state;
        const simNow = getProjectedSimMs(s);
        const cfg = getSparkConfig(level);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'spark', level);
        const iw = window.innerWidth;
        const aoePx = Math.max(48, (cfg.hitRadiusVw || 6.8) * iw / 100 * 2);

        this.game.skillRanges?.flash('spark');
        this.game.effects.spawnCastFlash(px, py, 'spark');

        // Spawn burst ring at player center — PoE-like origin flash
        const origin = document.createElement('div');
        origin.className = 'spark-origin-burst';
        origin.style.left = `${px}vw`;
        origin.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(origin);
        s.trackTimeout(setTimeout(() => origin.remove(), 420));

        const count = cfg.sparkCount;
        const maxSparks = RUNTIME_BUDGET.maxActiveSparks ?? 24;
        // Even spider spokes + random jitter so directions fill around the player
        const baseAngle = Math.random() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            if (this._activeSparks.length >= maxSparks) break;
            const el = document.createElement('div');
            el.className = 'skill-spark skill-spark-arc particle-25d';
            el.innerHTML = `
                <span class="spark-aoe-ring" aria-hidden="true"></span>
                <span class="particle-25d-face"></span>
                <span class="spark-core-glow" aria-hidden="true"></span>
            `;
            // Always spawn from player center
            el.style.left = `${px}vw`;
            el.style.top = `${py}vh`;
            const ring = el.querySelector('.spark-aoe-ring');
            if (ring) {
                ring.style.width = `${aoePx}px`;
                ring.style.height = `${aoePx}px`;
            }
            this.game.ui.els.gameContainer.appendChild(el);

            const spoke = baseAngle + (i / count) * Math.PI * 2;
            const jitter = (Math.random() - 0.5) * 0.55;
            const moveAngle = spoke + jitter;
            const spark = {
                el,
                bx: px,
                by: py,
                vx: Math.cos(moveAngle) * cfg.speed,
                vy: Math.sin(moveAngle) * cfg.speed,
                expires: simNow + cfg.duration,
                hitIds: new Set(),
                damage,
                wanderChance: cfg.wanderChance ?? 0.38,
                wanderTurn: cfg.wanderTurn ?? 2.2,
                hitRadiusVw: cfg.hitRadiusVw ?? 6.8,
                maxPierce: cfg.maxPierce ?? 2,
                animId: null
            };
            this._activeSparks.push(spark);
        }
    }

    _tickSparks(now) {
        const s = this.game.state;
        this._activeSparks = this._activeSparks.filter(spark => {
            if (now >= spark.expires || s.gamePaused || s.gameOver) {
                spark.el.remove();
                if (spark.animId) s.cancelAnimation(spark.animId);
                return false;
            }

            if (Math.random() < spark.wanderChance) {
                const turn = (Math.random() - 0.5) * spark.wanderTurn;
                const speed = Math.hypot(spark.vx, spark.vy) || 0.42;
                const angle = Math.atan2(spark.vy, spark.vx) + turn;
                spark.vx = Math.cos(angle) * speed;
                spark.vy = Math.sin(angle) * speed;
            }

            spark.bx += spark.vx;
            spark.by += spark.vy;
            spark.el.style.left = `${spark.bx}vw`;
            spark.el.style.top = `${spark.by}vh`;

            const innerWidth = window.innerWidth;
            const innerHeight = window.innerHeight;
            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0 || spark.hitIds.has(enemy.id)) continue;
                if (projectilePointHitsEnemy(spark.bx, spark.by, enemy, innerWidth, innerHeight, spark.hitRadiusVw ?? 3.2)) {
                    spark.hitIds.add(enemy.id);
                    this.game._dealSkillDamageToEnemy(enemy, spark.damage, 'lightning', false, 'spark');
                    if (hasExhaustedPierce(spark.hitIds.size, spark.maxPierce ?? 1)) {
                        spark.el.remove();
                        return false;
                    }
                }
            }

            return true;
        });
    }

    cleanup() {
        const s = this.game?.state;
        this._transientDom.clearAll();
        this._activeSparks.forEach(spark => {
            if (spark.animId && s) s.cancelAnimation(spark.animId);
            spark.el?.remove();
        });
        this._activeSparks = [];
        this._rfLastTick = 0;
        this._rfLastSfx = 0;
    }

    _findNearestEnemy(fromX, fromY, range) {
        const s = this.game.state;
        let nearest = null;
        let minDist = range;

        s.enemies.forEach(enemy => {
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            const dist = distanceVw(fromX, fromY, ex, ey, window.innerWidth, window.innerHeight);
            if (dist <= range && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        return nearest;
    }
}

function getSkillConfigFor(id, level) {
    switch (id) {
        case 'fireball': return getFireballConfig(level);
        case 'iceNova': return getIceNovaConfig(level);
        case 'lightningArc': return getLightningArcConfig(level);
        case 'poisonBottle': return getPoisonBottleConfig(level);
        case 'healingWave': return getHealingWaveConfig(level);
        case 'frostbolt': return getFrostboltConfig(level);
        case 'righteousFire': return getRighteousFireConfig(level);
        case 'spark': return getSparkConfig(level);
        case 'poisonDagger': return getPoisonDaggerConfig(level);
        case 'hammerSweep': return getHammerSweepConfig(level);
        case 'throwSpear': return getThrowSpearConfig(level);
        default: return { cooldown: Infinity };
    }
}
