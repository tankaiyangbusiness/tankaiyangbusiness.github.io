import { describe, it, expect } from 'vitest';
import {
    buildCharacterDescTooltipHtml,
    buildCharacterPassiveTooltipHtml,
    isPassiveHoverTarget,
    resolveCharacterCardTooltipMode
} from '../js/ui/characterSelectTooltipContent.js';
import { getCharacterPassive } from '../js/config/characterPassives.js';

describe('characterSelectTooltipContent', () => {
    it('wraps description HTML in floating-tooltip-inner', () => {
        const html = buildCharacterDescTooltipHtml('A balanced hero.');
        expect(html).toContain('floating-tooltip-inner--desc');
        expect(html).toContain('A balanced hero.');
    });

    it('wraps passive HTML in floating-tooltip-inner with passive tip classes', () => {
        const passive = getCharacterPassive('Warrior');
        const html = buildCharacterPassiveTooltipHtml(passive);
        expect(html).toContain('floating-tooltip-inner--passive');
        expect(html).toContain('passive-tip-name');
        expect(html).toContain(passive.name);
    });

    it('detects passive hover targets inside character-passive-reveal', () => {
        const summary = { closest: (sel) => (sel.includes('passive') ? summary : null) };
        const body = { closest: () => null };
        expect(isPassiveHoverTarget(summary)).toBe(true);
        expect(isPassiveHoverTarget(body)).toBe(false);
    });

    it('resolves tooltip mode for card regions', () => {
        expect(resolveCharacterCardTooltipMode({
            overPassive: false,
            hasDesc: true,
            hasPassive: true
        })).toBe('desc');

        expect(resolveCharacterCardTooltipMode({
            overPassive: true,
            hasDesc: true,
            hasPassive: true
        })).toBe('passive');

        expect(resolveCharacterCardTooltipMode({
            overPassive: true,
            hasDesc: false,
            hasPassive: true
        })).toBe('passive');

        expect(resolveCharacterCardTooltipMode({
            overPassive: false,
            hasDesc: false,
            hasPassive: false
        })).toBe('none');
    });

    it('returns to desc mode after leaving passive region within the same card', () => {
        const modes = [
            resolveCharacterCardTooltipMode({ overPassive: false, hasDesc: true, hasPassive: true }),
            resolveCharacterCardTooltipMode({ overPassive: true, hasDesc: true, hasPassive: true }),
            resolveCharacterCardTooltipMode({ overPassive: false, hasDesc: true, hasPassive: true })
        ];
        expect(modes).toEqual(['desc', 'passive', 'desc']);
    });
});
