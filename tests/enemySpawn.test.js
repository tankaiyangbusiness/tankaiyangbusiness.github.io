import { describe, it, expect } from 'vitest';
import {
    getSwarmGroupPositions,
    rollSwarmGroupSize,
    getSwarmGroupSizeRange,
    getEdgeSpawnAnchor,
    SWARM_GROUP_SIZE
} from '../js/systems/enemySpawn.js';
import { pickEnemyType, SWARM_UNLOCK_DIFFICULTY } from '../js/config/enemies.js';

describe('enemy spawn helpers', () => {
    it('rolls swarm group size within difficulty-scaled range', () => {
        for (let i = 0; i < 40; i++) {
            const early = rollSwarmGroupSize(3);
            expect(early).toBeGreaterThanOrEqual(2);
            expect(early).toBeLessThanOrEqual(2);

            const mid = rollSwarmGroupSize(8);
            expect(mid).toBeGreaterThanOrEqual(2);
            expect(mid).toBeLessThanOrEqual(3);

            const late = rollSwarmGroupSize(20);
            expect(late).toBeGreaterThanOrEqual(SWARM_GROUP_SIZE.min);
            expect(late).toBeLessThanOrEqual(SWARM_GROUP_SIZE.max);
        }
    });

    it('keeps early swarm packs smaller than late packs', () => {
        const early = getSwarmGroupSizeRange(4);
        const late = getSwarmGroupSizeRange(18);
        expect(early.max).toBeLessThan(late.max);
    });

    it('clusters swarm positions near anchor', () => {
        const positions = getSwarmGroupPositions(50, 50, 4);
        expect(positions).toHaveLength(4);
        positions.forEach(pos => {
            const dist = Math.hypot(pos.x - 50, pos.y - 50);
            expect(dist).toBeLessThan(4);
        });
    });

    it('returns valid edge anchors', () => {
        for (let edge = 0; edge < 4; edge++) {
            const anchor = getEdgeSpawnAnchor(edge);
            expect(anchor.x).toBeGreaterThanOrEqual(-2);
            expect(anchor.y).toBeGreaterThanOrEqual(-2);
        }
    });
});

describe('early-game swarm gating', () => {
    it('does not unlock swarms before the skill-learning window', () => {
        expect(SWARM_UNLOCK_DIFFICULTY).toBeGreaterThanOrEqual(5);
        for (let i = 0; i < 80; i++) {
            expect(pickEnemyType(SWARM_UNLOCK_DIFFICULTY - 1)).not.toBe('swarm');
        }
    });

    it('can roll swarm after unlock', () => {
        const types = new Set();
        for (let i = 0; i < 200; i++) types.add(pickEnemyType(SWARM_UNLOCK_DIFFICULTY + 1));
        expect(types.has('swarm')).toBe(true);
    });
});
