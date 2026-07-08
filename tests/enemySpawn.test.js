import { describe, it, expect } from 'vitest';
import {
    getSwarmGroupPositions,
    rollSwarmGroupSize,
    getEdgeSpawnAnchor,
    SWARM_GROUP_SIZE
} from '../js/systems/enemySpawn.js';

describe('enemy spawn helpers', () => {
    it('rolls swarm group size within configured range', () => {
        for (let i = 0; i < 30; i++) {
            const size = rollSwarmGroupSize();
            expect(size).toBeGreaterThanOrEqual(SWARM_GROUP_SIZE.min);
            expect(size).toBeLessThanOrEqual(SWARM_GROUP_SIZE.max);
        }
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
