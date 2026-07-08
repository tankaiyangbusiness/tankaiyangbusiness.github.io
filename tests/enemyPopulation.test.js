import { describe, it, expect } from 'vitest';
import { GameState } from '../js/game/gameState.js';
import { EnemyPopulationManager } from '../js/systems/enemyPopulation.js';
import { BALANCE } from '../js/config/balance.js';

describe('EnemyPopulationManager warmup spawn curve', () => {
    it('starts above the previous 0.30 floor so early waves have more enemies', () => {
        const pop = new EnemyPopulationManager(new GameState());
        expect(BALANCE.warmupSpawnMultiplier).toBeGreaterThanOrEqual(0.45);
        expect(pop.getSpawnMultiplier(0)).toBeCloseTo(BALANCE.warmupSpawnMultiplier, 5);
    });

    it('reaches exactly 1.0 after warmup (late/end game unchanged)', () => {
        const pop = new EnemyPopulationManager(new GameState());
        expect(pop.getSpawnMultiplier(BALANCE.warmupSeconds)).toBe(1);
        expect(pop.getSpawnMultiplier(BALANCE.warmupSeconds + 60)).toBe(1);
        expect(pop.getSpawnMultiplier(BALANCE.warmupSeconds * 2)).toBe(1);
    });

    it('ease-out raises early mid-warmup density vs linear', () => {
        const pop = new EnemyPopulationManager(new GameState());
        const mid = BALANCE.warmupSeconds * 0.25;
        const actual = pop.getSpawnMultiplier(mid);
        const floor = BALANCE.warmupSpawnMultiplier;
        const linear = floor + (1 - floor) * (mid / BALANCE.warmupSeconds);
        // Ease < 1 ⇒ t^ease > t for t in (0,1) ⇒ denser early packs
        expect(actual).toBeGreaterThan(linear);
        expect(actual).toBeLessThan(1);
    });

    it('is monotonically non-decreasing during warmup', () => {
        const pop = new EnemyPopulationManager(new GameState());
        let prev = 0;
        for (let t = 0; t <= BALANCE.warmupSeconds; t += 15) {
            const m = pop.getSpawnMultiplier(t);
            expect(m).toBeGreaterThanOrEqual(prev - 1e-9);
            prev = m;
        }
    });
});
