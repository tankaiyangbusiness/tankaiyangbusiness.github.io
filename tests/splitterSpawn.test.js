import { describe, it, expect } from 'vitest';
import {
    getSplitterFragmentPositions,
    configureSplitFragment
} from '../js/systems/splitterSpawn.js';
import { buildGearCompareTooltipHtml } from '../js/systems/gearGenerator.js';

describe('splitter spawn', () => {
    it('returns one position per fragment around death point', () => {
        const positions = getSplitterFragmentPositions(50, 50, 2);
        expect(positions).toHaveLength(2);
        positions.forEach(pos => {
            const dist = Math.hypot(pos.x - 50, pos.y - 50);
            expect(dist).toBeGreaterThan(0.5);
            expect(dist).toBeLessThan(4);
        });
    });

    it('configures split fragment hp from parent max hp', () => {
        const enemy = {
            stats: { hp: 100, maxHp: 100, exp: 10 },
            element: { classList: { add: () => {} }, title: '' }
        };
        configureSplitFragment(enemy, 80);
        expect(enemy.isSplitFragment).toBe(true);
        expect(enemy.stats.hp).toBe(Math.max(3, Math.floor(80 * 0.18)));
        expect(enemy.stats.maxHp).toBe(enemy.stats.hp);
    });
});

describe('gear compare tooltip', () => {
    const item = {
        id: 'a1',
        name: 'Test Helm',
        rarity: 'magic',
        ilvl: 5,
        slot: 'helmet',
        baseStats: { armour: 10 },
        affixes: []
    };

    it('marks hovered equipped item in title', () => {
        const html = buildGearCompareTooltipHtml(item, item, { hoveredIsEquipped: true });
        expect(html).toContain('Test Helm — Equipped');
        expect(html).toContain('gear-tip-compare-single');
    });

    it('shows side-by-side compare when item is not equipped', () => {
        const equipped = { ...item, id: 'b2', name: 'Old Helm' };
        const html = buildGearCompareTooltipHtml(item, equipped);
        expect(html).toContain('gear-tip-compare-equipped');
        expect(html).not.toContain('gear-tip-compare-single');
    });
});
