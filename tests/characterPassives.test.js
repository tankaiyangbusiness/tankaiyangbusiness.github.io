import { describe, it, expect, vi } from 'vitest';
import {
    CHARACTER_PASSIVES,
    getCharacterPassive,
    getCharacterPassiveId,
    formatPassiveTooltipHtml,
    ELEMENTALIST_ELEMENTS
} from '../js/config/characterPassives.js';
import { CHARACTERS } from '../js/config/characters.js';
import { CharacterPassiveManager } from '../js/systems/characterPassives.js';

describe('character passives config', () => {
    it('defines a passive for every character', () => {
        CHARACTERS.forEach(char => {
            const passive = getCharacterPassive(char.name);
            expect(passive).toBeTruthy();
            expect(passive.icon).toBeTruthy();
            expect(passive.name.length).toBeGreaterThan(2);
            expect(passive.description.length).toBeGreaterThan(10);
        });
        expect(Object.keys(CHARACTER_PASSIVES)).toHaveLength(CHARACTERS.length);
    });

    it('builds tooltip html with name and description', () => {
        const html = formatPassiveTooltipHtml(getCharacterPassive('Adventurer'));
        expect(html).toContain("Explorer");
        expect(html).toContain('passive-tip-desc');
        expect(html).toContain('+50%');
        expect(html).not.toContain('expGain');
    });

    it('warrior passive uses 50% explode chance and states splash damage', () => {
        const warrior = getCharacterPassive('Warrior');
        expect(warrior.params.chance).toBe(50);
        expect(warrior.description).toContain('50%');
        expect(warrior.description).toContain('55%');
    });

    it('healer passive states regen damage percent', () => {
        const healer = getCharacterPassive('Healer');
        expect(healer.description).toContain('35%');
        expect(healer.description).toContain('HP Regen');
    });

    it('capybara passive states weapon damage percent', () => {
        const capy = getCharacterPassive('Capybara');
        expect(capy.description).toContain('60%');
    });

    it('maps elementalist elements', () => {
        expect(ELEMENTALIST_ELEMENTS.has('fire')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('cold')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('lightning')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('poison')).toBe(false);
        expect(ELEMENTALIST_ELEMENTS.has('chaos')).toBe(false);
    });
});

