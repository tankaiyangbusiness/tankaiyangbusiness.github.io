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
        stats: { attackSpeed: 2, physicalDamage: 50 },
        skillList: { illusion: { level: 3 } },
        skillCooldowns: { illusion: 0 },
        enemies: []
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
        expect(game.state.skillCooldowns.illusion).toBe(now);
        expect(mgr.clone.damagePercent).toBe(cfg.damagePercent);

        expect(mgr.trySummon(3, now + 100)).toBe(false);
    });

    it('clone attacks at player attack speed with damage multiplier', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(5);
        mgr.trySummon(5, cfg.cooldown + 1);
        mgr.clone.lastAttackTime = 0;

        mgr.tick(600);
        expect(game._attackNearestEnemy).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Number),
            null,
            null,
            expect.objectContaining({ damageMultiplier: 0.6, skipPlayerAnim: true })
        );
    });

    it('dismisses clone after duration', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(1);
        const summonAt = cfg.cooldown + 1;
        mgr.trySummon(1, summonAt);

        mgr.tick(summonAt + cfg.duration + 1);
        expect(mgr.isActive()).toBe(false);
    });

    it('syncs clone position beside player', () => {
        const { game } = createMockGame();
        const mgr = new IllusionCloneManager(game);
        const cfg = getIllusionConfig(2);
        mgr.trySummon(2, cfg.cooldown + 1);
        mgr.tick(100);
        expect(mgr.clone.el.style.left).toBe(`${50 + cfg.offsetVw}vw`);
        expect(mgr.clone.el.style.top).toBe('50vh');
    });

    it('roaming ranger illusion advances toward foes with stored coords', () => {
        vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
        const { game } = createMockGame();
        game.state.stats.attackRange = 150;
        game.state.enemies = [{
            stats: { hp: 10 },
            element: { style: { left: '70vw', top: '50vh' } }
        }];

        const mgr = new IllusionCloneManager(game);
        mgr.ensureRoamingCompanion(0, { damagePercent: 60, speedVw: 2, leashVw: 30 });
        expect(mgr.clone.roam).toBe(true);
        expect(mgr.clone.x).toBeCloseTo(53.2);

        const before = mgr.clone.x;
        mgr.tick(50);
        expect(mgr.clone.x).toBeGreaterThan(before);
        expect(mgr.clone.el.style.left).toBe(`${mgr.clone.x}vw`);
    });
});
