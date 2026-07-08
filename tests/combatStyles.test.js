import { describe, it, expect } from 'vitest';
import { MELEE_MODEL_CLASSES, usesMeleeBasicAttack } from '../js/config/combatStyles.js';

describe('combatStyles', () => {
    it('marks melee heroes as melee basic attack', () => {
        [
            'adventurer', 'warrior', 'assassin', 'berserker',
            'paladin', 'slayer', 'capybara'
        ].forEach(id => {
            expect(usesMeleeBasicAttack(id)).toBe(true);
            expect(MELEE_MODEL_CLASSES.has(id)).toBe(true);
        });
    });

    it('keeps caster / ranger as projectile', () => {
        ['ranger', 'elementalist', 'healer', 'necromancer', 'summoner'].forEach(id => {
            expect(usesMeleeBasicAttack(id)).toBe(false);
        });
    });
});
