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

    it('stores balanced stats directly on each hero (no runtime multipliers)', () => {
        const warrior = CHARACTERS.find(c => c.name === 'Warrior');
        expect(warrior.stats.maxHp).toBe(1567);
        expect(warrior.stats.physicalDamage).toBe(30);
        expect(warrior.stats.armour).toBe(52);
        expect(warrior.stats.hpRegen).toBe(6);

        const ranger = CHARACTERS.find(c => c.name === 'Ranger');
        expect(ranger.stats.hp).toBe(528);
        expect(ranger.stats.physicalDamage).toBe(41);
    });

    it('keeps hp and maxHp in sync for every character', () => {
        CHARACTERS.forEach(char => {
            expect(char.stats.hp).toBe(char.stats.maxHp);
            expect(char.stats.physicalDamage).toBeGreaterThan(0);
        });
    });
});
