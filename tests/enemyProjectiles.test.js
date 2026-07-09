import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnemyProjectileManager } from '../js/systems/enemyProjectiles.js';
import { RUNTIME_BUDGET } from '../js/config/runtimeBudget.js';
import { MAX_SIM_ADVANCE_PER_FRAME_MS } from '../js/systems/gameClock.js';

/** Minimal DOM stand-in — project tests run without jsdom. */
function createFakeElement() {
    /** @type {any} */
    const el = {
        className: 'enemy-projectile',
        style: { left: '0', top: '0', display: '' },
        parentElement: null,
        remove() {
            if (!el.parentElement) return;
            const kids = el.parentElement.children;
            const idx = kids.indexOf(el);
            if (idx >= 0) kids.splice(idx, 1);
            el.parentElement = null;
        }
    };
    return el;
}

function makeState(enemies = []) {
    return {
        timeScale: 4,
        gamePaused: false,
        gameOver: false,
        enemies
    };
}

describe('EnemyProjectileManager', () => {
    /** @type {EnemyProjectileManager} */
    let mgr;
    /** @type {any} */
    let container;
    /** @type {typeof document|undefined} */
    let originalDocument;

    beforeEach(() => {
        originalDocument = globalThis.document;
        // @ts-expect-error test shim
        globalThis.document = {
            createElement() {
                return createFakeElement();
            }
        };
        container = {
            children: [],
            appendChild(child) {
                child.parentElement = container;
                container.children.push(child);
            }
        };
        mgr = new EnemyProjectileManager(makeState(), container);
    });

    afterEach(() => {
        if (originalDocument) globalThis.document = originalDocument;
        else delete globalThis.document;
    });

    it('uses configured fixed projectile cap', () => {
        expect(mgr._maxProjectiles).toBe(RUNTIME_BUDGET.maxProjectiles);
    });

    it('advances projectiles in simulated time and resolves hits', () => {
        let hit = false;
        mgr.spawn({
            x: 10,
            y: 10,
            onHit: () => { hit = true; }
        });

        mgr.tick(1000, {
            getPlayerPosition: () => ({ x: 10, y: 10 }),
            innerWidth: 1000,
            innerHeight: 800
        });

        expect(hit).toBe(true);
        expect(mgr.activeCount).toBe(0);
    });

    it('recycles oldest projectile when over cap without blocking new spawns', () => {
        for (let i = 0; i < mgr._maxProjectiles + 3; i++) {
            mgr.spawn({ x: i, y: i, onHit: () => {} });
        }

        expect(mgr.activeCount).toBe(mgr._maxProjectiles);
    });

    it('removes projectiles when the firing enemy dies', () => {
        mgr = new EnemyProjectileManager(makeState([{ id: 'archer-1', stats: { hp: 10 } }]), container);
        mgr.spawn({ x: 5, y: 5, ownerId: 'archer-1', onHit: () => {} });
        expect(mgr.activeCount).toBe(1);

        mgr.removeForOwner('archer-1');
        expect(mgr.activeCount).toBe(0);
    });

    it('culls orphaned projectiles during tick when owner is gone', () => {
        mgr = new EnemyProjectileManager(makeState([]), container);
        mgr.spawn({ x: 5, y: 5, ownerId: 'archer-dead', onHit: () => {} });
        mgr.tick(16, {
            getPlayerPosition: () => ({ x: 50, y: 50 }),
            innerWidth: 1000,
            innerHeight: 800
        });
        expect(mgr.activeCount).toBe(0);
    });

    it('registers a hit during a large 4× sim step without tunneling through the player', () => {
        mgr = new EnemyProjectileManager(makeState(), container);
        let hit = false;
        mgr.spawn({
            x: 46,
            y: 50,
            onHit: () => { hit = true; }
        });

        mgr.tick(MAX_SIM_ADVANCE_PER_FRAME_MS, {
            getPlayerPosition: () => ({ x: 50, y: 50 }),
            innerWidth: 1920,
            innerHeight: 1080
        });

        expect(hit).toBe(true);
        expect(mgr.activeCount).toBe(0);
    });

    it('uses slower archer projectile speed from runtime config', () => {
        expect(mgr._speedVwPerSec).toBe(RUNTIME_BUDGET.enemyProjectileSpeedVwPerSec);
        expect(mgr._speedVwPerSec).toBeLessThan(90);
        expect(mgr._maxStepVw).toBe(RUNTIME_BUDGET.enemyProjectileMaxStepVw);
    });
});
