/**
 * Landmark boss waves — shared combat scaling, escort armies, HUD priority, and spawn policy.
 * Tracked waves: 25 & 75 (mini, 10× HP), 50 (30× HP), 100 (final, 50× HP).
 */

/** Mini-boss milestone waves (1-based). */
export const MINI_BOSS_WAVES = [25, 75];

/** Mid-campaign milestone boss wave (1-based). */
export const MIDPOINT_VICTORY_WAVE = 50;

/** Campaign finale boss wave (1-based). */
export const FINAL_VICTORY_WAVE = 100;

/** All waves that spawn a tracked boss with HUD + cap bypass. */
export const TRACKED_BOSS_WAVES = [25, 50, 75, 100];

/** HP multiplier for the Wave 100 final boss. */
export const FINAL_BOSS_HP_MULT = 50;

/** HP multiplier for the Wave 50 milestone boss. */
export const MIDPOINT_BOSS_HP_MULT = 30;

/** HP multiplier for mini milestone bosses (25 & 75). */
export const MINI_BOSS_HP_MULT = 10;

/** @deprecated Use FINAL_BOSS_HP_MULT — kept for existing imports. */
export const MILESTONE_BOSS_HP_MULT = FINAL_BOSS_HP_MULT;

/** Non-HP combat multipliers for tracked milestone bosses. */
export const MILESTONE_BOSS_COMBAT_MULT = {
    damage: 2.25,
    armour: 2.1
};

/**
 * Per-wave boss profile — single source of truth for HUD, scaling, and escorts.
 * @typedef {object} BossWaveProfile
 * @property {number} hpMult
 * @property {string} hudLabel
 * @property {string} worldLabel
 * @property {number} priority Higher wins HUD when multiple bosses live.
 * @property {boolean} [isFinalVictory]
 * @property {{ swarmMin: number, swarmMax: number, gruntMin: number, gruntMax: number, eliteMin: number, eliteMax: number }} army
 * @property {number} reinforceIntervalMs
 * @property {number} reinforcementSwarmMin
 * @property {number} reinforcementSwarmMax
 */

/** @type {Record<number, BossWaveProfile>} */
export const BOSS_WAVE_PROFILES = {
    25: {
        hpMult: MINI_BOSS_HP_MULT,
        hudLabel: 'Wave 25 Mini Boss',
        worldLabel: 'W25 BOSS',
        priority: 1,
        army: { swarmMin: 12, swarmMax: 18, gruntMin: 8, gruntMax: 12, eliteMin: 2, eliteMax: 4 },
        reinforceIntervalMs: 5200,
        reinforcementSwarmMin: 3,
        reinforcementSwarmMax: 6,
        guaranteesUniqueLoot: true
    },
    50: {
        hpMult: MIDPOINT_BOSS_HP_MULT,
        hudLabel: 'Wave 50 Boss',
        worldLabel: 'W50 BOSS',
        priority: 2,
        army: { swarmMin: 28, swarmMax: 36, gruntMin: 18, gruntMax: 24, eliteMin: 4, eliteMax: 8 },
        reinforceIntervalMs: 4800,
        reinforcementSwarmMin: 4,
        reinforcementSwarmMax: 8,
        guaranteesUniqueLoot: true
    },
    75: {
        hpMult: MINI_BOSS_HP_MULT,
        hudLabel: 'Wave 75 Mini Boss',
        worldLabel: 'W75 BOSS',
        priority: 3,
        army: { swarmMin: 16, swarmMax: 22, gruntMin: 10, gruntMax: 14, eliteMin: 3, eliteMax: 6 },
        reinforceIntervalMs: 5000,
        reinforcementSwarmMin: 3,
        reinforcementSwarmMax: 7,
        guaranteesUniqueLoot: true
    },
    100: {
        hpMult: FINAL_BOSS_HP_MULT,
        hudLabel: 'Final Boss',
        worldLabel: 'FINAL BOSS',
        priority: 4,
        isFinalVictory: true,
        army: { swarmMin: 38, swarmMax: 52, gruntMin: 20, gruntMax: 30, eliteMin: 12, eliteMax: 18 },
        reinforceIntervalMs: 4800,
        reinforcementSwarmMin: 4,
        reinforcementSwarmMax: 8,
        guaranteesUniqueLoot: true
    }
};

