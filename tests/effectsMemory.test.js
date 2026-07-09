import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EffectManager } from '../js/systems/effects.js';

/** Minimal DOM stand-in — project tests run without jsdom. */
function createFakeElement() {
    /** @type {any} */
    const el = {
        className: '',
        style: {
            left: '',
            top: '',
            width: '',
            transform: '',
            setProperty() {},
            removeProperty() {}
        },
        innerHTML: '',
        textContent: '',
        parentElement: null,
        children: [],
        classList: {
            _set: new Set(),
            add(c) { this._set.add(c); },
            remove(c) { this._set.delete(c); },
            contains(c) { return this._set.has(c); }
        },
        appendChild(child) {
            child.parentElement = el;
            el.children.push(child);
            return child;
        },
        remove() {
            if (!el.parentElement) return;
            const kids = el.parentElement.children;
            const idx = kids.indexOf(el);
            if (idx >= 0) kids.splice(idx, 1);
            el.parentElement = null;
        },
        querySelector() { return null; },
        offsetWidth: 1
    };
    return el;
}

describe('EffectManager memory safety', () => {
    /** @type {any} */
    let container;
    /** @type {EffectManager} */
    let effects;

    beforeEach(() => {
        vi.useFakeTimers();
        container = createFakeElement();
        vi.stubGlobal('document', {
            createElement: () => createFakeElement(),
            body: container
        });
        vi.stubGlobal('requestAnimationFrame', (cb) => {
            cb(0);
            return 1;
        });
        vi.stubGlobal('window', {
            innerWidth: 1000,
            innerHeight: 800
        });
        effects = new EffectManager(container);
    });

    afterEach(() => {
        effects?.cleanup();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('tracks loot bursts and removes them from activeEffects after lifetime', () => {
        effects.spawnLootBurst(50, 50);
        expect(effects.activeEffects.length).toBe(1);
        expect(container.children.length).toBe(1);
        vi.advanceTimersByTime(700);
        expect(effects.activeEffects.length).toBe(0);
        expect(container.children.length).toBe(0);
    });

    it('tracks exp orbs and prunes from activeEffects', () => {
        effects.spawnExpOrbs(40, 40, 3);
        expect(effects.activeEffects.length).toBe(3);
        vi.advanceTimersByTime(800);
        expect(effects.activeEffects.length).toBe(0);
        // Pooled nodes stay in the container (hidden) for reuse — no DOM churn.
        expect(container.children.length).toBe(3);
    });

    it('trims oldest effects when over the soft cap', () => {
        effects.maxEffects = 5;
        for (let i = 0; i < 12; i++) effects.spawnHitEffect(i, i, 'physical');
        expect(effects.activeEffects.length).toBeLessThanOrEqual(5);
        expect(container.children.length).toBeLessThanOrEqual(5);
    });

    it('cleanup clears timers and owned DOM nodes', () => {
        effects.spawnCastFlash(10, 10, 'fire');
        effects.spawnMegaExplosion(20, 20, 'fire');
        expect(effects.activeEffects.length).toBeGreaterThan(0);
        effects.cleanup();
        expect(effects.activeEffects.length).toBe(0);
        expect(container.children.length).toBe(0);
    });

    it('keeps the same effect cap at 4× — only lifetimes scale with speed', () => {
        effects.setTimeScale(4);
        expect(effects.maxEffects).toBe(64);
        for (let i = 0; i < 40; i++) effects.spawnHitEffect(i, i, 'physical');
        expect(effects.activeEffects.length).toBeLessThanOrEqual(64);
        expect(container.children.length).toBeLessThanOrEqual(64);
    });

    it('rate-limits floating damage numbers under burst pressure', () => {
        let spawned = 0;
        for (let i = 0; i < 30; i++) {
            if (effects.spawnDamageNumber(i, i, i, false, 'physical')) spawned++;
        }
        expect(spawned).toBeLessThanOrEqual(10);
    });

    it('pools damage numbers for reuse instead of allocating each spawn', () => {
        effects.spawnDamageNumber(10, 10, 42, false, 'physical');
        expect(effects.activeEffects.length).toBe(1);
        vi.advanceTimersByTime(1200);
        expect(effects.activeEffects.length).toBe(0);
        effects.spawnDamageNumber(12, 12, 7, false, 'physical');
        expect(effects.activeEffects.length).toBe(1);
    });
});
