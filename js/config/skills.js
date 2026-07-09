/** @typedef {'fireball' | 'iceNova' | 'lightningArc' | 'poisonBottle' | 'healingWave' | 'frostbolt' | 'righteousFire' | 'spark' | 'illusion' | 'poisonDagger' | 'hammerSweep' | 'throwSpear'} SkillId */

import {
    skillLevelDamageMult,
    skillLevelDamagePercent
} from './skillScaling.js';

/** Spark cooldown tuning — higher = longer cooldown between casts. */
export const SPARK_COOLDOWN_BASE_MS = 3600;
export const SPARK_COOLDOWN_FLOOR_MS = 2000;
export const SPARK_COOLDOWN_PER_LEVEL_MS = 240;

export const SKILL_IDS = /** @type {const} */ ([
    'fireball', 'iceNova', 'lightningArc', 'poisonBottle', 'healingWave',
    'frostbolt', 'righteousFire', 'spark', 'illusion',
    'poisonDagger', 'hammerSweep', 'throwSpear'
]);

/** @returns {Record<SkillId, { level: number, maxLevel: number }>} */
export function createDefaultSkillList() {
    return {
        fireball: { level: 0, maxLevel: 5 },
        iceNova: { level: 0, maxLevel: 5 },
        lightningArc: { level: 0, maxLevel: 5 },
        poisonBottle: { level: 0, maxLevel: 5 },
        healingWave: { level: 0, maxLevel: 5 },
        frostbolt: { level: 0, maxLevel: 5 },
        righteousFire: { level: 0, maxLevel: 5 },
        spark: { level: 0, maxLevel: 5 },
        illusion: { level: 0, maxLevel: 5 },
        poisonDagger: { level: 0, maxLevel: 5 },
        hammerSweep: { level: 0, maxLevel: 5 },
        throwSpear: { level: 0, maxLevel: 5 }
    };
}

/** @returns {Record<SkillId, number>} */
export function createInitialPlayerSkills() {
    return {
        fireball: 0, iceNova: 0, lightningArc: 0, poisonBottle: 0, healingWave: 0,
        frostbolt: 0, righteousFire: 0, spark: 0, illusion: 0,
        poisonDagger: 0, hammerSweep: 0, throwSpear: 0
    };
}

/** @returns {Record<SkillId, number>} */
export function createSkillCooldowns() {
    return {
        fireball: 0, iceNova: 0, lightningArc: 0, poisonBottle: 0, healingWave: 0,
        frostbolt: 0, righteousFire: 0, spark: 0, illusion: 0,
        poisonDagger: 0, hammerSweep: 0, throwSpear: 0
    };
}

/** PoE-style skill tags for passives, tooltips, and damage rules. */
export const SKILL_TAG_LABELS = {
    fire: 'Fire',
    cold: 'Cold',
    lightning: 'Lightning',
    chaos: 'Chaos',
    holy: 'Holy',
    arcane: 'Arcane',
    physical: 'Physical',
    elemental: 'Elemental',
    healing: 'Healing',
    area: 'Area',
    projectile: 'Projectile',
    chain: 'Chain',
    fork: 'Fork',
    aura: 'Aura',
    minion: 'Minion'
};