/** HP multipliers per tracked boss wave — single reference for tuning and UI. */
export const BOSS_HP_BY_WAVE = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, profile]) => [Number(wave), profile.hpMult])
);

/** @param {number} wave 1-based @returns {number|null} */
export function getBossHpMultiplier(wave) {
    return BOSS_HP_BY_WAVE[wave] ?? null;
}

/** @deprecated Use BOSS_WAVE_PROFILES — kept for existing imports. */
export const BOSS_HUD_LABELS = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [wave, p.hudLabel])
);

/** @deprecated Use BOSS_WAVE_PROFILES — kept for existing imports. */
export const MILESTONE_BOSS_WORLD_LABELS = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [wave, p.worldLabel])
);

/** @deprecated Use BOSS_WAVE_PROFILES — kept for existing imports. */
export const BOSS_HUD_PRIORITY = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [Number(wave), p.priority])
);

/**
 * Spawn options for tracked milestone bosses — always bypass the population cap so the
 * encounter cannot silently fail when the arena is already full.
 */
export const MILESTONE_BOSS_SPAWN_OPTS = {
    skipGroup: true,
    bypassCap: true
};

/** @deprecated Use BOSS_WAVE_PROFILES[50].army */
export const MIDPOINT_VICTORY_ARMY = BOSS_WAVE_PROFILES[50].army;

/** @deprecated Use BOSS_WAVE_PROFILES[100].army */
export const FINAL_VICTORY_ARMY = BOSS_WAVE_PROFILES[100].army;

/** @param {number} wave 1-based @returns {BossWaveProfile|null} */
export function getBossWaveProfile(wave) {
    return BOSS_WAVE_PROFILES[wave] || null;
}

/** @param {number} wave */
export function milestoneBossGuaranteesUniqueLoot(wave) {
    return Boolean(getBossWaveProfile(wave)?.guaranteesUniqueLoot);
}

/** @param {number} wave 1-based */
export function isMiniBossWave(wave) {
    return MINI_BOSS_WAVES.includes(wave);
}

/** @param {number} wave 1-based */
export function isMidpointVictoryWave(wave) {
    return wave === MIDPOINT_VICTORY_WAVE;
}

/** @param {number} wave 1-based */
export function isFinalVictoryWave(wave) {
    return wave === FINAL_VICTORY_WAVE;
}

/** @param {number} wave 1-based — any tracked boss wave (25, 50, 75, 100). */
export function isMilestoneBossWave(wave) {
    return Boolean(BOSS_WAVE_PROFILES[wave]);
}

/** @param {{ milestoneBossWave?: number }} enemy */
export function isMilestoneBossEnemy(enemy) {
    return Boolean(enemy?.milestoneBossWave && BOSS_WAVE_PROFILES[enemy.milestoneBossWave]);
}

