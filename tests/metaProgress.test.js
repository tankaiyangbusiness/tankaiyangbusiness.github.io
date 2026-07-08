import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createDefaultMeta,
    evaluateAchievements,
    updateCharacterRecord,
    getCharacterRecord,
    loadMetaProgress
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
});

describe('loadMetaProgress', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            store: {},
            getItem(k) { return this.store[k] ?? null; },
            setItem(k, v) { this.store[k] = v; }
        });
    });

    it('returns defaults when storage is empty', () => {
        const meta = loadMetaProgress();
        expect(meta.characterRecords).toEqual({});
    });
});
