import { describe, it, expect } from 'vitest';
import { GearLootFilter, FILTERABLE_RARITIES } from '../js/systems/gearLootFilter.js';

describe('GearLootFilter', () => {
    it('toggles auto-delete for filterable rarities only', () => {
        const filter = new GearLootFilter();
        expect(filter.toggle('normal')).toBe(true);
        expect(filter.isActive('normal')).toBe(true);
        expect(filter.toggle('normal')).toBe(false);
        expect(filter.shouldAutoDelete('unique')).toBe(false);
    });

    it('resets all filters', () => {
        const filter = new GearLootFilter();
        filter.toggle('magic');
        filter.reset();
        FILTERABLE_RARITIES.forEach(r => {
            expect(filter.isActive(r)).toBe(false);
        });
    });
});
