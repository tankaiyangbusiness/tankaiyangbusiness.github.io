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
    findEnemiesInRadius,
    findChainTargets,
    computeSkillDamage,
    computeSplashDamage,
    computeBurnTotal
} from '../config/skills.js';
import { distanceVw } from '../utils/math.js';
import { flashPlayerSprite } from '../ui/playerVisuals.js';
import {
    projectilePointHitsEnemy,
    projectileSegmentHitsEnemy
} from '../utils/projectileCollision.js';

export class SkillExecutor {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
        this.game = game;
        this._rfLastTick = 0;
        this._activeSparks = [];
    }

    /** @param {number} now */
    tick(now) {
        const s = this.game.state;
        if (s.gamePaused || s.gameOver) return;

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
                this.castIceNova(px, py, level);
            } else if (skillId === 'healingWave') {
                if (s.stats.hp < s.stats.maxHp * 0.92) {
                    s.skillCooldowns[skillId] = now;
                    this.castHealingWave(px, py, level);
                }
            } else if (skillId === 'spark') {
                s.skillCooldowns[skillId] = now;
                this.castSpark(px, py, level);
            } else if (hasTarget) {
                s.skillCooldowns[skillId] = now;
                if (skillId === 'fireball') this.castFireball(px, py, level);
                else if (skillId === 'lightningArc') this.castLightningArc(px, py, level);
                else if (skillId === 'poisonBottle') this.castPoisonBottle(px, py, level);
                else if (skillId === 'frostbolt') this.castFrostbolt(px, py, level);
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
        let bx = px, by = py;
        let animId = null;

        const animate = () => {
            if (s.gamePaused || s.gameOver) { el.remove(); return; }

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
                if (animId) s.cancelAnimation(animId);
                el.remove();
                this._fireballExplode(bx, by, level, hit);
                return;
            }

            animId = requestAnimationFrame(animate);
            s.trackAnimation(animId);
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
            this.game._dealSkillDamageToEnemy(directHit, directDmg, 'fire', false);
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
            this.game._dealSkillDamageToEnemy(t.ref, splashDmg, 'fire', false);
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

            this.game._dealSkillDamageToEnemy(enemy, damage, 'cold', false);
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
            if (t.ref) this.game._dealSkillDamageToEnemy(t.ref, damage, 'lightning', false);
        });

        if (chain.length) this.game.effects.spawnMegaExplosion(chain[0].x, chain[0].y, 'lightning');
    }

    castPoisonBottle(px, py, level) {
        const s = this.game.state;
        const cfg = getPoisonBottleConfig(level);
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('poisonBottle');
        this.game.effects.spawnCastFlash(px, py, 'poison');

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-poison-bottle';
        el.innerHTML = '<div class="poison-bottle-icon"></div>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2(ty - py, tx - px);
        let bx = px, by = py;
        let animId = null;

        const animate = () => {
            if (s.gamePaused || s.gameOver) { el.remove(); return; }

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
                if (animId) s.cancelAnimation(animId);
                el.remove();
                this._poisonShatter(bx, by, level, hit);
                return;
            }

            animId = requestAnimationFrame(animate);
            s.trackAnimation(animId);
        };

        animate();
    }

    _poisonShatter(bx, by, level, directHit) {
        const s = this.game.state;
        const cfg = getPoisonBottleConfig(level);
        const impactDmg = computeSkillDamage(s.stats.physicalDamage, 'poisonBottle', level);

        this.game.effects.spawnMegaExplosion(bx, by, 'poison');
        if (directHit?.stats.hp > 0) {
            this.game._dealSkillDamageToEnemy(directHit, impactDmg, 'poison', false);
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
        const nearest = this._findNearestEnemy(px, py, cfg.castRange);
        if (!nearest) return;

        this.game.skillRanges?.flash('frostbolt');
        this.game.effects.spawnCastFlash(px, py, 'cold');

        const el = document.createElement('div');
        el.className = 'skill-projectile skill-frostbolt particle-25d';
        el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        this.game.ui.els.gameContainer.appendChild(el);

        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        const angle = Math.atan2(ty - py, tx - px);
        let bx = px;
        let by = py;
        let prevBx = px;
        let prevBy = py;
        let traveled = 0;
        const hitIds = new Set();
        let animId = null;
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;
        const damage = computeSkillDamage(s.stats.physicalDamage, 'frostbolt', level);
        const pierceRadius = 1.8 + level * 0.15;

        const animate = () => {
            if (s.gamePaused || s.gameOver) { el.remove(); return; }

            prevBx = bx;
            prevBy = by;
            bx += Math.cos(angle) * cfg.projectileSpeed;
            by += Math.sin(angle) * cfg.projectileSpeed;
            traveled += cfg.projectileSpeed;
            el.style.left = `${bx}vw`;
            el.style.top = `${by}vh`;

            for (const enemy of s.enemies) {
                if (enemy.stats.hp <= 0 || hitIds.has(enemy.id)) continue;
                const hit = projectileSegmentHitsEnemy(
                    prevBx, prevBy, bx, by, enemy, innerWidth, innerHeight, pierceRadius
                ) || projectilePointHitsEnemy(bx, by, enemy, innerWidth, innerHeight, pierceRadius);
                if (hit) {
                    hitIds.add(enemy.id);
                    this.game._dealSkillDamageToEnemy(enemy, damage, 'cold', false);
                    this.game._applySlow(enemy, 12 + level * 3, 1500);
                }
            }

            if (traveled >= cfg.maxTravel) {
                if (animId) s.cancelAnimation(animId);
                el.remove();
                return;
            }

            animId = requestAnimationFrame(animate);
            s.trackAnimation(animId);
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
                this.game._dealSkillDamageToEnemy(enemy, damage, 'fire', false);
                this.game._applyBurn(enemy, Math.floor(damage * 0.4), 2000);
            }
        });
    }

    castSpark(px, py, level) {
        const s = this.game.state;
        const cfg = getSparkConfig(level);
        const damage = computeSkillDamage(s.stats.physicalDamage, 'spark', level);

        this.game.skillRanges?.flash('spark');
        this.game.effects.spawnCastFlash(px, py, 'spark');

        for (let i = 0; i < cfg.sparkCount; i++) {
            const el = document.createElement('div');
            el.className = 'skill-spark skill-spark-arc particle-25d';
            el.innerHTML = '<span class="particle-25d-face"></span>';
            el.style.left = `${px}vw`;
            el.style.top = `${py}vh`;
            this.game.ui.els.gameContainer.appendChild(el);

            const moveAngle = Math.random() * Math.PI * 2;
            const spark = {
                el,
                bx: px,
                by: py,
                vx: Math.cos(moveAngle) * cfg.speed,
                vy: Math.sin(moveAngle) * cfg.speed,
                expires: Date.now() + cfg.duration,
                hitIds: new Set(),
                damage,
                wanderChance: cfg.wanderChance ?? 0.28,
                wanderTurn: cfg.wanderTurn ?? 1.8,
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
                if (projectilePointHitsEnemy(spark.bx, spark.by, enemy, innerWidth, innerHeight, 1.4)) {
                    spark.hitIds.add(enemy.id);
                    this.game._dealSkillDamageToEnemy(enemy, spark.damage, 'spark', false);
                }
            }

            return true;
        });
    }

    cleanup() {
        this._activeSparks.forEach(spark => spark.el.remove());
        this._activeSparks = [];
        this._rfLastTick = 0;
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
        default: return { cooldown: Infinity };
    }
}