/** Skill metadata for UI and tooltips */
export const SKILL_DEFINITIONS = {
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        icon: '🔥',
        element: 'fire',
        tags: ['fire', 'elemental', 'projectile', 'area'],
        rangeType: 'cast',
        description: 'Hurls an explosive fireball. Direct hit + AoE splash + burn DoT.',
        formatText(level, nextLevel) {
            const cfg = getFireballConfig(nextLevel);
            return `Fireball Lv.${nextLevel}: ${Math.round(cfg.directDamageMult * 100)}% hit, ${Math.round(cfg.splashDamageMult * 100)}% splash, burn ${Math.round(cfg.burnTotalMult * 100)}%. Range ${cfg.castRange}px`;
        }
    },
    iceNova: {
        id: 'iceNova',
        name: 'Ice Nova',
        icon: '❄️',
        element: 'cold',
        tags: ['cold', 'elemental', 'area'],
        rangeType: 'area',
        description: 'Freezing wave around you. Damages all nearby enemies and slows them.',
        formatText(level, nextLevel) {
            const cfg = getIceNovaConfig(nextLevel);
            const freeze = cfg.freezeDuration > 0 ? `, freeze ${cfg.freezeDuration / 1000}s` : '';
            return `Ice Nova Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% AoE, slow ${cfg.slowPercent}%${freeze}. Radius ${cfg.radius}px`;
        }
    },
    lightningArc: {
        id: 'lightningArc',
        name: 'Lightning Arc',
        icon: '⚡',
        element: 'lightning',
        tags: ['lightning', 'elemental', 'chain'],
        rangeType: 'cast',
        description: 'Instant arc that chains through multiple enemies.',
        formatText(level, nextLevel) {
            const cfg = getLightningArcConfig(nextLevel);
            return `Lightning Arc Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% dmg, ${cfg.chainCount} chains. Range ${cfg.castRange}px`;
        }
    },
    poisonBottle: {
        id: 'poisonBottle',
        name: 'Chaos Bottle',
        icon: '🧪',
        element: 'chaos',
        tags: ['chaos', 'projectile', 'area'],
        rangeType: 'cast',
        description: 'Throws a chaos flask that shatters into a toxic ground pool.',
        formatText(level, nextLevel) {
            const cfg = getPoisonBottleConfig(nextLevel);
            return `Chaos Bottle Lv.${nextLevel}: ${Math.round(cfg.directDamageMult * 100)}% impact, pool ${cfg.poolDuration / 1000}s, ${Math.round(cfg.tickDamageMult * 100)}%/tick. Pool r${cfg.poolRadius}px`;
        }
    },
    healingWave: {
        id: 'healingWave',
        name: 'Healing Wave',
        icon: '💚',
        element: 'heal',
        tags: ['holy', 'healing'],
        rangeType: 'self',
        description: 'Restores a portion of your max HP. Auto-casts when injured.',
        formatText(level, nextLevel) {
            const cfg = getHealingWaveConfig(nextLevel);
            return `Healing Wave Lv.${nextLevel}: restore ${cfg.healPercent}% max HP. Cooldown ${(cfg.cooldown / 1000).toFixed(1)}s`;
        }
    },
    frostbolt: {
        id: 'frostbolt',
        name: 'Frostbolt',
        icon: '🧊',
        element: 'cold',
        tags: ['cold', 'elemental', 'projectile'],
        rangeType: 'cast',
        description: 'Slow frost shard — pierces every enemy in its path (once each). Long cooldown.',
        formatText(level, nextLevel) {
            const cfg = getFrostboltConfig(nextLevel);
            return `Frostbolt Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% cold, unlimited pierce, range ${cfg.castRange}px`;
        }
    },
    righteousFire: {
        id: 'righteousFire',
        name: 'Righteous Fire',
        icon: '🔥',
        element: 'fire',
        tags: ['fire', 'elemental', 'aura', 'area'],
        rangeType: 'aura',
        description: 'PoE-style burning aura — constant fire DoT around you while active.',
        formatText(level, nextLevel) {
            const cfg = getRighteousFireConfig(nextLevel);
            return `Righteous Fire Lv.${nextLevel}: ${Math.round(cfg.tickDamageMult * 100)}%/tick, radius ${cfg.radius}px`;
        }
    },
    spark: {
        id: 'spark',
        name: 'Spark',
        icon: '✨',
        element: 'lightning',
        tags: ['lightning', 'elemental', 'projectile'],
        rangeType: 'cast',
        description: 'PoE-style sparks from your center — spider out in random directions with a large hit bubble. Pierce 2.',
        formatText(level, nextLevel) {
            const cfg = getSparkConfig(nextLevel);
            return `Spark Lv.${nextLevel}: ${cfg.sparkCount} sparks, ${Math.round(cfg.damageMult * 100)}% dmg, pierce ${cfg.maxPierce}, AOE ${cfg.hitRadiusVw.toFixed(1)}vw`;
        }
    },
    illusion: {
        id: 'illusion',
        name: 'Illusion',
        icon: '◈',
        element: 'arcane',
        tags: ['arcane', 'minion'],
        rangeType: 'self',
        description: 'Summons an invulnerable clone beside you. Mirrors your basic attacks at reduced damage within your attack range (AOE).',
        formatText(level, nextLevel) {
            const cfg = getIllusionConfig(nextLevel);
            return `Illusion Lv.${nextLevel}: ${cfg.damagePercent}% clone damage, your AOE range, ${(cfg.duration / 1000).toFixed(1)}s duration, ${(cfg.cooldown / 1000).toFixed(1)}s cooldown`;
        }
    },
    poisonDagger: {
        id: 'poisonDagger',
        name: 'Poison Dagger',
        icon: '🗡️',
        element: 'chaos',
        tags: ['chaos', 'projectile', 'fork'],
        rangeType: 'cast',
        description: 'Throws a chaos dagger. On hit, forks into extra angled daggers that continue traveling.',
        formatText(level, nextLevel) {
            const cfg = getPoisonDaggerConfig(nextLevel);
            return `Poison Dagger Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% hit, fork ×${cfg.forkCount}, ${Math.round(cfg.forkDamageMult * 100)}% fork dmg. Range ${cfg.castRange}px`;
        }
    },
    hammerSweep: {
        id: 'hammerSweep',
        name: 'Hammer Sweep',
        icon: '🔨',
        element: 'physical',
        tags: ['physical', 'area'],
        rangeType: 'area',
        description: 'Sweeping hammer smash — deals physical damage to all enemies around you.',
        formatText(level, nextLevel) {
            const cfg = getHammerSweepConfig(nextLevel);
            return `Hammer Sweep Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% physical AoE. Radius ${cfg.radius}px`;
        }
    },
    throwSpear: {
        id: 'throwSpear',
        name: 'Throw Spear',
        icon: '🔱',
        element: 'physical',
        tags: ['physical', 'projectile'],
        rangeType: 'cast',
        description: 'Hurls a spear in a straight line. Pierces up to 6 enemies beyond the first (7 unique hits max).',
        formatText(level, nextLevel) {
            const cfg = getThrowSpearConfig(nextLevel);
            return `Throw Spear Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% physical, pierce ${cfg.maxPierce}, range ${cfg.castRange}px`;
        }
    }
};

