import {
    applyBalanceScale,
    applyEnemyMovePressure,
    applyEarlyWaveHpReduction,
    applyEarlyWaveExpBonus,
    applyWaveStatBoost,
    applyEnemyStartingCombatBoost
} from './balance.js';
import { finalizeEnemyExpStat } from './expProgression.js';

/** @type {import('../types.js').EnemyStats} */
export const BASE_ENEMY_STATS = {
    hp: 16,
    maxHp: 16,
    physicalDamage: 7,
    attackSpeed: 1.4,
    attackRange: 50,
    armour: 0,
    hpRegen: 0.5,
    moveSpeed: 0.3,
    exp: 3
};

/** Enemy archetypes with unique behaviors */
export const ENEMY_TYPES = {
    grunt: {
        type: 'grunt',
        cssClass: 'enemy enemy-grunt',
        size: 40,
        hpMult: 1,
        damageMult: 1,
        expMult: 1,
        moveSpeedMult: 1,
        behavior: 'chase',
        label: 'Grunt'
    },
    swarm: {
        type: 'swarm',
        cssClass: 'enemy enemy-swarm',
        size: 28,
        hpMult: 0.45,
        damageMult: 0.6,
        expMult: 0.28,
        moveSpeedMult: 1.8,
        behavior: 'chase',
        label: 'Swarm'
    },
    tank: {
        type: 'tank',
        cssClass: 'enemy enemy-tank',
        size: 58,
        hpMult: 3.5,
        damageMult: 1.2,
        expMult: 2,
        moveSpeedMult: 0.45,
        behavior: 'chase',
        label: 'Tank',
        armourBonus: 8
    },
    archer: {
        type: 'archer',
        cssClass: 'enemy enemy-archer',
        size: 42,
        hpMult: 0.8,
        damageMult: 0.9,
        expMult: 1.5,
        moveSpeedMult: 0.7,
        behavior: 'ranged',
        label: 'Archer',
        rangedRange: 260
    },
    dasher: {
        type: 'dasher',
        cssClass: 'enemy enemy-dasher',
        size: 44,
        hpMult: 1.1,
        damageMult: 1.3,
        expMult: 1.8,
        moveSpeedMult: 1,
        behavior: 'dash',
        label: 'Dasher',
        dashCooldown: 3000,
        dashSpeed: 2.5
    },
    splitter: {
        type: 'splitter',
        cssClass: 'enemy enemy-splitter',
        size: 48,
        hpMult: 1.5,
        damageMult: 0.8,
        expMult: 2,
        moveSpeedMult: 0.85,
        behavior: 'chase',
        label: 'Splitter',
        splitCount: 3
    },
    bomber: {
        type: 'bomber',
        cssClass: 'enemy enemy-bomber',
        size: 46,
        hpMult: 0.9,
        damageMult: 0.7,
        expMult: 1.6,
        moveSpeedMult: 1.1,
        behavior: 'chase',
        label: 'Bomber',
        explosionRadius: 150,
        explosionDamage: 28
    },
    penetrator: {
        type: 'penetrator',
        cssClass: 'enemy enemy-penetrator',
        size: 44,
        hpMult: 1.05,
        damageMult: 1.15,
        expMult: 1.4,
        moveSpeedMult: 0.95,
        behavior: 'chase',
        label: 'Penetrator',
        ignoreArmour: true
    },
    wraith: {
        type: 'wraith',
        cssClass: 'enemy enemy-wraith',
        size: 40,
        hpMult: 0.9,
        damageMult: 0.85,
        expMult: 1.5,
        moveSpeedMult: 1.25,
        behavior: 'chase',
        label: 'Wraith',
        evadeScaling: true
    },
    /** Spawned only when a splitter dies — not in pickEnemyType pool. */
    splitFragment: {
        type: 'splitFragment',
        cssClass: 'enemy enemy-split-fragment',
        size: 22,
        hpMult: 0.28,
        damageMult: 0.5,
        expMult: 0.3,
        moveSpeedMult: 2.4,
        behavior: 'chase',
        label: 'Fragment',
        spawnable: false
    }
};

/** Rarity tiers applied on top of enemy type */
export const RARITY_CONFIG = {
    normal: { key: 'normal', cssSuffix: '', hpMult: 1, damageMult: 1, expMult: 1, spawnWeight: 50 },
    rare: { key: 'rare', cssSuffix: ' rare-enemy', hpMult: 2, damageMult: 1.2, expMult: 2.5, spawnWeight: 15 },
    elite: { key: 'elite', cssSuffix: ' elite', hpMult: 5, damageMult: 1.35, expMult: 5, spawnWeight: 3 },
    boss: { key: 'boss', cssSuffix: ' boss', hpMult: 10, damageMult: 1.5, expMult: 12, spawnWeight: 1 }
};

