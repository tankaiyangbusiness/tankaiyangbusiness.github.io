import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    buildCharacterStatsGridHtml,
    buildCharacterPassiveRevealHtml,
    getCharacterCardMeta,
    buildCharacterRecordLinesHtml,
    formatCharacterBestRunText,
    formatCharacterWinCount,
    formatCharacterChampionLineText,
    buildCharacterChampionBadgeHtml,
    buildCharacterCard,
    bindCharacterCardSelect
} from '../js/ui/characterSelectCard.js';
import { CHARACTERS } from '../js/config/characters.js';
import { createDefaultMeta } from '../js/systems/metaProgress.js';
import {
    COMBO_ACHIEVEMENT_LIMITS,
    ACHIEVEMENTS
} from '../js/config/achievements.js';
import { createDefaultMeta as createMeta, evaluateAchievements } from '../js/systems/metaProgress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

describe('characterSelectCard', () => {
    it('buildCharacterStatsGridHtml includes all four base stats', () => {
        const warrior = CHARACTERS.find(c => c.name === 'Warrior');
        const html = buildCharacterStatsGridHtml(warrior.stats);

        expect(html).toContain('character-stats-grid');
        expect(html).toContain(String(warrior.stats.maxHp));
        expect(html).toContain(String(warrior.stats.physicalDamage));
        expect(html).toContain(String(warrior.stats.attackRange));
        expect(html).toContain(String(warrior.stats.armour));
    });

    it('buildCharacterPassiveRevealHtml renders tap-friendly details markup', () => {
        const html = buildCharacterPassiveRevealHtml({
            name: 'War Cry Strike',
            icon: '⚔',
            description: 'Melee hits echo extra damage.'
        });
        expect(html).toContain('character-passive-reveal');
        expect(html).toContain('character-passive-reveal-icon');
        expect(html).toContain('War Cry Strike');
        expect(html).toContain('passive-tip-desc');
        expect(html).toContain('Melee hits echo extra damage.');
    });

    it('getCharacterCardMeta shows compact champion line and best run', () => {
        const char = CHARACTERS[0];
        const meta = {
            ...createDefaultMeta(),
            characterRecords: {
                [char.name]: {
                    beatGame: true,
                    victoryCount: 3,
                    level: 50,
                    wave: 120,
                    kills: 500,
                    time: 600
                }
            }
        };

        const result = getCharacterCardMeta(char, meta);
        expect(result.beatGame).toBe(true);
        expect(result.victoryCount).toBe(3);
        expect(result.hasRecord).toBe(true);
        expect(result.championLineText).toBe('3 ★');
        expect(result.bestRunText).toContain('Lv.50');
        expect(result.bestRunText).toContain('Wave 120');

        const badge = buildCharacterChampionBadgeHtml(result);
        expect(badge).toContain('character-champion-badge');
        expect(badge).toContain('>3<');
        expect(badge).toContain('★');

        const html = buildCharacterRecordLinesHtml(result);
        expect(html).toContain('Lv.50');
        expect(html).not.toContain('Best:');
    });

    it('formatCharacterWinCount returns numeric wins', () => {
        expect(formatCharacterWinCount(1, true)).toBe(1);
        expect(formatCharacterWinCount(25, true)).toBe(25);
        expect(formatCharacterWinCount(0, false)).toBe(0);
    });

    it('legacy beatGame without victoryCount displays as 1 ★', () => {
        expect(formatCharacterChampionLineText(0, true)).toBe('1 ★');
        expect(buildCharacterChampionBadgeHtml({
            victoryCount: 0,
            beatGame: true,
            bestRunText: '',
            hasRecord: false
        })).toContain('>1<');
    });

    it('formatCharacterBestRunText formats stats line', () => {
        expect(formatCharacterBestRunText({ level: 12, wave: 40, kills: 90, time: 300 }))
            .toContain('Lv.12');
    });

    describe('buildCharacterCard', () => {
        /** @type {Record<string, Function[]>} */
        let handlers;

        beforeEach(() => {
            handlers = {};
            vi.stubGlobal('document', {
                createElement(tag) {
                    const el = {
                        type: '',
                        className: '',
                        dataset: {},
                        innerHTML: '',
                        tabIndex: 0,
                        setAttribute: vi.fn(),
                        addEventListener(type, fn) {
                            handlers[type] = handlers[type] || [];
                            handlers[type].push(fn);
                        },
                        querySelector: vi.fn(() => null),
                        closest: vi.fn(() => null)
                    };
                    el.tagName = tag;
                    return el;
                }
            });
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('renders compact layout with best run in meta and passive reveal', () => {
            const card = buildCharacterCard(CHARACTERS[0], 0, null);

            expect(card.tagName).toBe('article');
            expect(card.className).toBe('character-card');
            expect(card.dataset.character).toBe(CHARACTERS[0].name);
            expect(card.innerHTML).toContain('character-card-meta');
            expect(card.innerHTML).toContain('character-record-lines');
            expect(card.innerHTML).toContain('character-best-run');
            expect(card.innerHTML).toContain('character-stats-grid');
            expect(card.innerHTML).toContain('character-passive-reveal');
            expect(card.innerHTML).toContain('No record yet');
        });

        it('adds champion styling when character beat the game', () => {
            const char = CHARACTERS[1];
            const meta = {
                ...createDefaultMeta(),
                characterRecords: {
                    [char.name]: { beatGame: true, victoryCount: 2, level: 40, wave: 100, kills: 300, time: 400 }
                }
            };
            const card = buildCharacterCard(char, 1, meta);
            expect(card.className).toContain('character-card--champion');
            expect(card.innerHTML).toContain('character-champion-badge');
            expect(card.innerHTML).toContain('>2<');
            expect(card.innerHTML).toContain('★');
            expect(card.innerHTML).toContain('Lv.40');
            expect(card.innerHTML).not.toContain('Best:');
        });
    });

    describe('bindCharacterCardSelect', () => {
        it('selects on card click but ignores passive details clicks', () => {
            const onSelect = vi.fn();
            const passiveEl = {
                closest(selector) {
                    return selector.includes('passive') ? passiveEl : null;
                }
            };
            const card = {
                dataset: { character: 'Warrior' },
                addEventListener(type, fn) {
                    if (type === 'click') {
                        fn({ target: { closest: () => null } });
                        fn({ target: passiveEl });
                    }
                }
            };

            bindCharacterCardSelect(card, onSelect);
            expect(onSelect).toHaveBeenCalledTimes(1);
            expect(onSelect).toHaveBeenCalledWith('Warrior');
        });
    });
});

describe('character select mobile CSS', () => {
    it('hides inline description on mobile and uses floating tooltips on desktop', () => {
        const css = readFileSync(path.join(root, 'css/character-select.css'), 'utf-8');
        expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.character-desc\s*\{[\s\S]*?display:\s*none/);
        expect(css).toMatch(/@media \(min-width: 769px\)[\s\S]*?\.character-desc\s*\{[\s\S]*?display:\s*none\s*!important/);
        expect(css).toContain('.character-card-meta h3');
        expect(css).toContain('padding-right: 3rem');
    });
});

describe('melee sword slash opacity', () => {
    it('uses 40% peak opacity in the sweep animation', () => {
        const css = readFileSync(path.join(root, 'style.css'), 'utf-8');
        expect(css).toMatch(/@keyframes melee-sword-sweep[\s\S]*?40%\s*\{[^}]*opacity:\s*0\.4/);
    });
});

describe('combo achievement limits', () => {
    it('uses 5-minute window for blitz pack', () => {
        expect(COMBO_ACHIEVEMENT_LIMITS.blitzMaxSeconds).toBe(300);
        const blitz = ACHIEVEMENTS.find(a => a.id === 'combo_blitz');
        expect(blitz?.description).toContain('5 minutes');
    });
});