export function getFireballConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, directDamageMult: 0, splashRadius: 0, splashDamageMult: 0, burnTotalMult: 0, burnDuration: 0, projectileSpeed: 0, maxPierce: 0 };
    }
    return {
        cooldown: Math.max(1200, 2500 - level * 200),
        castRange: 160 + level * 35,
        directDamageMult: skillLevelDamageMult(level, 0.75, 0.1),
        splashRadius: 85 + level * 15,
        splashDamageMult: skillLevelDamageMult(level, 0.32, 0.06),
        burnTotalMult: skillLevelDamageMult(level, 0.12, 0.05),
        burnDuration: 3500,
        projectileSpeed: 0.95 + level * 0.06,
        /** No pierce — first hit explodes */
        maxPierce: 0
    };
}

export function getIceNovaConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, radius: 0, damageMult: 0, slowPercent: 0, slowDuration: 0, freezeDuration: 0 };
    }
    return {
        cooldown: Math.max(2000, 4000 - level * 300),
        radius: 70 + level * 22,
        damageMult: skillLevelDamageMult(level, 0.48, 0.11),
        slowPercent: 18 + level * 6,
        slowDuration: 2200 + level * 200,
        freezeDuration: level >= 3 ? (level - 2) * 550 : 0
    };
}

