import { getLevelUpType } from './progression.js';
import { applyLevelUpBonuses } from './combat.js';
import { calculateExpThreshold } from '../utils/math.js';
import { SKILL_IDS, SKILL_DEFINITIONS } from '../config/skills.js';

/** @typedef {'stat' | 'skill' | 'ability'} UpgradeType */
/** @typedef {{ type: UpgradeType }} PendingUpgrade */

/** Deduct exp, apply passive level bonuses, and advance threshold. */
export function completeLevelCycle(stats, originalStats) {
    applyLevelUpBonuses(stats, originalStats);
    stats.exp -= stats.expThreshold;
    stats.expThreshold = calculateExpThreshold(stats.level, originalStats.expThreshold);
}

/**
 * Bank all earned levels into a queue — game never pauses.
 * @returns {{ banked: number, pendingCount: number }}
 */
export function bankExpLevelUps(state) {
    if (!state.pendingUpgrades) state.pendingUpgrades = [];

    let banked = 0;
    while (state.stats.exp >= state.stats.expThreshold) {
        const type = getLevelUpType(state.stats.level, state.abilityLevelThreshold);
        state.pendingUpgrades.push(/** @type {PendingUpgrade} */ ({ type }));
        completeLevelCycle(state.stats, state.originalStats);
        banked++;
    }

    return { banked, pendingCount: state.pendingUpgrades.length };
}

/** @returns {PendingUpgrade|null} */
export function peekPendingUpgrade(state) {
    return state.pendingUpgrades?.[0] ?? null;
}

/** @returns {PendingUpgrade|null} */
export function consumePendingUpgrade(state) {
    return state.pendingUpgrades?.shift() ?? null;
}

/** Consume first pending upgrade of a given type. @returns {PendingUpgrade|null} */
export function consumePendingUpgradeByType(state, type) {
    if (!state.pendingUpgrades) return null;
    const idx = state.pendingUpgrades.findIndex(u => u.type === type);
    if (idx === -1) return null;
    return state.pendingUpgrades.splice(idx, 1)[0];
}

/** @returns {{ stat: number, skill: number, ability: number }} */
export function countPendingByType(pendingUpgrades) {
    const counts = { stat: 0, skill: 0, ability: 0 };
    (pendingUpgrades || []).forEach(u => { counts[u.type]++; });
    return counts;
}

/** @param {object} statsList @param {number} [count] */
export function buildStatUpgradeOptions(statsList, count = 3) {
    const available = Object.keys(statsList).filter(
        k => statsList[k].level < statsList[k].maxLevel
    );
    if (available.length === 0) return [];

    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    picked.sort((a, b) => available.indexOf(a) - available.indexOf(b));

    return picked.map(key => ({
        key,
        label: key,
        level: statsList[key].level
    }));
}

/** Build stat choices from a previously rolled key list (no re-randomize). */
export function buildStatUpgradeOptionsFromKeys(statsList, cachedKeys) {
    if (!cachedKeys?.length) return buildStatUpgradeOptions(statsList);

    return cachedKeys
        .filter(k => statsList[k] && statsList[k].level < statsList[k].maxLevel)
        .map(key => ({
            key,
            label: key,
            level: statsList[key].level
        }));
}

/** Roll and return stat keys for caching across multiple picks in one session. */
export function rollStatUpgradeKeys(statsList, count = 3) {
    return buildStatUpgradeOptions(statsList, count).map(o => o.key);
}

/** @param {object} skillList @param {number} [count] */
export function buildSkillUpgradeOptions(skillList, count = 3) {
    const available = SKILL_IDS
        .filter(id => skillList[id] && skillList[id].level < skillList[id].maxLevel)
        .map(id => ({
            key: id,
            level: skillList[id].level,
            label: SKILL_DEFINITIONS[id].formatText(
                skillList[id].level,
                skillList[id].level + 1
            )
        }));
    return pickRandomOptions(available, count);
}

/** Build skill choices from a previously rolled key list (no re-randomize). */
export function buildSkillUpgradeOptionsFromKeys(skillList, cachedKeys) {
    if (!cachedKeys?.length) return buildSkillUpgradeOptions(skillList);

    return cachedKeys
        .filter(k => skillList[k] && skillList[k].level < skillList[k].maxLevel)
        .map(key => ({
            key,
            level: skillList[key].level,
            label: SKILL_DEFINITIONS[key].formatText(
                skillList[key].level,
                skillList[key].level + 1
            )
        }));
}

/** Roll and return skill keys for caching across multiple picks in one session. */
export function rollSkillUpgradeKeys(skillList, count = 3) {
    return buildSkillUpgradeOptions(skillList, count).map(o => o.key);
}

/** @param {object} abilityList @param {(name: string) => string} formatAbilityText */
export function buildAbilityUpgradeOptions(abilityList, formatAbilityText) {
    return Object.keys(abilityList)
        .filter(k => abilityList[k].level < abilityList[k].maxLevel)
        .map(k => ({
            key: k,
            level: abilityList[k].level,
            label: formatAbilityText(k)
        }));
}

/** @param {Array<object>} available @param {number} count */
export function pickRandomOptions(available, count) {
    if (available.length === 0) return [];
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    return picked.sort((a, b) => available.indexOf(a) - available.indexOf(b));
}

/** Summarize queued upgrade types for the panel header. */
export function summarizeUpgradeQueue(pendingUpgrades) {
    const counts = { stat: 0, skill: 0, ability: 0 };
    (pendingUpgrades || []).forEach(u => { counts[u.type]++; });
    return counts;
}

/** Whether this level-up requires the player to choose (skill / ability / stat). */
export function requiresPlayerChoice(currentLevel, abilityThresholds) {
    return getLevelUpType(currentLevel, abilityThresholds) !== 'stat';
}

/** @param {object} ability */
export function formatAbilityDescription(ability) {
    let i = 0;
    return ability.text.replace(/\?\?/g, () => {
        const idx = ability.level + i * ability.maxLevel;
        i++;
        return ability.progression[idx] ?? '??';
    });
}
