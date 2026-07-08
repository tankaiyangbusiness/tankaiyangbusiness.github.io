import { describe, it, expect } from 'vitest';
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
        expect(html).toContain('EXP');
    });

    it('maps elementalist elements', () => {
        expect(ELEMENTALIST_ELEMENTS.has('fire')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('cold')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('lightning')).toBe(true);
        expect(ELEMENTALIST_ELEMENTS.has('poison')).toBe(false);
    });
});

describe('CharacterPassiveManager', () => {
    function createMockGame(characterName = 'Adventurer') {
        return {
            state: {
                gamePaused: false,
                gameOver: false,
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
                skillList: { illusion: { level: 0 } }
            },
            ui: {
                getPlayerPosition: () => ({ x: 50, y: 50 }),
                els: { gameContainer: { appendChild() {} } },
                setCharacterPassive() {},
                clearCharacterPassive() {},
                updatePassiveHud() {}
            },
            effects: { spawnCastFlash() {}, spawnMegaExplosion() {}, spawnDamageNumber() {} },
            illusionClone: null,
            buffTracker: { apply() {}, remove() {}, clear() {} },
            _dealSkillDamageToEnemy() {},
            _applySlow() {},
            skillRanges: { showImpactArea() {} }
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
        expect(mgr.modifySkillDamage(100, 'fire')).toBe(150);
        expect(mgr.modifySkillDamage(100, 'poison')).toBe(100);
        mgr.cleanup();
    });

    it('absorbs paladin shield damage first', () => {
        const game = createMockGame();
        const mgr = new CharacterPassiveManager(game);
        mgr.activate('Paladin');
        const shieldBefore = mgr.getShieldState().current;
        expect(shieldBefore).toBeGreaterThan(0);
        const remaining = mgr.absorbDamage(5);
        expect(mgr.getShieldState().current).toBe(shieldBefore - 5);
        expect(remaining).toBe(0);
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
});