export function getLightningArcConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, chainCount: 0, damageMult: 0, chainRange: 0 };
    }
    return {
        cooldown: Math.max(900, 1800 - level * 150),
        castRange: 200 + level * 30,
        chainCount: level,
        damageMult: skillLevelDamageMult(level, 0.5, 0.09),
        chainRange: 190 + level * 28
    };
}

export function getPoisonBottleConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, directDamageMult: 0, poolRadius: 0, poolDuration: 0, tickInterval: 0, tickDamageMult: 0, projectileSpeed: 0 };
    }
    return {
        cooldown: Math.max(2200, 3800 - level * 280),
        castRange: 180 + level * 32,
        directDamageMult: skillLevelDamageMult(level, 0.35, 0.08),
        poolRadius: 55 + level * 14,
        poolDuration: 4500 + level * 600,
        tickInterval: Math.max(280, 450 - level * 30),
        tickDamageMult: skillLevelDamageMult(level, 0.07, 0.035),
        projectileSpeed: 0.75 + level * 0.05
    };
}

export function getHealingWaveConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, healPercent: 0 };
    }
    return {
        cooldown: Math.max(2800, 5500 - level * 380),
        healPercent: 7 + level * 3.5
    };
}

export function getFrostboltConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, damageMult: 0, projectileSpeed: 0, maxTravel: 0, maxPierce: 0 };
    }
    return {
        cooldown: Math.max(2800, 4800 - level * 320),
        castRange: 200 + level * 35,
        damageMult: skillLevelDamageMult(level, 0.55, 0.1),
        projectileSpeed: 0.55 + level * 0.05,
        maxTravel: 55 + level * 8,
        /** Unlimited pierce — travel distance ends the bolt */
        maxPierce: Infinity,
        pierceAll: true
    };
}

export function getRighteousFireConfig(level) {
    if (level <= 0) {
        return { radius: 0, tickDamageMult: 0, tickInterval: 0 };
    }
    const baseRadius = 55 + level * 18;
    return {
        radius: Math.round(baseRadius * 1.5),
        /** Lv.1 ≈ 9.6% tick, steep ramp per level (see skillScaling.js) */
        tickDamageMult: skillLevelDamageMult(level, 0.095, 0.025),
        tickInterval: Math.max(400, 650 - level * 40)
    };
}

export function getSparkConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, sparkCount: 0, damageMult: 0, duration: 0, speed: 0, hitRadiusVw: 0, maxPierce: 0 };
    }
    return {
        cooldown: Math.max(SPARK_COOLDOWN_FLOOR_MS, SPARK_COOLDOWN_BASE_MS - level * SPARK_COOLDOWN_PER_LEVEL_MS),
        /** PoE-style swarm from center */
        sparkCount: 4 + level,
        damageMult: skillLevelDamageMult(level, 0.28, 0.06),
        duration: 2800 + level * 400,
        /** Slowish spider crawl */
        speed: 0.42 + level * 0.045,
        wanderChance: 0.38,
        wanderTurn: 2.2,
        /** Large hit bubble (vw) — PoE Spark AOE feel */
        hitRadiusVw: 6.8 + level * 0.55,
        /** Pierce 2: dies after 3 unique enemy hits */
        maxPierce: 2
    };
}

export function getIllusionConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, duration: 0, damagePercent: 0, offsetVw: 0 };
    }
    return {
        /** Faster resummon — ~9.8s at Lv.1 down to 5s floor at Lv.5 */
        cooldown: Math.max(5000, 11000 - level * 1200),
        duration: 4500 + level * 900,
        /** 24% at Lv.1 → 99% at Lv.5 (see skillScaling.js) */
        damagePercent: skillLevelDamagePercent(level, 30, 7.5),
        offsetVw: 4.5
    };
}

