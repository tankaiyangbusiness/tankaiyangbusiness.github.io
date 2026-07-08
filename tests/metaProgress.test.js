import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createDefaultMeta,
    evaluateAchievements,
    updateCharacterRecord,
    getCharacterRecord,
    loadMetaProgress,
    clearMetaProgress,
    markCharacterVictory,
    hasCharacterBeatGame,
    META_STORAGE_KEY
} from '../js/systems/metaProgress.js';

describe('evaluateAchievements', () => {
    it('unlocks first blood on first kill', () => {
        const meta = createDefaultMeta();
        const unlocked = evaluateAchievements(meta, {
            killCount: 1, level: 1, elapsedSeconds: 0,
            bestStreak: 0, treasuresOpened: 0, itemsLooted: 0,
            equippedRareCount: 0, equippedGearCount: 0
        });
        expect(unlocked).toContain('first_blood');
    });
});

describe('character records', () => {
    it('stores per-character best run', () => {
        const meta = createDefaultMeta();
        updateCharacterRecord(meta, {
            character: 'Warrior',
            level: 12,
            time: 400,
            kills: 80,
            wave: 5
        });
        const rec = getCharacterRecord(meta, 'Warrior');
        expect(rec.level).toBe(12);
        expect(rec.wave).toBe(5);
        expect(rec.kills).toBe(80);
    });

    it('does not overwrite with worse run', () => {
        const meta = createDefaultMeta();
        updateCharacterRecord(meta, { character: 'Ranger', level: 20, time: 600, kills: 100, wave: 8 });
        updateCharacterRecord(meta, { character: 'Ranger', level: 5, time: 100, kills: 10, wave: 1 });
        expect(getCharacterRecord(meta, 'Ranger').level).toBe(20);
    });

    it('marks and reads per-character campaign victory', () => {
        const meta = createDefaultMeta();
        expect(hasCharacterBeatGame(meta, 'Warrior')).toBe(false);
        markCharacterVictory(meta, 'Warrior');
        expect(hasCharacterBeatGame(meta, 'Warrior')).toBe(true);
        expect(getCharacterRecord(meta, 'Warrior').beatGame).toBe(true);
    });
});

describe('loadMetaProgress', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            store: {},
            getItem(k) { return this.store[k] ?? null; },
            setItem(k, v) { this.store[k] = v; },
            removeItem(k) { delete this.store[k]; }
        });
    });

    it('returns defaults when storage is empty', () => {
        const meta = loadMetaProgress();
        expect(meta.characterRecords).toEqual({});
    });

    it('clears best runs and achievements from localStorage', () => {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify({
            bestRun: { level: 99, time: 999, kills: 999, wave: 99, character: 'Warrior' },
            characterRecords: { Warrior: { level: 99, time: 999, kills: 999, wave: 99 } },
            unlockedAchievements: ['first_blood']
        }));
        const cleared = clearMetaProgress();
        expect(localStorage.getItem(META_STORAGE_KEY)).toBeNull();
        expect(cleared.unlockedAchievements).toEqual([]);
        expect(cleared.bestRun.level).toBe(0);
        expect(loadMetaProgress().unlockedAchievements).toEqual([]);
    });
});