/** @param {number} min @param {number} max */
export function rollInt(min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** @param {number} wave @param {'swarm'|'grunt'|'elite'} kind */
export function rollBossArmyCount(wave, kind) {
    const army = getBossWaveProfile(wave)?.army;
    if (!army) return 0;
    if (kind === 'swarm') return rollInt(army.swarmMin, army.swarmMax);
    if (kind === 'grunt') return rollInt(army.gruntMin, army.gruntMax);
    return rollInt(army.eliteMin, army.eliteMax);
}

/** @returns {number} */
export function rollMidpointVictorySwarmCount() {
    return rollBossArmyCount(MIDPOINT_VICTORY_WAVE, 'swarm');
}

/** @returns {number} */
export function rollMidpointVictoryGruntCount() {
    return rollBossArmyCount(MIDPOINT_VICTORY_WAVE, 'grunt');
}

/** @returns {number} */
export function rollMidpointVictoryEliteCount() {
    return rollBossArmyCount(MIDPOINT_VICTORY_WAVE, 'elite');
}

/** @returns {number} */
export function rollFinalVictorySwarmCount() {
    return rollBossArmyCount(FINAL_VICTORY_WAVE, 'swarm');
}

/** @returns {number} */
export function rollFinalVictoryGruntCount() {
    return rollBossArmyCount(FINAL_VICTORY_WAVE, 'grunt');
}

/** @returns {number} */
export function rollFinalVictoryEliteCount() {
    return rollBossArmyCount(FINAL_VICTORY_WAVE, 'elite');
}

/**
 * Apply tracked-boss combat scaling for the given milestone wave.
 * @param {object} stats Enemy stats object (mutated in place)
 * @param {number} [wave] Defaults to midpoint (50× HP).
 */
export function applyMilestoneBossCombatScaling(stats, wave = MIDPOINT_VICTORY_WAVE) {
    if (!stats) return stats;
    const profile = getBossWaveProfile(wave);
    const hpMult = profile?.hpMult ?? FINAL_BOSS_HP_MULT;
    stats.hp = Math.max(1, Math.floor(stats.hp * hpMult));
    stats.maxHp = stats.hp;
    stats.physicalDamage = Math.max(
        1,
        Math.floor(stats.physicalDamage * MILESTONE_BOSS_COMBAT_MULT.damage)
    );
    if (typeof stats.armour === 'number') {
        stats.armour = Math.max(0, Math.floor(stats.armour * MILESTONE_BOSS_COMBAT_MULT.armour));
    }
    return stats;
}

/**
 * @param {Array<{ milestoneBossWave?: number, stats?: { hp?: number } }>} enemies
 * @param {number} [preferredWave] When set, only match this milestone wave.
 */
export function findLivingMilestoneBoss(enemies, preferredWave) {
    const living = enemies.filter(
        e => e.milestoneBossWave && BOSS_WAVE_PROFILES[e.milestoneBossWave] && (e.stats?.hp ?? 0) > 0
    );
    if (preferredWave != null) {
        return living.find(e => e.milestoneBossWave === preferredWave) || null;
    }

    let best = null;
    let bestPriority = 0;
    for (const enemy of living) {
        const priority = BOSS_WAVE_PROFILES[enemy.milestoneBossWave]?.priority ?? 0;
        if (priority > bestPriority) {
            best = enemy;
            bestPriority = priority;
        }
    }
    return best;
}

/** @param {Array<{ milestoneBossWave?: number, isFinalVictoryBoss?: boolean, stats?: { hp?: number } }>} enemies */
export function findLivingFinalVictoryBoss(enemies) {
    return findLivingMilestoneBoss(enemies, FINAL_VICTORY_WAVE);
}

/** Campaign win requires defeating the Wave 100 boss — reaching Wave 101 alone is not enough. */
export function isCampaignVictoryAchieved(finalVictoryAchieved) {
    return Boolean(finalVictoryAchieved);
}

/** Reinforcement interval during Wave 50 (sim ms). */
export function getMidpointReinforcementIntervalMs() {
    return BOSS_WAVE_PROFILES[MIDPOINT_VICTORY_WAVE].reinforceIntervalMs;
}

/** @param {number} milestoneWave */
export function getMilestoneReinforcementIntervalMs(milestoneWave) {
    return getBossWaveProfile(milestoneWave)?.reinforceIntervalMs ?? getMidpointReinforcementIntervalMs();
}

/** @returns {number} */
export function rollMidpointReinforcementSwarmSize() {
    const p = BOSS_WAVE_PROFILES[MIDPOINT_VICTORY_WAVE];
    return rollInt(p.reinforcementSwarmMin, p.reinforcementSwarmMax);
}

/** @param {number} milestoneWave */
export function rollMilestoneReinforcementSwarmSize(milestoneWave) {
    const p = getBossWaveProfile(milestoneWave);
    if (!p) return rollMidpointReinforcementSwarmSize();
    return rollInt(p.reinforcementSwarmMin, p.reinforcementSwarmMax);
}