export function getPoisonDaggerConfig(level) {
    if (level <= 0) {
        return {
            cooldown: Infinity, castRange: 0, damageMult: 0, forkCount: 0,
            forkDamageMult: 0, projectileSpeed: 0, forkTravel: 0, hitRadiusVw: 0
        };
    }
    return {
        cooldown: Math.max(1400, 2800 - level * 220),
        castRange: 190 + level * 30,
        damageMult: skillLevelDamageMult(level, 0.5, 0.09),
        /** Primary dagger forks into this many secondary blades on first hit */
        forkCount: 1 + level,
        forkDamageMult: skillLevelDamageMult(level, 0.32, 0.06),
        forkSpreadRad: 0.55,
        projectileSpeed: 0.85 + level * 0.05,
        maxTravel: 48 + level * 6,
        forkTravel: 28 + level * 4,
        hitRadiusVw: 2.4 + level * 0.15
    };
}

export function getHammerSweepConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, radius: 0, damageMult: 0 };
    }
    return {
        cooldown: Math.max(1800, 3600 - level * 280),
        radius: 75 + level * 20,
        /** Lv.1 ≈ 76.8% damage, steep ramp per level (see skillScaling.js) */
        damageMult: skillLevelDamageMult(level, 0.84, 0.12)
    };
}

export function getThrowSpearConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, damageMult: 0, projectileSpeed: 0, maxTravel: 0, hitRadiusVw: 0, maxPierce: 0 };
    }
    return {
        cooldown: Math.max(1600, 3200 - level * 250),
        castRange: 220 + level * 35,
        damageMult: skillLevelDamageMult(level, 0.62, 0.1),
        projectileSpeed: 0.72 + level * 0.05,
        maxTravel: 58 + level * 8,
        hitRadiusVw: 2.6 + level * 0.2,
        /** Pierce 6: disappears after hitting a 7th unique enemy */
        maxPierce: 6
    };
}

/** @param {SkillId} id @param {number} level */
export function getSkillConfig(id, level) {
    switch (id) {
        case 'fireball': return getFireballConfig(level);
        case 'iceNova': return getIceNovaConfig(level);
        case 'lightningArc': return getLightningArcConfig(level);
        case 'poisonBottle': return getPoisonBottleConfig(level);
        case 'healingWave': return getHealingWaveConfig(level);
        case 'frostbolt': return getFrostboltConfig(level);
        case 'righteousFire': return getRighteousFireConfig(level);
        case 'spark': return getSparkConfig(level);
        case 'illusion': return getIllusionConfig(level);
        case 'poisonDagger': return getPoisonDaggerConfig(level);
        case 'hammerSweep': return getHammerSweepConfig(level);
        case 'throwSpear': return getThrowSpearConfig(level);
        default: return {};
    }
}

/** Pixel radius for HUD range rings */
export function getSkillDisplayRadius(id, level, playerAttackRange = 0) {
    const cfg = getSkillConfig(id, level);
    if (id === 'illusion') return Math.max(0, Number(playerAttackRange) || 0);
    if (id === 'iceNova' || id === 'hammerSweep') return cfg.radius;
    if (id === 'righteousFire') return cfg.radius;
    if (id === 'healingWave') return 0;
    if (id === 'spark') {
        return (cfg.hitRadiusVw || 0) * (typeof window !== 'undefined' ? window.innerWidth : 1000) / 100;
    }
    if (
        id === 'fireball' || id === 'lightningArc' || id === 'poisonBottle'
        || id === 'frostbolt' || id === 'poisonDagger' || id === 'throwSpear'
    ) {
        return cfg.castRange;
    }
    return 0;
}

export function findEnemiesInRadius(enemies, cx, cy, radiusPx, innerWidth, innerHeight, excludeId = null) {
    return enemies.filter(e => {
        if (excludeId && e.id === excludeId) return false;
        if (e.hp <= 0) return false;
        const dx = Math.abs(e.x - cx) * innerWidth / 100;
        const dy = Math.abs(e.y - cy) * innerHeight / 100;
        return Math.hypot(dx, dy) <= radiusPx;
    });
}

