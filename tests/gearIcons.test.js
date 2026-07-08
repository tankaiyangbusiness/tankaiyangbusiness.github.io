import { describe, it, expect } from 'vitest';
import {
    getSlotIconHtml,
    getSlotShortLabel,
    GEAR_DOLL_LAYOUT,
    SLOT_ICON_DATA
} from '../js/ui/gearIcons.js';

describe('gearIcons', () => {
    it('returns an icon for every doll slot', () => {
        const slots = GEAR_DOLL_LAYOUT.filter(c => c.slot).map(c => c.slot);
        slots.forEach(slot => {
            const html = getSlotIconHtml(slot);
            expect(html.length).toBeGreaterThan(0);
            expect(html.includes('gear-emoji') || html.includes('gear-slot-svg')).toBe(true);
            expect(getSlotShortLabel(slot)).toBeTruthy();
        });
    });

    it('uses ring, helmet SVG, and body armour emoji icons', () => {
        expect(getSlotIconHtml('ring')).toContain('💍');
        expect(getSlotIconHtml('helmet')).toContain('gear-slot-svg');
        expect(getSlotIconHtml('helmet')).toContain('gear-icon-helmet');
        expect(getSlotIconHtml('bodyArmour')).toContain('👕');
    });
});
