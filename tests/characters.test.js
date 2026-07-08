import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../js/config/characters.js';

describe('CHARACTERS roster', () => {
    it('includes 12 playable heroes including Slayer', () => {
        expect(CHARACTERS).toHaveLength(12);
        const names = CHARACTERS.map(c => c.name);
        expect(names).toContain('Summoner');
        expect(names).toContain('Capybara');
        expect(names).toContain('Slayer');
    });

    it('uses shared exp threshold from progression config', () => {
        CHARACTERS.forEach(char => {
            expect(char.stats.expThreshold).toBeGreaterThanOrEqual(14);
        });
    });
});
