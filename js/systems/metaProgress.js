import { ACHIEVEMENTS } from '../config/achievements.js';

const STORAGE_KEY = 'survivor-arena-meta';

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

/** @param {ReturnType<typeof createDefaultMeta>} meta @param {string} characterName */
export function getCharacterRecord(meta, characterName) {
    return meta.characterRecords[characterName] || { level: 0, time: 0, kills: 0, wave: 0 };
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

/** @deprecated use updateCharacterRecord */
export function updateBestRun(meta, run) {
    updateCharacterRecord(meta, { ...run, wave: run.wave ?? 0 });
}