/** Wraith evade — min 5%, scales with wave up to 50% at wave 100+. */
export function computeEnemyEvadeChance(difficulty) {
    const wave = Math.max(0, difficulty);
    const pct = 5 + wave * 0.45;
    return Math.min(50, Math.max(5, pct));
}

/** @param {string} enemyType @param {string} rarity @param {number} difficulty */
export function buildEnemyStats(enemyType, rarity, difficulty) {
    const typeConfig = ENEMY_TYPES[enemyType] || ENEMY_TYPES.grunt;
    const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.normal;
    const base = { ...BASE_ENEMY_STATS };

    const hp = scaleEnemyHp(base.hp, difficulty) * typeConfig.hpMult * rarityConfig.hpMult;
    const damage = scaleEnemyDamage(base.physicalDamage, difficulty) * typeConfig.damageMult * rarityConfig.damageMult;
    const exp = scaleEnemyExp(base.exp, difficulty) * typeConfig.expMult * rarityConfig.expMult;

    const stats = {
        ...base,
        hp: applyEarlyWaveHpReduction(applyBalanceScale(Math.floor(hp), 'hp'), difficulty),
        maxHp: applyEarlyWaveHpReduction(applyBalanceScale(Math.floor(hp), 'hp'), difficulty),
        physicalDamage: applyBalanceScale(Math.floor(damage), 'damage'),
        exp: finalizeEnemyExpStat(
            applyEarlyWaveExpBonus(applyBalanceScale(Math.floor(exp), 'exp'), difficulty),
            typeConfig.type,
            difficulty
        ),
        moveSpeed: applyEnemyMovePressure(base.moveSpeed * typeConfig.moveSpeedMult, difficulty),
        armour: (typeConfig.armourBonus || 0) + (rarity === 'elite' ? 4 : rarity === 'boss' ? 8 : 0),
        ignoreArmour: Boolean(typeConfig.ignoreArmour),
        evadeChance: typeConfig.evadeScaling ? computeEnemyEvadeChance(difficulty) : 0
    };
    stats.maxHp = stats.hp;

    if (typeConfig.behavior === 'ranged') {
        stats.attackRange = typeConfig.rangedRange || 180;
    }

    // From start: +20% damage/AS, +10% armour (not HP / moveSpeed)
    applyEnemyStartingCombatBoost(stats);

    // Waves 12, 24, 36…: +15% damage / armour / attack speed
    applyWaveStatBoost(stats, difficulty + 1);

    return { stats, typeConfig, rarityConfig };
}

function scaleEnemyHp(base, difficulty) {
    const d = Math.min(difficulty, 80);
    return base + base * (1 + 0.1 * d) * Math.log(1 + d + d * Math.pow(1.4, d * 0.75));
}

/** @param {number} base @param {number} difficulty */
export function scaleEnemyHpForDifficulty(base, difficulty) {
    return scaleEnemyHp(base, difficulty);
}

/** Linear late-game damage ramp — avoids exponential blow-up. Exported for tests. */
export function scaleEnemyDamage(base, difficulty) {
    const d = Math.min(difficulty, 300);
    return base * (1 + d * 0.035);
}

/** Linear late-game EXP ramp — avoids logarithmic blow-up on high waves. */
export function scaleEnemyExp(base, difficulty) {
    const d = Math.min(difficulty, 200);
    const early = base * (1 + d * 0.10);
    if (d <= 50) return early;
    const midCap = base * (1 + 50 * 0.10);
    const lateExtra = base * (d - 50) * 0.035;
    return midCap + lateExtra;
}

/**
 * Difficulty gate before swarms enter the type pool.
 * Keeps the first ~2 minutes (diff 0–5) mostly grunts so new players can clear.
 */
export const SWARM_UNLOCK_DIFFICULTY = 6;

/** Pick a random enemy type based on difficulty */
export function pickEnemyType(difficulty) {
    const pool = ['grunt', 'grunt', 'grunt', 'grunt'];
    // Swarms unlock after the skill-less early window — light weight first, heavier later
    if (difficulty >= SWARM_UNLOCK_DIFFICULTY && difficulty < 10) {
        pool.push('swarm');
    } else if (difficulty >= 10 && difficulty < 16) {
        pool.push('swarm', 'swarm');
    } else if (difficulty >= 16) {
        pool.push('swarm', 'swarm', 'swarm');
    }
    if (difficulty >= 5) pool.push('tank', 'archer');
    if (difficulty >= 10) pool.push('dasher', 'splitter');
    if (difficulty >= 12) pool.push('wraith', 'wraith');
    if (difficulty >= 15) pool.push('penetrator');
    if (difficulty >= 18) pool.push('bomber');
    return pool[Math.floor(Math.random() * pool.length)];
}

/** @param {number} difficulty @returns {string} */
export function pickRarityForSpawn(spawnCategory) {
    return spawnCategory;
}
