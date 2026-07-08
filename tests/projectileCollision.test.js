import { describe, it, expect } from 'vitest';
import {
    getEnemyHitRadiusVw,
    projectilePointHitsEnemy,
    projectileSegmentHitsEnemy
} from '../js/utils/projectileCollision.js';

describe('projectileCollision', () => {
    const enemy = {
        typeConfig: { size: 40 },
        element: {
            style: { left: '50vw', top: '50vh' },
            offsetWidth: 40
        }
    };

    it('detects point hits with expanded pierce radius', () => {
        expect(projectilePointHitsEnemy(50, 50, enemy, 1000, 1000, 0)).toBe(true);
        expect(projectilePointHitsEnemy(80, 50, enemy, 1000, 1000, 0)).toBe(false);
        expect(projectilePointHitsEnemy(80, 50, enemy, 1000, 1000, 35)).toBe(true);
    });

    it('detects segment pierce through enemy between frames', () => {
        const hit = projectileSegmentHitsEnemy(40, 50, 60, 50, enemy, 1000, 1000, 2);
        expect(hit).toBe(true);
    });

    it('returns sensible hit radius from enemy size', () => {
        expect(getEnemyHitRadiusVw(enemy, 1000)).toBeGreaterThan(1);
    });
});
