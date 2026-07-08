/** @typedef {'fireball' | 'iceNova' | 'lightningArc' | 'poisonBottle' | 'healingWave' | 'frostbolt' | 'righteousFire' | 'spark' | 'illusion'} SkillId */

export const SKILL_IDS = /** @type {const} */ ([
    'fireball', 'iceNova', 'lightningArc', 'poisonBottle', 'healingWave',
    'frostbolt', 'righteousFire', 'spark', 'illusion'
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
        illusion: { level: 0, maxLevel: 5 }
    };
}

/** @returns {Record<SkillId, number>} */
export function createInitialPlayerSkills() {
    return {
        fireball: 0, iceNova: 0, lightningArc: 0, poisonBottle: 0, healingWave: 0,
        frostbolt: 0, righteousFire: 0, spark: 0, illusion: 0
    };
}

/** @returns {Record<SkillId, number>} */
export function createSkillCooldowns() {
    return {
        fireball: 0, iceNova: 0, lightningArc: 0, poisonBottle: 0, healingWave: 0,
        frostbolt: 0, righteousFire: 0, spark: 0, illusion: 0
    };
}

/** Skill metadata for UI and tooltips */
export const SKILL_DEFINITIONS = {
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        icon: '🔥',
        element: 'fire',
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
        rangeType: 'cast',
        description: 'Instant arc that chains through multiple enemies.',
        formatText(level, nextLevel) {
            const cfg = getLightningArcConfig(nextLevel);
            return `Lightning Arc Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% dmg, ${cfg.chainCount} chains. Range ${cfg.castRange}px`;
        }
    },
    poisonBottle: {
        id: 'poisonBottle',
        name: 'Poison Bottle',
        icon: '🧪',
        element: 'poison',
        rangeType: 'cast',
        description: 'Throws a toxic bottle that shatters into a poison pool on the ground.',
        formatText(level, nextLevel) {
            const cfg = getPoisonBottleConfig(nextLevel);
            return `Poison Bottle Lv.${nextLevel}: ${Math.round(cfg.directDamageMult * 100)}% impact, pool ${cfg.poolDuration / 1000}s, ${Math.round(cfg.tickDamageMult * 100)}%/tick. Pool r${cfg.poolRadius}px`;
        }
    },
    healingWave: {
        id: 'healingWave',
        name: 'Healing Wave',
        icon: '💚',
        element: 'holy',
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
        rangeType: 'cast',
        description: 'Slow frost shard — pierces every enemy in its path (once each). Long cooldown.',
        formatText(level, nextLevel) {
            const cfg = getFrostboltConfig(nextLevel);
            return `Frostbolt Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% cold, range ${cfg.castRange}px`;
        }
    },
    righteousFire: {
        id: 'righteousFire',
        name: 'Righteous Fire',
        icon: '🔥',
        element: 'fire',
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
        rangeType: 'cast',
        description: 'Slow magenta arc sparks — wander with random turns and zap on contact.',
        formatText(level, nextLevel) {
            const cfg = getSparkConfig(nextLevel);
            return `Spark Lv.${nextLevel}: ${cfg.sparkCount} sparks, ${Math.round(cfg.damageMult * 100)}% dmg, ${cfg.duration / 1000}s`;
        }
    },
    illusion: {
        id: 'illusion',
        name: 'Illusion',
        icon: '◈',
        element: 'arcane',
        rangeType: 'self',
        description: 'Summons an invulnerable clone beside you. Mirrors your basic attacks at reduced damage with your passives.',
        formatText(level, nextLevel) {
            const cfg = getIllusionConfig(nextLevel);
            return `Illusion Lv.${nextLevel}: ${cfg.damagePercent}% clone damage, ${(cfg.duration / 1000).toFixed(1)}s duration, ${(cfg.cooldown / 1000).toFixed(1)}s cooldown`;
        }
    }
};

export function getFireballConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, castRange: 0, directDamageMult: 0, splashRadius: 0, splashDamageMult: 0, burnTotalMult: 0, burnDuration: 0, projectileSpeed: 0 };
    }
    return {
        cooldown: Math.max(1200, 2500 - level * 200),
        castRange: 160 + level * 35,
        directDamageMult: 0.75 + level * 0.1,
        splashRadius: 85 + level * 15,
        splashDamageMult: 0.32 + level * 0.06,
        burnTotalMult: 0.12 + level * 0.05,
        burnDuration: 3500,
        projectileSpeed: 0.95 + level * 0.06
    };
}

export function getIceNovaConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, radius: 0, damageMult: 0, slowPercent: 0, slowDuration: 0, freezeDuration: 0 };
    }
    return {
        cooldown: Math.max(2000, 4000 - level * 300),
        radius: 70 + level * 22,
        damageMult: 0.48 + level * 0.11,
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
        damageMult: 0.5 + level * 0.09,
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
        directDamageMult: 0.35 + level * 0.08,
        poolRadius: 55 + level * 14,
        poolDuration: 4500 + level * 600,
        tickInterval: Math.max(280, 450 - level * 30),
        tickDamageMult: 0.07 + level * 0.035,
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
        return { cooldown: Infinity, castRange: 0, damageMult: 0, projectileSpeed: 0, maxTravel: 0 };
    }
    return {
        cooldown: Math.max(2800, 4800 - level * 320),
        castRange: 200 + level * 35,
        damageMult: 0.55 + level * 0.1,
        projectileSpeed: 0.32 + level * 0.04,
        maxTravel: 420 + level * 55,
        pierceAll: true
    };
}

export function getRighteousFireConfig(level) {
    if (level <= 0) {
        return { radius: 0, tickDamageMult: 0, tickInterval: 0 };
    }
    return {
        radius: 55 + level * 18,
        tickDamageMult: 0.06 + level * 0.025,
        tickInterval: Math.max(400, 650 - level * 40)
    };
}

export function getSparkConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, sparkCount: 0, damageMult: 0, duration: 0, speed: 0 };
    }
    return {
        cooldown: Math.max(1600, 3000 - level * 240),
        sparkCount: 2 + level,
        damageMult: 0.28 + level * 0.06,
        duration: 2400 + level * 380,
        speed: 0.55 + level * 0.06,
        wanderChance: 0.28,
        wanderTurn: 1.8
    };
}

export function getIllusionConfig(level) {
    if (level <= 0) {
        return { cooldown: Infinity, duration: 0, damagePercent: 0, offsetVw: 0 };
    }
    return {
        cooldown: Math.max(8000, 16000 - level * 1400),
        duration: 4500 + level * 900,
        /** 30% at Lv.1 → 60% at Lv.5 */
        damagePercent: 30 + (level - 1) * 7.5,
        offsetVw: 4.5
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
        default: return {};
    }
}

/** Pixel radius for HUD range rings */
export function getSkillDisplayRadius(id, level) {
    const cfg = getSkillConfig(id, level);
    if (id === 'iceNova') return cfg.radius;
    if (id === 'righteousFire') return cfg.radius;
    if (id === 'healingWave') return 0;
    if (id === 'illusion') return 0;
    if (id === 'fireball' || id === 'lightningArc' || id === 'poisonBottle' || id === 'frostbolt') return cfg.castRange;
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
    return 0;
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

/** Total ticks in a poison pool lifetime */
export function computePoisonPoolTicks(level) {
    const cfg = getPoisonBottleConfig(level);
    return Math.floor(cfg.poolDuration / cfg.tickInterval);
}
