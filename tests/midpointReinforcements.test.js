import { describe, it, expect } from 'vitest';
import { getMidpointReinforcementIntervalMs, rollMidpointReinforcementSwarmSize } from '../js/config/milestoneBosses.js';

describe('midpoint boss reinforcements', () => {
    it('exports Wave 50 reinforcement helpers used by the game loop', () => {
        expect(typeof getMidpointReinforcementIntervalMs()).toBe('number');
        expect(getMidpointReinforcementIntervalMs()).toBeGreaterThan(0);
        expect(rollMidpointReinforcementSwarmSize()).toBeGreaterThanOrEqual(4);
    });
});
