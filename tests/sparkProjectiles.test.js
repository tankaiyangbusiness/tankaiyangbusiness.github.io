import { describe, it, expect, vi } from 'vitest';
import { tickSparkProjectiles, SPARK_FRAME_MS } from '../js/systems/sparkProjectiles.js';
import { getSparkConfig } from '../js/config/skills.js';

function makeEnemy(id, x, y, hp = 100) {
    return {
        id,
        stats: { hp, evadeChance: 0 },
        typeConfig: { size: 40 },
        element: {
            style: { left: `${x}vw`, top: `${y}vh` },
            offsetWidth: 40,
            classList: { add() {}, remove() {} }
        }
    };
}

function makeSpark(overrides = {}) {
    const el = {
        style: { left: '', top: '' },
        remove: vi.fn()
    };
    return {
        el,
        bx: 50,
        by: 50,
        vx: 0.5,
        vy: 0,
        expires: 10_000,
        hitIds: new Set(),
        damage: 25,
        wanderChance: 0,
        wanderTurn: 0,
        hitRadiusVw: 8,
        maxPierce: 2,
        ...overrides
    };
}

describe('tickSparkProjectiles', () => {
    it('damages nearby enemies using collision helpers (no ReferenceError)', () => {
        const enemy = makeEnemy('e1', 50, 50);
        const spark = makeSpark();
        const hits = [];

        const remaining = tickSparkProjectiles([spark], {
            simNow: 100,
            simDeltaMs: SPARK_FRAME_MS,
            gamePaused: false,
            gameOver: false,
            enemies: [enemy],
            innerWidth: 1000,
            innerHeight: 800,
            onHit: (e, dmg) => hits.push({ id: e.id, dmg })
        });

        expect(remaining).toHaveLength(1);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].id).toBe('e1');
    });

    it('expires sparks by simulated time', () => {
        const cfg = getSparkConfig(3);
        const spark = makeSpark({ expires: 1000 });
        const remaining = tickSparkProjectiles([spark], {
            simNow: 1000,
            simDeltaMs: 16,
            gamePaused: false,
            gameOver: false,
            enemies: [],
            innerWidth: 1000,
            innerHeight: 800,
            onHit: () => {}
        });
        expect(remaining).toHaveLength(0);
        expect(spark.el.remove).toHaveBeenCalled();
        expect(cfg.duration).toBeGreaterThan(0);
    });

    it('clears sparks when paused without processing hits', () => {
        const enemy = makeEnemy('e1', 50, 50);
        const spark = makeSpark();
        const hits = [];

        const remaining = tickSparkProjectiles([spark], {
            simNow: 100,
            simDeltaMs: 16,
            gamePaused: true,
            gameOver: false,
            enemies: [enemy],
            innerWidth: 1000,
            innerHeight: 800,
            onHit: () => hits.push(1)
        });

        expect(remaining).toHaveLength(0);
        expect(hits).toHaveLength(0);
        expect(spark.el.remove).toHaveBeenCalled();
    });

    it('scales movement with sim delta for 4× speed frames', () => {
        const spark = makeSpark({ bx: 10, by: 10, vx: 1, vy: 0, hitRadiusVw: 1 });
        tickSparkProjectiles([spark], {
            simNow: 100,
            simDeltaMs: SPARK_FRAME_MS * 4,
            gamePaused: false,
            gameOver: false,
            enemies: [],
            innerWidth: 1000,
            innerHeight: 800,
            onHit: () => {}
        });
        expect(spark.bx).toBeGreaterThan(13);
    });
});
