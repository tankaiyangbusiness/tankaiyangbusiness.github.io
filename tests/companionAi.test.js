import { describe, it, expect } from 'vitest';
import {
    companionAiStep,
    stepTowardPx,
    findNearestEnemyAt,
    toPx,
    toVw
} from '../js/utils/companionAi.js';

const IW = 1000;
const IH = 800;

function enemyAt(x, y, hp = 10) {
    return {
        stats: { hp },
        element: { style: { left: `${x}vw`, top: `${y}vh` } }
    };
}

describe('companionAi helpers', () => {
    it('converts vw/vh <-> px consistently', () => {
        const px = toPx(50, 25, IW, IH);
        expect(px).toEqual({ x: 500, y: 200 });
        expect(toVw(px.x, px.y, IW, IH)).toEqual({ x: 50, y: 25 });
    });

    it('steps toward a target in pixel space', () => {
        const next = stepTowardPx({
            x: 0, y: 0, targetX: 100, targetY: 0, speedPx: 20, arriveDist: 5
        });
        expect(next.x).toBeCloseTo(20);
        expect(next.arrived).toBe(false);
    });

    it('finds nearest living enemy', () => {
        const enemies = [enemyAt(10, 50), enemyAt(60, 50), { stats: { hp: 0 }, element: { style: { left: '11vw', top: '50vh' } } }];
        const nearest = findNearestEnemyAt(enemies, 50, 50, IW, IH);
        expect(nearest).toBe(enemies[1]);
    });
});

describe('companionAiStep', () => {
    it('returns to home flank when no enemies', () => {
        const step = companionAiStep(
            { x: 40, y: 50 },
            {
                ownerX: 40,
                ownerY: 50,
                enemies: [],
                speedVw: 1,
                leashVw: 12,
                homeOffsetX: 3,
                homeOffsetY: 0,
                attackRangePx: 45,
                innerWidth: IW,
                innerHeight: IH
            }
        );
        expect(step.mode).toBe('home');
        expect(step.x).toBeGreaterThan(40);
        expect(step.target).toBeNull();
    });

    it('chases a nearby enemy toward attack range', () => {
        const foe = enemyAt(58, 50);
        const step = companionAiStep(
            { x: 42, y: 50 },
            {
                ownerX: 40,
                ownerY: 50,
                enemies: [foe],
                speedVw: 2,
                leashVw: 20,
                homeOffsetX: 2,
                homeOffsetY: 0,
                attackRangePx: 45,
                innerWidth: IW,
                innerHeight: IH
            }
        );
        expect(step.mode).toBe('chase');
        expect(step.target).toBe(foe);
        expect(step.x).toBeGreaterThan(42);
    });

    it('ranged style holds position once inside attack range', () => {
        // Enemy at 50vw = 500px; agent at 47vw = 470px → 30px apart < attackRange 80
        const foe = enemyAt(50, 50);
        const step = companionAiStep(
            { x: 47, y: 50 },
            {
                ownerX: 40,
                ownerY: 50,
                enemies: [foe],
                speedVw: 2,
                leashVw: 20,
                homeOffsetX: 3,
                homeOffsetY: 0,
                attackRangePx: 80,
                style: 'ranged',
                innerWidth: IW,
                innerHeight: IH
            }
        );
        expect(step.mode).toBe('engage');
        expect(step.inAttackRange).toBe(true);
        expect(step.x).toBeCloseTo(47, 5);
    });

    it('ranged style approaches while out of attack range', () => {
        const foe = enemyAt(70, 50);
        const step = companionAiStep(
            { x: 42, y: 50 },
            {
                ownerX: 40,
                ownerY: 50,
                enemies: [foe],
                speedVw: 2,
                leashVw: 40,
                homeOffsetX: 3,
                homeOffsetY: 0,
                attackRangePx: 80,
                style: 'ranged',
                innerWidth: IW,
                innerHeight: IH
            }
        );
        expect(step.mode).toBe('chase');
        expect(step.x).toBeGreaterThan(42);
    });

    it('leashes back when too far from owner', () => {
        const foe = enemyAt(90, 50);
        const step = companionAiStep(
            { x: 85, y: 50 },
            {
                ownerX: 40,
                ownerY: 50,
                enemies: [foe],
                speedVw: 2,
                leashVw: 12,
                homeOffsetX: 2,
                homeOffsetY: 0,
                attackRangePx: 45,
                innerWidth: IW,
                innerHeight: IH
            }
        );
        expect(step.mode).toBe('leash');
        expect(step.x).toBeLessThan(85);
    });
});
