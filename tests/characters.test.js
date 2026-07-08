import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../js/config/characters.js';

describe('CHARACTERS roster', () => {
    it('includes 11 playable heroes including Summoner and Capybara', () => {
        expect(CHARACTERS).toHaveLength(11);
        const names = CHARACTERS.map(c => c.name);
        expect(names).toContain('Summoner');
        expect(names).toContain('Capybara');
    });

    it('uses shared exp threshold from progression config', () => {
        CHARACTERS.forEach(char => {
            expect(char.stats.expThreshold).toBeGreaterThanOrEqual(14);
        });
    });
});
