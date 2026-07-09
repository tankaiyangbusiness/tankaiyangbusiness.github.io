import { describe, it, expect, vi, beforeAll } from 'vitest';

function createMockElement() {
    const classList = new Set();
    return {
        className: '',
        style: { left: '', top: '' },
        classList: {
            add: (...c) => c.forEach(x => classList.add(x)),
            remove: (...c) => c.forEach(x => classList.delete(x)),
            contains: c => classList.has(c)
        },
        setAttribute: vi.fn(),
        innerHTML: '',
        remove: vi.fn(),
        offsetWidth: 1
    };
}

beforeAll(() => {
    vi.stubGlobal('document', {
        createElement: () => createMockElement()
    });
    vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
});

import { IllusionCloneManager } from '../js/systems/illusionClone.js';
import { getIllusionConfig } from '../js/config/skills.js';

function createMockGame() {
    const container = {
        appendChild: vi.fn()
    };

    const state = {
        gamePaused: false,
        gameOver: false,
        timeScale: 1,
        stats: { attackSpeed: 2, physicalDamage: 50, attackRange: 150 },
        skillList: { illusion: { level: 3 } },
        skillCooldowns: { illusion: 0 },
        enemies: [],
        trackTimeout: vi.fn(id => id)
    };

    const game = {
        state,
        ui: {
            getPlayerPosition: () => ({ x: 50, y: 50 }),
            els: { gameContainer: container }
        },
        effects: { spawnCastFlash: vi.fn() },
        _attackNearestEnemy: vi.fn()
    };

    return { game, container };
}

describe('IllusionCloneManager', () => {
    it('summons clone off cooldown with scaled damage', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(3);
        const now = cfg.cooldown + 100;

        expect(mgr.trySummon(3, now)).toBe(true);
        expect(mgr.isActive()).toBe(true);
        expect(mgr.skillClone).toBeTruthy();
        expect(game.state.skillCooldowns.illusion).toBe(now);
        expect(mgr.skillClone.damagePercent).toBe(cfg.damagePercent);

        expect(mgr.trySummon(3, now + 100)).toBe(false);
    });

    it('clone attacks at player attack speed with damage multiplier and player AOE', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(5);
        mgr.trySummon(5, cfg.cooldown + 1);
        mgr.skillClone.lastAttackTime = 0;

        mgr.tick(600);
        expect(game._attackNearestEnemy).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            null,
            null,
            expect.objectContaining({
                damageMultiplier: cfg.damagePercent / 100,
                skipPlayerAnim: true,
                rangeCenterX: 50,
                rangeCenterY: 50
            })
        );
    });

    it('dismisses skill clone after duration without removing roam companion', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(1);
        const summonAt = cfg.cooldown + 1;
        mgr.ensureRoamingCompanion(0, { damagePercent: 60 });
        mgr.trySummon(1, summonAt);

        mgr.tick(summonAt + cfg.duration + 1);
        expect(mgr.skillClone).toBeNull();
        expect(mgr.roamClone).toBeTruthy();
        expect(mgr.isActive()).toBe(true);
    });

    it('syncs skill clone position beside player', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(2);
        mgr.trySummon(2, cfg.cooldown + 1);
        mgr.tick(100);
        expect(mgr.skillClone.el.style.left).toBe(`${50 + cfg.offsetVw}vw`);
        expect(mgr.skillClone.el.style.top).toBe('50vh');
    });

    it('roaming ranger illusion advances toward foes with stored coords', () => {
        vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
        const { game } = createMockGame();
        game.state.enemies = [{
            stats: { hp: 10 },
            element: { style: { left: '70vw', top: '50vh' } }
        }];

        const mgr = new IllusionCloneManager(game);
        mgr.ensureRoamingCompanion(0, { damagePercent: 60, speedVw: 2, leashVw: 30 });
        expect(mgr.roamClone.roam).toBe(true);
        expect(mgr.roamClone.x).toBeCloseTo(53.2);

        const before = mgr.roamClone.x;
        mgr.tick(50);
        expect(mgr.roamClone.x).toBeGreaterThan(before);
        expect(mgr.roamClone.el.style.left).toBe(`${mgr.roamClone.x}vw`);
    });

    it('Ranger passive and Illusion skill coexist — skill is not blocked or dismissed', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(3);
        const now = cfg.cooldown + 50;

        mgr.ensureRoamingCompanion(0, { damagePercent: 60 });
        expect(mgr.trySummon(3, now)).toBe(true);

        expect(mgr.roamClone).toBeTruthy();
        expect(mgr.skillClone).toBeTruthy();
        expect(mgr.roamClone.el).not.toBe(mgr.skillClone.el);

        mgr.ensureRoamingCompanion(now + 1, { damagePercent: 60 });
        expect(mgr.skillClone).toBeTruthy();
        expect(mgr.roamClone).toBeTruthy();
    });

    it('both clones attack independently', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(2);
        mgr.ensureRoamingCompanion(0, { damagePercent: 60 });
        mgr.trySummon(2, cfg.cooldown + 1);
        mgr.roamClone.lastAttackTime = 0;
        mgr.skillClone.lastAttackTime = 0;

        mgr.tick(600);
        expect(game._attackNearestEnemy).toHaveBeenCalledTimes(2);
    });
});