export function findChainTargets(enemies, originX, originY, excludeId, maxCount, rangePx, innerWidth, innerHeight) {
    return enemies
        .filter(e => e.id !== excludeId && e.hp > 0)
        .map(e => {
            const dx = Math.abs(e.x - originX) * innerWidth / 100;
            const dy = Math.abs(e.y - originY) * innerHeight / 100;
            return { ...e, dist: Math.hypot(dx, dy) };
        })
        .filter(e => e.dist <= rangePx)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, maxCount);
}

export function syncPlayerSkillLevels(skills, skillList) {
    SKILL_IDS.forEach(id => {
        skills[id] = skillList[id]?.level || 0;
    });
}

/** @param {SkillId} id @param {number} level */
export function computeSkillDamage(baseDamage, id, level) {
    const cfg = getSkillConfig(id, level);
    if (id === 'fireball') return Math.floor(baseDamage * cfg.directDamageMult);
    if (id === 'iceNova') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'lightningArc') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'poisonBottle') return Math.floor(baseDamage * cfg.directDamageMult);
    if (id === 'frostbolt') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'spark') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'righteousFire') return Math.max(1, Math.floor(baseDamage * cfg.tickDamageMult));
    if (id === 'poisonDagger') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'hammerSweep') return Math.floor(baseDamage * cfg.damageMult);
    if (id === 'throwSpear') return Math.floor(baseDamage * cfg.damageMult);
    return 0;
}

/** Fork projectile damage for Poison Dagger secondary blades. */
export function computePoisonDaggerForkDamage(baseDamage, level) {
    const cfg = getPoisonDaggerConfig(level);
    return Math.max(1, Math.floor(baseDamage * cfg.forkDamageMult));
}

export function computeSplashDamage(baseDamage, level) {
    return Math.floor(baseDamage * getFireballConfig(level).splashDamageMult);
}

export function computeBurnTotal(baseDamage, level) {
    return Math.floor(baseDamage * getFireballConfig(level).burnTotalMult);
}

export function computePoisonTickDamage(baseDamage, level) {
    return Math.max(1, Math.floor(baseDamage * getPoisonBottleConfig(level).tickDamageMult));
}

/** Total ticks in a poison/chaos pool lifetime */
export function computePoisonPoolTicks(level) {
    const cfg = getPoisonBottleConfig(level);
    return Math.floor(cfg.poolDuration / cfg.tickInterval);
}

/** @param {SkillId} skillId */
export function getSkillTags(skillId) {
    return SKILL_DEFINITIONS[skillId]?.tags || [];
}

/** @param {SkillId} skillId @param {string} tag */
export function skillHasTag(skillId, tag) {
    return getSkillTags(skillId).includes(tag);
}

/** @param {string[]} tags */
export function formatSkillTagsHtml(tags = []) {
    if (!tags.length) return '';
    return tags.map(tag => {
        const label = SKILL_TAG_LABELS[tag] || tag;
        return `<span class="skill-tag skill-tag-${tag}">${label}</span>`;
    }).join('');
}

/** Rich HTML for skill bar hover tooltip. */
export function formatSkillTooltipHtml(def, level = 0) {
    if (!def) return '';
    const tagsHtml = formatSkillTagsHtml(def.tags || []);
    const statsLine = level > 0 && def.formatText
        ? def.formatText(level, level)
        : '';
    return `
        <strong class="skill-tip-name">${def.name}</strong>
        ${tagsHtml ? `<div class="skill-tip-tags">${tagsHtml}</div>` : ''}
        <p class="skill-tip-desc">${def.description}</p>
        ${statsLine ? `<p class="skill-tip-stats">${statsLine}</p>` : ''}
        ${level <= 0 ? '<p class="skill-tip-locked">Not learned — level up to unlock</p>' : ''}
    `;
}
