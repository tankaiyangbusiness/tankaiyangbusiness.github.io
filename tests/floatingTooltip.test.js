import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { positionFloatingTooltip } from '../js/utils/floatingTooltip.js';

describe('positionFloatingTooltip', () => {
    /** @type {any} */
    let el;

    beforeEach(() => {
        el = {
            hidden: true,
            style: { left: '', top: '', visibility: '' },
            getBoundingClientRect: () => ({ width: 200, height: 80, left: 0, top: 0, right: 200, bottom: 80 })
        };
        vi.stubGlobal('window', { innerWidth: 800, innerHeight: 600 });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('positions near the pointer and keeps the box on-screen', () => {
        positionFloatingTooltip(el, 100, 120);
        expect(el.hidden).toBe(false);
        expect(el.style.visibility).toBe('visible');
        expect(Number.parseInt(el.style.left, 10)).toBeGreaterThanOrEqual(8);
        expect(Number.parseInt(el.style.top, 10)).toBeGreaterThanOrEqual(8);
    });

    it('flips left when there is no room on the right', () => {
        positionFloatingTooltip(el, 750, 200);
        expect(Number.parseInt(el.style.left, 10)).toBeLessThan(750);
    });
});
