import { describe, it, expect } from 'vitest';
import { BuffTracker } from '../js/systems/buffTracker.js';

describe('BuffTracker', () => {
    it('applies and expires duration buffs', () => {
        const t = new BuffTracker();
        const now = 1000;
        t.apply({
            id: 'frenzy',
            name: 'Blood Frenzy',
            icon: '🩸',
            description: '+50% AS',
            durationMs: 5000,
            now
        });
        expect(t.has('frenzy')).toBe(true);
        const mid = t.getActiveBuffs(now + 2500);
        expect(mid).toHaveLength(1);
        expect(mid[0].remainingRatio).toBeCloseTo(0.5);
        expect(t.tick(now + 5000)).toEqual(['frenzy']);
        expect(t.has('frenzy')).toBe(false);
        expect(t.getActiveBuffs(now + 5000)).toHaveLength(0);
    });

    it('refreshes existing buff on re-apply', () => {
        const t = new BuffTracker();
        t.apply({ id: 'as', name: 'AS', icon: '⚡', description: '+16%', durationMs: 3000, now: 0 });
        t.apply({ id: 'as', name: 'AS', icon: '⚡', description: '+32%', durationMs: 3000, now: 2000 });
        const active = t.getActiveBuffs(2500);
        expect(active).toHaveLength(1);
        expect(active[0].remainingMs).toBe(2500);
        expect(active[0].description).toBe('+32%');
    });

    it('clears all buffs', () => {
        const t = new BuffTracker();
        t.apply({ id: 'a', name: 'A', icon: 'A', description: 'a', durationMs: 1000, now: 0 });
        t.clear();
        expect(t.getActiveBuffs(0)).toHaveLength(0);
    });
});
