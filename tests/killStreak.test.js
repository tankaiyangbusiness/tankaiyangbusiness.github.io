import { describe, it, expect } from 'vitest';
import { KillStreakTracker } from '../js/systems/killStreak.js';

describe('KillStreakTracker', () => {
    it('builds streak within window', () => {
        const tracker = new KillStreakTracker();
        tracker.recordKill(1000, 0.02, 0.22);
        tracker.recordKill(1500, 0.02, 0.22);
        expect(tracker.streak).toBe(2);
        expect(tracker.bestStreak).toBe(2);
    });

    it('resets streak after window expires', () => {
        const tracker = new KillStreakTracker();
        tracker.recordKill(1000, 0.02, 0.22);
        tracker.tick(4000);
        expect(tracker.streak).toBe(0);
    });
});
