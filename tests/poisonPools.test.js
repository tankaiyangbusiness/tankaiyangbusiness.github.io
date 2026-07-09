import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PoisonPoolManager } from '../js/systems/poisonPools.js';
import { getPoisonBottleConfig } from '../js/config/skills.js';
import { initGameClock, advanceGameClock } from '../js/systems/gameClock.js';
import { GameState } from '../js/game/gameState.js';

function createFakeElement() {
    /** @type {any} */
    const el = {
        className: 'poison-pool',
        style: { left: '0', top: '0', width: '', height: '' },
        parentElement: null,
        classList: {
            _set: new Set(),
            add(c) { this._set.add(c); },
            remove(c) { this._set.delete(c); },
            contains(c) { return this._set.has(c); }
        },
        innerHTML: '',
        querySelector() { return { classList: { add() {}, remove() {} } }; },
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

describe('PoisonPoolManager', () => {
    /** @type {PoisonPoolManager} */
    let mgr;
    /** @type {GameState} */
    let state;
    /** @type {typeof document|undefined} */
    let originalDocument;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(2_000_000);
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(0); return 1; });
        vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
        originalDocument = globalThis.document;
        // @ts-expect-error test shim
        globalThis.document = { createElement: () => createFakeElement() };

        state = new GameState();
        initGameClock(state);
        const container = {
            children: [],
            appendChild(child) {
                child.parentElement = container;
                container.children.push(child);
            }
        };
        mgr = new PoisonPoolManager({
            state,
            ui: { els: { gameContainer: container } },
            skillRanges: { showImpactArea() {} },
            _dealSkillDamageToEnemy() {}
        });
        state.enemies = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        if (originalDocument) globalThis.document = originalDocument;
        else delete globalThis.document;
    });

    it('expires pools using simulated time, not wall clock', () => {
        const cfg = getPoisonBottleConfig(3);
        mgr.createPool(50, 50, 3, 100);
        expect(mgr.pools).toHaveLength(1);

        mgr.tick(0);
        expect(mgr.pools).toHaveLength(1);

        mgr.tick(cfg.poolDuration - 1);
        expect(mgr.pools).toHaveLength(1);

        mgr.tick(cfg.poolDuration);
        expect(mgr.pools).toHaveLength(0);
    });
});
