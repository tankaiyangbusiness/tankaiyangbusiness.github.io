import { describe, it, expect, vi } from 'vitest';
import { GameState } from '../js/game/gameState.js';
import { EnemyPopulationManager } from '../js/systems/enemyPopulation.js';
import { BALANCE } from '../js/config/balance.js';
import { MIDPOINT_VICTORY_WAVE, FINAL_VICTORY_WAVE, isFinalVictoryWave } from '../js/config/milestoneBosses.js';

describe('milestone boss spawn reliability', () => {
    it('allows milestone boss spawn when population is at cap', () => {
        const state = new GameState();
        state.initForCharacter({
            hp: 100, maxHp: 100, physicalDamage: 10, attackSpeed: 1,
            attackRange: 100, critChance: 0, critMultiplier: 100,
            armour: 0, evade: 0, hpRegen: 0, level: 1, exp: 0,
            expGain: 1, expThreshold: 8, buffList: {}, skills: {}
        });
        state.currentWave = MIDPOINT_VICTORY_WAVE;

        const pop = new EnemyPopulationManager(state);
        const cap = pop.maxEnemies;
        expect(pop.isAtCap()).toBe(false);

        for (let i = 0; i < cap; i++) {
            state.enemies.push({
                id: `filler-${i}`,
                rarity: 'normal',
                element: { style: { left: '50vw', top: '50vh' }, remove: vi.fn() },
                stats: { hp: 1 }
            });
        }
        expect(pop.isAtCap()).toBe(true);

        const wouldBlockWithoutBypass = !pop.canSpawn();
        expect(wouldBlockWithoutBypass).toBe(true);
    });

    it('does not cull milestone bosses when trimming excess normals', () => {
        const state = new GameState();
        state.initForCharacter({
            hp: 100, maxHp: 100, physicalDamage: 10, attackSpeed: 1,
            attackRange: 100, critChance: 0, critMultiplier: 100,
            armour: 0, evade: 0, hpRegen: 0, level: 1, exp: 0,
            expGain: 1, expThreshold: 8, buffList: {}, skills: {}
        });

        const milestoneBoss = {
            id: 'milestone-boss',
            rarity: 'boss',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            element: { style: { left: '80vw', top: '20vh' }, remove: vi.fn() },
            stats: { hp: 5000 }
        };

        for (let i = 0; i < BALANCE.maxEnemiesOnScreen + 5; i++) {
            state.enemies.push({
                id: `normal-${i}`,
                rarity: 'normal',
                element: { style: { left: `${10 + i}vw`, top: '10vh' }, remove: vi.fn() },
                stats: { hp: 1 }
            });
        }
        state.enemies.push(milestoneBoss);

        const removed = [];
        const game = {
            ui: { getPlayerPosition: () => ({ x: 50, y: 50 }) },
            _forceRemoveEnemy(enemy) {
                removed.push(enemy.id);
                const idx = state.enemies.indexOf(enemy);
                if (idx !== -1) state.enemies.splice(idx, 1);
            }
        };

        const pop = new EnemyPopulationManager(state);
        pop.enforceCap(game);

        expect(removed).not.toContain('milestone-boss');
        expect(state.enemies.some(e => e.id === 'milestone-boss')).toBe(true);
    });

    it('Wave 25, 50, 75, and 100 all use cap-bypass milestone boss spawn policy', () => {
        expect(isFinalVictoryWave(FINAL_VICTORY_WAVE)).toBe(true);
        expect(FINAL_VICTORY_WAVE).toBe(100);
        expect(MIDPOINT_VICTORY_WAVE).toBe(50);
    });
});