describe('CharacterPassiveManager', () => {
    function createMockGame(overrides = {}) {
        const skillRanges = { showImpactArea: vi.fn() };
        return {
            state: {
                gamePaused: false,
                gameOver: false,
                simulatedMs: 0,
                stats: {
                    hp: 100,
                    maxHp: 100,
                    physicalDamage: 20,
                    attackSpeed: 2,
                    hpRegen: 10,
                    attackRange: 150,
                    expGain: 1
                },
                enemies: [],
                skillList: { illusion: { level: 0 } },
                ...overrides.state
            },
            ui: {
                getPlayerPosition: () => ({ x: 50, y: 50 }),
                els: { gameContainer: { appendChild() {} } },
                setCharacterPassive: vi.fn(),
                clearCharacterPassive: vi.fn(),
                updatePassiveHud: vi.fn()
            },
            effects: { spawnCastFlash: vi.fn(), spawnMegaExplosion: vi.fn(), spawnDamageNumber: vi.fn() },
            illusionClone: null,
            buffTracker: { apply: vi.fn(), remove: vi.fn(), clear: vi.fn() },
            skillRanges,
            _dealSkillDamageToEnemy: vi.fn(),
            _applySlow: vi.fn(),
            ...overrides
        };
    }

    it('boosts adventurer exp gain', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Adventurer');
        expect(mgr.modifyExpGain(1)).toBeCloseTo(1.5);
        mgr.cleanup();
    });

    it('boosts elementalist elemental skill damage', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Elementalist');
        expect(mgr.modifySkillDamage(100, { skillId: 'fireball' })).toBe(150);
        expect(mgr.modifySkillDamage(100, { skillId: 'spark' })).toBe(150);
        expect(mgr.modifySkillDamage(100, { skillId: 'poisonBottle' })).toBe(100);
        expect(mgr.modifySkillDamage(100, { skillId: 'poisonDagger' })).toBe(100);
        expect(mgr.modifySkillDamage(100, { element: 'fire' })).toBe(150);
        mgr.cleanup();
    });

    it('boosts slayer physical skill and basic damage', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Slayer');
        expect(mgr.modifySkillDamage(100, { skillId: 'hammerSweep' })).toBe(150);
        expect(mgr.modifySkillDamage(100, { skillId: 'throwSpear' })).toBe(150);
        expect(mgr.modifySkillDamage(100, { skillId: 'fireball' })).toBe(100);
        expect(mgr.modifyPhysicalDamage(100)).toBe(150);
        mgr.cleanup();
    });

    it('absorbs paladin shield damage first and refreshes HUD', () => {
        const game = createMockGame({ state: { simulatedMs: 0, stats: { hp: 1000, maxHp: 1000, physicalDamage: 20, attackSpeed: 2, hpRegen: 10, attackRange: 150, expGain: 1 } } });
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Paladin');
        const shieldBefore = mgr.getShieldState().current;
        expect(shieldBefore).toBe(100);
        const remaining = mgr.absorbDamage(5);
        expect(mgr.getShieldState().current).toBe(shieldBefore - 5);
        expect(remaining).toBe(0);
        expect(game.ui.updatePassiveHud).toHaveBeenCalled();
        mgr.cleanup();
    });

    it('paladin shield tracks 10% of current max HP', () => {
        const game = createMockGame({ state: { simulatedMs: 0, stats: { hp: 1000, maxHp: 1000, physicalDamage: 20, attackSpeed: 2, hpRegen: 10, attackRange: 150, expGain: 1 } } });
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Paladin');
        expect(mgr.getShieldState().max).toBe(100);

        game.state.stats.maxHp = 1500;
        mgr.tick(16);
        expect(mgr.getShieldState().max).toBe(150);
        mgr.cleanup();
    });

    it('paladin shield repairs every 15 seconds of simulated time', () => {
        const game = createMockGame({ state: { simulatedMs: 0, stats: { hp: 1000, maxHp: 1000, physicalDamage: 20, attackSpeed: 2, hpRegen: 10, attackRange: 150, expGain: 1 } } });
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Paladin');
        mgr.absorbDamage(100);
        expect(mgr.getShieldState().current).toBe(0);

        mgr.tick(15000);
        expect(mgr.getShieldState().current).toBe(100);
        mgr.cleanup();
    });

    it('berserker frenzy activates on simulated clock', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Berserker');
        expect(game.state.stats.attackSpeed).toBe(2);

        mgr.tick(1);
        expect(game.state.stats.attackSpeed).toBe(3);
        expect(game.buffTracker.apply).toHaveBeenCalled();
        mgr.cleanup();
    });

    it('necromancer raises a zombie on simulated clock', () => {
        vi.stubGlobal('document', {
            createElement: () => ({
                className: '',
                innerHTML: '',
                style: {},
                remove() {}
            })
        });
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Necromancer');

        mgr.tick(1);
        expect(mgr._zombie).toBeTruthy();
        expect(game.buffTracker.apply).toHaveBeenCalled();
        mgr.cleanup();
        vi.unstubAllGlobals();
    });

    it('healer pulse shows holy impact area', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Healer');

        mgr.tick(2500);
        expect(game.skillRanges.showImpactArea).toHaveBeenCalledWith(
            50,
            50,
            getCharacterPassive('Healer').params.radiusPx,
            'holy',
            650
        );
        mgr.cleanup();
    });

    it('capybara snack shows cold impact area', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Capybara');

        mgr.tick(4000);
        expect(game.skillRanges.showImpactArea).toHaveBeenCalledWith(
            50,
            50,
            getCharacterPassive('Capybara').params.radiusPx,
            'cold',
            700
        );
        mgr.cleanup();
    });

    it('returns null for unknown characters', () => {
        expect(getCharacterPassiveId('Nobody')).toBeNull();
    });

    it('balances companion damage percents', () => {
        expect(getCharacterPassive('Summoner').params.damagePercent).toBe(30);
        expect(getCharacterPassive('Necromancer').params.damagePercent).toBe(100);
        expect(getCharacterPassive('Ranger').params.damagePercent).toBe(60);
    });

    it('paladin shield repairs every 15 seconds', () => {
        expect(getCharacterPassive('Paladin').params.repairIntervalMs).toBe(15000);
    });

    it('necromancer zombie lasts longer than before', () => {
        expect(getCharacterPassive('Necromancer').params.durationMs).toBeGreaterThanOrEqual(12000);
    });
});
