/**
 * Achievement / challenge definitions for Survivor Arena.
 * Each entry: id, title, description (shown on hover), cute icon, and unlock check(ctx).
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   icon: string,
 *   check: (ctx: AchievementContext) => boolean
 * }} AchievementDef
 *
 * @typedef {{
 *   killCount: number,
 *   level: number,
 *   elapsedSeconds: number,
 *   bestStreak: number,
 *   treasuresOpened: number,
 *   itemsLooted: number,
 *   equippedRareCount: number,
 *   equippedUniqueCount?: number,
 *   equippedGearCount: number,
 *   currentWave?: number,
 *   maxWaveReached?: number,
 *   skillLevelSum?: number,
 *   skillsAtMax?: number,
 *   damageDealt?: number,
 *   bossesKilled?: number,
 *   elitesKilled?: number,
 *   frostboltHits?: number,
 *   fireballCasts?: number,
 *   healedAmount?: number,
 *   charactersPlayed?: number,
 *   totalRuns?: number,
 *   maxHpReached?: number,
 *   maxHp?: number,
 *   finalVictoryAchieved?: boolean
 * }} AchievementContext
 */

/**
 * Helper to build a typed achievement entry.
 * @param {string} id
 * @param {string} title
 * @param {string} description
 * @param {string} icon
 * @param {(ctx: AchievementContext) => boolean} check
 * @returns {AchievementDef}
 */
function ach(id, title, description, icon, check) {
    return { id, title, description, icon, check };
}

