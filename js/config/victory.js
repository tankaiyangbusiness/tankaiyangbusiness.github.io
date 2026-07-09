/**
 * Endgame objective — defeat the Wave 100 final boss. The run continues afterward.
 * Milestone boss data lives in milestoneBosses.js; this module keeps stable imports.
 */
export {
    FINAL_VICTORY_WAVE,
    FINAL_VICTORY_ARMY,
    isFinalVictoryWave,
    isMiniBossWave,
    isMilestoneBossWave,
    isCampaignVictoryAchieved,
    rollInt,
    rollFinalVictorySwarmCount,
    rollFinalVictoryGruntCount,
    rollFinalVictoryEliteCount,
    applyMilestoneBossCombatScaling as applyFinalBossCombatScaling,
    findLivingFinalVictoryBoss,
    FINAL_BOSS_HP_MULT,
    MIDPOINT_BOSS_HP_MULT,
    MINI_BOSS_HP_MULT,
    MILESTONE_BOSS_HP_MULT,
    MILESTONE_BOSS_COMBAT_MULT
} from './milestoneBosses.js';

import {
    FINAL_BOSS_HP_MULT,
    MILESTONE_BOSS_COMBAT_MULT
} from './milestoneBosses.js';

/** @deprecated Prefer MILESTONE_BOSS_* from milestoneBosses.js — kept for existing tests/UI copy. */
export const FINAL_BOSS_MULT = {
    hpVsBoss: FINAL_BOSS_HP_MULT,
    damage: MILESTONE_BOSS_COMBAT_MULT.damage,
    armour: MILESTONE_BOSS_COMBAT_MULT.armour
};
