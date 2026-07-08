import { describe, it, expect } from 'vitest';
import { ENEMY_GUIDE_ENTRIES, getEnemyGuideEntry } from '../js/config/enemyGuide.js';
import { ENEMY_TYPES } from '../js/config/enemies.js';

describe('enemy guide', () => {
    it('documents every spawnable enemy type with color and behavior', () => {
        const typeKeys = Object.keys(ENEMY_TYPES).filter(
            type => ENEMY_TYPES[type].spawnable !== false
        );
        expect(ENEMY_GUIDE_ENTRIES.length).toBe(typeKeys.length);
        typeKeys.forEach(type => {
            const entry = getEnemyGuideEntry(type);
            expect(entry.label).toBeTruthy();
            expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(entry.description.length).toBeGreaterThan(5);
        });
    });

    it('returns fallback for unknown types', () => {
        const entry = getEnemyGuideEntry('unknown');
        expect(entry.type).toBe('unknown');
    });
});