/** @type {AchievementDef[]} */
export const ACHIEVEMENTS = [
    // —— Combat kills ——
    ach('first_blood', 'First Blood', 'Defeat your first enemy.', '🩸', ctx => ctx.killCount >= 1),
    ach('slayer_10', 'Warm-Up', 'Defeat 10 enemies in one run.', '🗡️', ctx => ctx.killCount >= 10),
    ach('slayer_25', 'Skirmisher', 'Defeat 25 enemies in one run.', '⚔️', ctx => ctx.killCount >= 25),
    ach('slayer_50', 'Battler', 'Defeat 50 enemies in one run.', '🛡️', ctx => ctx.killCount >= 50),
    ach('slayer_100', 'Centurion', 'Defeat 100 enemies in one run.', '💯', ctx => ctx.killCount >= 100),
    ach('slayer_250', 'Raid Leader', 'Defeat 250 enemies in one run.', '🏹', ctx => ctx.killCount >= 250),
    ach('slayer_500', 'Exterminator', 'Defeat 500 enemies in one run.', '💀', ctx => ctx.killCount >= 500),
    ach('slayer_1000', 'Legend Slayer', 'Defeat 1000 enemies in one run.', '🏆', ctx => ctx.killCount >= 1000),
    ach('slayer_2000', 'Arena Nightmare', 'Defeat 2000 enemies in one run.', '👹', ctx => ctx.killCount >= 2000),
    ach('slayer_10000', 'Apocalypse', 'Defeat 10,000 enemies in one run.', '☄️', ctx => ctx.killCount >= 10000),

    // —— Levels ——
    ach('level_5', 'Getting Started', 'Reach level 5 in one run.', '🌱', ctx => ctx.level >= 5),
    ach('level_10', 'Rising Star', 'Reach level 10 in one run.', '⭐', ctx => ctx.level >= 10),
    ach('level_15', 'Seasoned', 'Reach level 15 in one run.', '🌠', ctx => ctx.level >= 15),
    ach('level_25', 'Veteran', 'Reach level 25 in one run.', '🎖️', ctx => ctx.level >= 25),
    ach('level_35', 'Warlord', 'Reach level 35 in one run.', '👑', ctx => ctx.level >= 35),
    ach('level_50', 'Elite Hunter', 'Reach level 50 in one run.', '💎', ctx => ctx.level >= 50),
    ach('level_75', 'Apex Predator', 'Reach level 75 in one run.', '🐆', ctx => ctx.level >= 75),

    // —— Survival time ——
    ach('survive_1m', 'One Minute', 'Survive 1 minute.', '⏱️', ctx => ctx.elapsedSeconds >= 60),
    ach('survive_3m', 'Holding On', 'Survive 3 minutes.', '⏳', ctx => ctx.elapsedSeconds >= 180),
    ach('survive_5m', 'Still Standing', 'Survive 5 minutes.', '🧍', ctx => ctx.elapsedSeconds >= 300),
    ach('survive_10m', 'Tenacious', 'Survive 10 minutes.', '🧱', ctx => ctx.elapsedSeconds >= 600),
    ach('survive_15m', 'Iron Will', 'Survive 15 minutes.', '💪', ctx => ctx.elapsedSeconds >= 900),
    ach('survive_20m', 'Endurance Ace', 'Survive 20 minutes.', '🏃', ctx => ctx.elapsedSeconds >= 1200),
    ach('survive_30m', 'Marathon Runner', 'Survive 30 minutes.', '🏅', ctx => ctx.elapsedSeconds >= 1800),

    // —— Waves ——
    ach('wave_3', 'Wave Rider', 'Reach wave 3.', '🌊', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 3),
    ach('wave_6', 'Tide Breaker', 'Reach wave 6.', '🌀', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 6),
    ach('wave_12', 'Deep Waters', 'Reach wave 12.', '🌊', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 12),
    ach('wave_18', 'Storm Caller', 'Reach wave 18.', '⛈️', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 18),
    ach('wave_24', 'Twilight Tide', 'Reach wave 24.', '🌙', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 24),
    ach('wave_36', 'Abyss Walker', 'Reach wave 36.', '🕳️', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 36),
    ach('wave_48', 'Wave Master', 'Reach wave 48.', '👑', ctx => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 48),
    ach('wave_100_champion', 'Arena Champion', 'Defeat the Wave 100 final boss.', '🏆', ctx => Boolean(ctx.finalVictoryAchieved)),

    // —— Kill streaks ——
    ach('streak_5', 'On a Roll', 'Reach a 5 kill streak.', '🔥', ctx => ctx.bestStreak >= 5),
    ach('streak_10', 'Hot Streak', 'Reach a 10 kill streak.', '🌶️', ctx => ctx.bestStreak >= 10),
    ach('streak_25', 'Unstoppable', 'Reach a 25 kill streak.', '💥', ctx => ctx.bestStreak >= 25),
    ach('streak_50', 'Frenzy', 'Reach a 50 kill streak.', '🌪️', ctx => ctx.bestStreak >= 50),
    ach('streak_100', 'Rampage', 'Reach a 100 kill streak.', '☢️', ctx => ctx.bestStreak >= 100),

    // —— Treasure ——
    ach('treasure_1', 'Lucky Find', 'Open 1 treasure chest in one run.', '🎁', ctx => ctx.treasuresOpened >= 1),
    ach('treasure_3', 'Chest Curious', 'Open 3 treasure chests in one run.', '📦', ctx => ctx.treasuresOpened >= 3),
    ach('treasure_5', 'Treasure Hunter', 'Open 5 treasure chests in one run.', '🗺️', ctx => ctx.treasuresOpened >= 5),
    ach('treasure_10', 'Pirate Greed', 'Open 10 treasure chests in one run.', '🏴‍☠️', ctx => ctx.treasuresOpened >= 10),

    // —— Gear ——
    ach('loot_1', 'First Drop', 'Pick up 1 item in one run.', '🎒', ctx => ctx.itemsLooted >= 1),
    ach('loot_5', 'Scavenger', 'Pick up 5 items in one run.', '🧲', ctx => ctx.itemsLooted >= 5),
    ach('loot_20', 'Collector', 'Pick up 20 items in one run.', '📿', ctx => ctx.itemsLooted >= 20),
    ach('loot_50', 'Hoarder', 'Pick up 50 items in one run.', '🧺', ctx => ctx.itemsLooted >= 50),
    ach('gear_rare', 'Well Equipped', 'Equip a rare (or unique) item.', '✨', ctx => ctx.equippedRareCount >= 1),
    ach('gear_unique', 'Relic Seeker', 'Equip a unique item.', '🧡', ctx => (ctx.equippedUniqueCount ?? 0) >= 1),
    ach('gear_3', 'Armed', 'Equip items in 3 slots.', '🧤', ctx => ctx.equippedGearCount >= 3),
    ach('gear_5', 'Geared Up', 'Equip items in 5 slots.', '🧤', ctx => ctx.equippedGearCount >= 5),
    ach('gear_full', 'Fully Loaded', 'Equip items in all 7 slots.', '🦾', ctx => ctx.equippedGearCount >= 7),
    ach('hp_5000', 'Iron Heart', 'Reach 5,000 maximum HP in one run.', '❤️‍🔥', ctx => (ctx.maxHpReached ?? ctx.maxHp ?? 0) >= 5000),

    // —— Skills ——
    ach('skill_any', 'First Spell', 'Learn any active skill (sum of levels ≥ 1).', '🪄', ctx => (ctx.skillLevelSum ?? 0) >= 1),
    ach('skill_5', 'Spell Student', 'Reach 5 total skill levels.', '📘', ctx => (ctx.skillLevelSum ?? 0) >= 5),
    ach('skill_15', 'Spell Adept', 'Reach 15 total skill levels.', '📗', ctx => (ctx.skillLevelSum ?? 0) >= 15),
    ach('skill_30', 'Spell Master', 'Reach 30 total skill levels.', '📕', ctx => (ctx.skillLevelSum ?? 0) >= 30),
    ach('skill_max_1', 'Specialize', 'Max out any one skill.', '🎯', ctx => (ctx.skillsAtMax ?? 0) >= 1),
    ach('skill_max_3', 'Multi-Talent', 'Max out 3 different skills.', '🌟', ctx => (ctx.skillsAtMax ?? 0) >= 3),

    // —— Special enemies ——
    ach('elite_1', 'Elite Hunter', 'Defeat 1 elite enemy in one run.', '🟣', ctx => (ctx.elitesKilled ?? 0) >= 1),
    ach('elite_10', 'Elite Slayer', 'Defeat 10 elite enemies in one run.', '💜', ctx => (ctx.elitesKilled ?? 0) >= 10),
    ach('boss_1', 'Boss Breaker', 'Defeat 1 boss in one run.', '🐲', ctx => (ctx.bossesKilled ?? 0) >= 1),
    ach('boss_3', 'Boss Bane', 'Defeat 3 bosses in one run.', '🐉', ctx => (ctx.bossesKilled ?? 0) >= 3),
    ach('boss_5', 'Dragon Killer', 'Defeat 5 bosses in one run.', '🔥', ctx => (ctx.bossesKilled ?? 0) >= 5),

    // —— Combo challenges (tuned for real clear pace — early packs are denser) ——
    ach('combo_kills_wave', 'Early Pressure', 'Get 120 kills before wave 8.', '⚡', ctx =>
        ctx.killCount >= 120 && (ctx.maxWaveReached ?? ctx.currentWave ?? 99) <= 8),
    ach('combo_level_streak', 'Perfect Flow', 'Reach level 15 with a best streak of 30+.', '🎭', ctx =>
        ctx.level >= 15 && ctx.bestStreak >= 30),
    ach('combo_treasure_loot', 'Fortune Favored', 'Open 5 chests and loot 20 items in one run.', '💰', ctx =>
        ctx.treasuresOpened >= 5 && ctx.itemsLooted >= 20),
    ach('combo_tank', 'Ironclad', 'Survive 15 minutes with 5+ gear pieces equipped.', '🏰', ctx =>
        ctx.elapsedSeconds >= 900 && ctx.equippedGearCount >= 5),
    ach('combo_glass', 'Glass Cannon', 'Reach wave 18 with fewer than 3 gear pieces equipped.', '🍾', ctx =>
        (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 18 && ctx.equippedGearCount < 3),
    /** Wave advances by clock (~20s); wave 24 ≈ 7.7 min — requiring ≤ 8 min is a true rush. */
    ach('combo_speed', 'Speed Demon', 'Reach wave 24 within 8 minutes.', '🚀', ctx =>
        (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 24 && ctx.elapsedSeconds <= 480),
    ach('combo_slayer_time', 'Efficient Killer', 'Get 1000 kills within 10 minutes.', '🎳', ctx =>
        ctx.killCount >= 1000 && ctx.elapsedSeconds <= 600),
    ach('combo_blitz', 'Blitz Pack', 'Get 200 kills within 3 minutes.', '⚡', ctx =>
        ctx.killCount >= 200 && ctx.elapsedSeconds <= 180),
    ach('combo_endurance_kills', 'War of Attrition', 'Get 1500 kills in one run.', '🪓', ctx =>
        ctx.killCount >= 1500),
];

/** Ensure designers notice when the catalog shrinks below the product goal. */
export const ACHIEVEMENT_TARGET_COUNT = 50;

/** @returns {number} */
export function getAchievementCount() {
    return ACHIEVEMENTS.length;
}

/** @param {string} id @returns {AchievementDef|undefined} */
export function getAchievementDefinition(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

/** Hover tooltip body — description only (no locked/unlocked prefix). */
export function getAchievementTooltipText(def) {
    return def?.description ?? '';
}
