import { ACHIEVEMENTS } from '../config/achievements.js';

const STORAGE_KEY = 'survivor-arena-meta';

/** localStorage key for best runs, per-character records, and achievements. */
export const META_STORAGE_KEY = STORAGE_KEY;

/** @typedef {{
 *   level: number,
 *   time: number,
 *   kills: number,
 *   wave: number,
 *   beatGame: boolean,
 *   victoryCount: number
 * }} CharacterRecord */

/** @returns {CharacterRecord} */
export function createEmptyCharacterRecord() {
    return {
        level: 0,
        time: 0,
        kills: 0,
        wave: 0,
        beatGame: false,
        victoryCount: 0
    };
}

/** @param {Partial<CharacterRecord>|null|undefined} raw @returns {CharacterRecord} */
export function normalizeCharacterRecord(raw) {
    const base = createEmptyCharacterRecord();
    if (!raw || typeof raw !== 'object') return base;
    return {
        level: Math.max(0, Number(raw.level) || 0),
        time: Math.max(0, Number(raw.time) || 0),
        kills: Math.max(0, Number(raw.kills) || 0),
        wave: Math.max(0, Number(raw.wave) || 0),
        beatGame: Boolean(raw.beatGame),
        victoryCount: Math.max(0, Number(raw.victoryCount) || 0)
    };
}

/** @returns {object} */
export function createDefaultMeta() {
    return {
        bestRun: { level: 0, time: 0, kills: 0, wave: 0, character: '' },
        characterRecords: {},
        unlockedAchievements: []
    };
}

/** @returns {ReturnType<typeof createDefaultMeta>} */
export function loadMetaProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefaultMeta();
        const parsed = JSON.parse(raw);
        const meta = { ...createDefaultMeta(), ...parsed };
        if (!meta.characterRecords) meta.characterRecords = {};
        if (parsed.totalGold !== undefined) delete meta.totalGold;

        const normalized = {};
        for (const [name, record] of Object.entries(meta.characterRecords)) {
            normalized[name] = normalizeCharacterRecord(record);
        }
        meta.characterRecords = normalized;
        return meta;
    } catch {
        return createDefaultMeta();
    }
}

/** @param {ReturnType<typeof createDefaultMeta>} meta */
export function saveMetaProgress(meta) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch { /* noop */ }
}

/** @param {ReturnType<typeof createDefaultMeta>} meta @param {string} characterName @returns {CharacterRecord} */
export function getCharacterRecord(meta, characterName) {
    return normalizeCharacterRecord(meta.characterRecords[characterName]);
}

/** @param {ReturnType<typeof createDefaultMeta>} meta @param {string} characterName */
export function hasCharacterBeatGame(meta, characterName) {
    return getCharacterRecord(meta, characterName).beatGame;
}

/** @param {ReturnType<typeof createDefaultMeta>} meta @param {string} characterName */
export function getCharacterVictoryCount(meta, characterName) {
    return getCharacterRecord(meta, characterName).victoryCount;
}

/**
 * Mark a character as having defeated the Wave 100 final boss (increments win count).
 * @param {ReturnType<typeof createDefaultMeta>} meta @param {string} characterName
 */
export function markCharacterVictory(meta, characterName) {
    if (!characterName) return;
    const prev = getCharacterRecord(meta, characterName);
    meta.characterRecords[characterName] = {
        ...prev,
        beatGame: true,
        victoryCount: prev.victoryCount + 1
    };
    saveMetaProgress(meta);
}

/**
 * Record campaign victory when the final boss was defeated but not yet persisted
 * (e.g. player manually quits to character select right after the kill).
 * @param {ReturnType<typeof createDefaultMeta>} meta
 * @param {string} characterName
 * @param {{ finalBossDefeatedThisRun?: boolean, campaignVictoryRecorded?: boolean, finalVictoryAchieved?: boolean }} runState
 * @returns {boolean}
 */
export function recordCampaignVictoryIfPending(meta, characterName, runState) {
    if (!characterName || !runState?.finalBossDefeatedThisRun) return false;
    if (runState.campaignVictoryRecorded) return false;
    markCharacterVictory(meta, characterName);
    runState.campaignVictoryRecorded = true;
    runState.finalVictoryAchieved = true;
    return true;
}

/**
 * @param {ReturnType<typeof createDefaultMeta>} meta
 * @param {{ character: string, level: number, time: number, kills: number, wave: number }} run
 */
export function updateCharacterRecord(meta, run) {
    if (!run.character) return;
    const prev = getCharacterRecord(meta, run.character);
    const better = run.level > prev.level ||
        (run.level === prev.level && run.kills > prev.kills) ||
        (run.level === prev.level && run.kills === prev.kills && run.time > prev.time);

    if (better) {
        meta.characterRecords[run.character] = {
            ...prev,
            level: run.level,
            time: run.time,
            kills: run.kills,
            wave: run.wave
        };
    }

    const global = meta.bestRun;
    const globalBetter = run.level > global.level ||
        (run.level === global.level && run.kills > global.kills);
    if (globalBetter) {
        meta.bestRun = { ...run };
    }

    saveMetaProgress(meta);
}

/** @param {ReturnType<typeof createDefaultMeta>} meta */
export function countCharactersBeatGame(meta) {
    return Object.values(meta?.characterRecords || {})
        .filter(record => normalizeCharacterRecord(record).beatGame)
        .length;
}

/** @param {ReturnType<typeof createDefaultMeta>} meta @param {object} ctx */
export function evaluateAchievements(meta, ctx) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(def => {
        if (meta.unlockedAchievements.includes(def.id)) return;
        if (def.check(ctx)) {
            meta.unlockedAchievements.push(def.id);
            newlyUnlocked.push(def.id);
        }
    });
    if (newlyUnlocked.length > 0) saveMetaProgress(meta);
    return newlyUnlocked;
}

/** @param {string} id */
export function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

/** Wipes saved best runs, character records, and achievements from localStorage. */
export function clearMetaProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
    return createDefaultMeta();
}

/** @deprecated use updateCharacterRecord */
export function updateBestRun(meta, run) {
    updateCharacterRecord(meta, { ...run, wave: run.wave ?? 0 });
}
